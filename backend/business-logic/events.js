const express = require('express');
const { google } = require('googleapis');
const StatusCodes = require('http-status-codes').StatusCodes;
const dbUnexportedEvents = require('../dal/dbUnexportedEvents');
const dbProjects = require('../dal/dbProjects');
const googleSync = require('../utils/google-sync.js');
const utils = require('../utils/utils.js');
const dbGoogleEvents = require('../dal/dbGoogleEvents');

// Routing
const router = express.Router();
router.get('/', (req, res) => { getAllEvents(req, res) });
router.get('/unexported', (req, res) => { getAllUnexportedEvents(req, res) });
router.get('/google', (req, res) => { getGoogleEvents(req, res) });
router.get('/google/unsynced', (req, res) => { getUnsyncedGoogleEvents(req, res) });
router.get('/project/:projectId', (req, res) => { getProjectEvents(req, res) }); // TODO: change route, this is confusing.
router.post('/', (req, res) => { insertEventToCalendar(req, res) });
router.delete('/', (req, res) => { deleteEvent(req, res) });
router.patch('/:id', (req, res) => { updateEvent(req, res) });
router.patch('/unexported/:id', (req, res) => { updateUnexportedEvent(req, res) });
router.patch('/google/:id', (req, res) => { updateGoogleEvent(req, res) });




const getAllUnexportedEvents = async (req, res) => {
    try {
        const userEmail = utils.getEmailFromReq(req);

        dbUnexportedEvents.find({ email: userEmail })
            .then(events => {
                res.status(StatusCodes.OK).send(events);
            })
            .catch(err => {
                console.log(`[getAllUnexportedEvents] Error!\n${err}`);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
            })
    } catch (err) {
        console.log(`[getAllUnexportedEvents] Error!\n${err}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
    }
}

/**
 * Returns the events of a specific project.
 * @param {*} req 
 * @param {*} res 
 */
const getProjectEvents = async (req, res) => {
    let projectEvents = null;
    let error = null;

    try {
        let projectId = req.params.projectId
        console.log(`[getProjectEvents] Start. Project ID: ${req.params.projectId}`)
        let project = await dbProjects.findOne({ id: projectId })
        let email = utils.getEmailFromReq(req);

        if (project.exportedToGoogle) {
            let accessToken = await utils.getAccessTokenFromRequest(req);
            await googleSync.syncGoogleData(accessToken, email);
            projectEvents = await dbGoogleEvents.findByProject(email, projectId);
        } else {
            projectEvents = await dbUnexportedEvents.findByProject(email, projectId);
        }
    } catch (err) {
        console.log(`[getProjectEvents] ERROR:\n${err}`);
        error = err;
    }

    if (!error) {
        res.status(StatusCodes.OK).send(projectEvents);
    } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
}

// TODO: return answer! What is going on here.
const getAllEvents = async (req, res) => {
    const email = utils.getEmailFromReq(req);

    let events = await utils.getAllUserEvents(email);
}

/**
 * The field values you specify replace the existing values. 
 * Fields that you don’t specify in the request remain unchanged. 
 * Array fields, if specified, overwrite the existing arrays; this discards any previous array elements.
 */
const updateEvent = async (req, res) => {
    console.log(`[updateEvent] Start.`)

    try {
        let eventId = req.params.id;
        if (!eventId) {
            let msg = "Missing event id.";
            console.log(`[updateEvent] ${msg}`);
            res.status(StatusCodes.BAD_REQUEST).send(msg);
            return;
        }

        let event = null;

        event = await dbUnexportedEvents.findOne({ id: eventId });
        if (event) {
            updateUnexportedEvent(req, res);
            return;
        }

        event = await dbGoogleEvents.findOne({ id: eventId });
        if (event) {
            updateGoogleEvent(req, res);
            return;
        }

        res.status(StatusCodes.BAD_REQUEST).send("Could not find event matching ID.");

        // ! DELETE if refactoring into specific functions works
        // const event = req.body.event;
        // if (!event) {
        //     res.status(StatusCodes.BAD_REQUEST).send("Must attach event to request.");
        //     return;
        // }

        // const fieldsToUpdate = req.body.fieldsToUpdate;
        // if (!fieldsToUpdate) {
        //     res.status(StatusCodes.BAD_REQUEST).send("Must attach fields to update");
        //     return;
        // }

        // if (utils.isConstraintEvent(event)) {
        //     res.status(StatusCodes.BAD_REQUEST).send("Cannot update constraints from this call.");
        // } else if (utils.isUnexportedProjectEvent(event)) {
        //     updateUnexportedEvent(req, res);
        // } else {
        //     updateGoogleEvent(req, res);
        // }
    }
    catch (err) {
        console.error(`[updateEvent] Error!\n${err}`)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error with updating event: ${err}`);
    }
}

const missingEventUpdateFields = (req) => {
    if (!req) {
        return true;
    }

    if (!req.body) {
        return true;
    }

    if (!req.body.event) {
        return true;
    }

    if (!req.body.fieldsToUpdate) {
        return true;
    }

    if (!req.body.fieldsToUpdate.title) {
        return true;
    }

    if (!req.body.fieldsToUpdate.start) {
        return true;
    }

    if (!req.body.fieldsToUpdate.end) {
        return true;
    }

    return false;
}

const missingUnexportedEventUpdateFields = (req) => {
    if (missingEventUpdateFields(req)) {
        return true;
    }

    if (!req.body.event.id) {
        return true;
    }

    return false;
}

const missingGoogleEventUpdateFields = (req) => {
    if (missingEventUpdateFields(req)) {
        return true;
    }

    if (!req.body.event.extendedProps) {
        return true;
    }

    if (!req.body.event.extendedProps.googleEventId) {
        return true;
    }

    if (!req.body.event.extendedProps.googleCalendarId) {
        return true;
    }

    return false;
}

/**
 * Google Calendar API documentation for Event Patch:
 * https://developers.google.com/calendar/api/v3/reference/events/patch
 * 
 * @param {*} req A client event patch request with fields to update.
 * @returns A google event patch resource object, with all the relevant fields to update.
 */
function getEventPatchFieldsGoogle(req) {
    let resource = {};

    if (req.body.title) resource.summary = req.body.title;
    if (req.body.start) resource.start = { dateTime: new Date(req.body.start) };
    if (req.body.end) resource.end = { dateTime: new Date(req.body.end) };
    if (req.body.tagIds) resource.extendedProperties = { private: { tagIds: req.body.tagIds } };
    if (req.body.projectTagIds) resource.extendedProperties = { private: { projectTagIds: req.body.projectTagIds } };
    if (req.body.ignoredProjectTagIds) resource.extendedProperties = { private: { ignoredProjectTagIds: req.body.ignoredProjectTagIds } };

    return resource;
}

/**
 * MongoDB documentation for updateOne(): 
 * https://www.mongodb.com/docs/manual/reference/method/db.collection.updateOne/
 * 
 * @param {*} req A client event patch request with fields to update.
 * @returns An update object for MongoDB with the relevant fields to update.
 */
function getEventPatchFieldsUnexported(req) {
    let update = {};

    if (req.body.title) update.title = req.body.title;
    if (req.body.start) update.start = req.body.start;
    if (req.body.end) update.end = req.body.end;
    if (req.body.backgroundColor) update.backgroundColor = req.body.backgroundColor;
    if (req.body.tagIds) update.tagIds = req.body.tagIds;
    if (req.body.projectTagIds) update.projectTagIds = req.body.projectTagIds;
    if (req.body.ignoredProjectTagIds) update.ignoredProjectTagIds = req.body.ignoredProjectTagIds;

    update = { $set: update }

    return update;
}

const updateGoogleEvent = async (req, res) => {
    /**
     * Google Calendar API documentation:
     * https://developers.google.com/calendar/api/v3/reference/events/patch
     */
    try {
        const accessToken = utils.getAccessTokenFromRequest(req);
        utils.oauth2Client.setCredentials({ access_token: accessToken });
        const googleCalendarApi = google.calendar({ version: 'v3', auth: utils.oauth2Client });

        /// New code:
        let eventId = req.params.id;
        let dbGEvent = await dbGoogleEvents.findOne({ id: eventId });
        if (!dbGEvent) {
            res.status(StatusCodes.BAD_REQUEST).send("Could not find Google event matching the ID.");
            return;
        }

        if (!utils.accessRoleAllowsWriting_GoogleDBEvent(dbGEvent)) {
            res.status(StatusCodes.FORBIDDEN).send("Access role does not allow updating.");
            return;
        }

        const googleEventId = dbGEvent.id;
        const googleCalendarId = dbGEvent.calendarId;
        let resource = getEventPatchFieldsGoogle(req);
        resource = utils.pullDeletedTagsFromIgnoredGEvent(dbGEvent, resource);
        const params = {
            auth: utils.oauth2Client,
            calendarId: googleCalendarId,
            eventId: googleEventId,
            resource: resource,
        }

        const response = await googleCalendarApi.events.patch(params);
        res.status(response.status).send();

        return;


        // ! DELETE if new code works well
        if (missingGoogleEventUpdateFields(req)) {
            res.status(StatusCodes.BAD_REQUEST).send("Missing fields in the request.");
            return;
        }

        // // if (!utils.accessRoleAllowsWritingFCEvent(req.body.event)) {
        // //     res.status(StatusCodes.FORBIDDEN).send("Access role does not allow updating.");
        // //     return;
        // // }

        // // const googleEventId = req.body.event.extendedProps.googleEventId;
        // // const googleCalendarId = req.body.event.extendedProps.googleCalendarId;
        // // const params = {
        // //     auth: utils.oauth2Client,
        // //     calendarId: googleCalendarId,
        // //     eventId: googleEventId,
        // //     resource: {
        // //         summary: req.body.fieldsToUpdate.title,
        // //         start: {
        // //             dateTime: new Date(req.body.fieldsToUpdate.start)
        // //         },
        // //         end: {
        // //             dateTime: new Date(req.body.fieldsToUpdate.end)
        // //         }
        // //     }
        // // }

        // // const response = await googleCalendarApi.events.patch(params);
        // // res.status(response.status).send();
    }
    catch (err) {
        console.error(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error with updating event: ${err}`);
    }
}

const updateUnexportedEvent = async (req, res) => {
    try {
        let eventId = req.params.id;
        let update = getEventPatchFieldsUnexported(req);

        const docs = await dbUnexportedEvents.updateOne({ id: eventId }, update)
        if (docs.matchedCount === 1 && docs.modifiedCount === 1) {
            console.log(`[updateUnexportedEvent] Successfully updated unexported event ${eventId}`);
            res.status(StatusCodes.OK).send();
        } else {
            console.log("ERROR: Failed to update unexported event.");
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
        }

        return;

        // ! DELETE if new code works welel
        // if (missingUnexportedEventUpdateFields(req)) {
        //     res.status(StatusCodes.BAD_REQUEST).send("Missing fields in the request.");
        //     return;
        // }

        // let fieldsToUpdate = req.body.fieldsToUpdate;
        // let event = req.body.event;
        // event.title = fieldsToUpdate.title;
        // event.start = fieldsToUpdate.start;
        // event.end = fieldsToUpdate.end;
        // const docs = await EventModel.updateOne({ 'id': event.id }, event);
        // if (docs.matchedCount === 1 && docs.modifiedCount === 1) {
        //     console.log(`[updateUnexportedEvent] Successfully updated unexported event ${event.id}`);
        //     res.status(StatusCodes.OK).send();
        // } else {
        //     console.log("ERROR: Failed to update unexported event.");
        //     res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
        // }
    }
    catch (err) {
        console.error(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error with updating event: ${err}`);
    }
}

const deleteEvent = async (req, res) => {
    try {
        const event = req.body.event;
        if (utils.isConstraintEvent(event)) {
            res.status(StatusCodes.BAD_REQUEST).send("Cannot delete constraints from this call.");
        } else if (utils.isUnexportedProjectEvent(event)) {
            deleteUnexportedEvent(req, res);
        } else {
            deleteGoogleEvent(req, res);
        }
    }
    catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error with deleting event: ${err}`);
    }
}

const deleteUnexportedEvent = async (req, res) => {
    const eventId = req.body.event.id;

    try {
        let docs = await dbUnexportedEvents.deleteOne({ 'id': eventId })

        if (docs.deletedCount == 1) {
            res.status(StatusCodes.OK).send();
        } else {
            res.status(StatusCodes.BAD_REQUEST).send("Could not find event ID.");
        }
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error with deleting unexported event: ${err}`);
    }
}

const deleteGoogleEvent = async (req, res) => {
    /**
     * Google delete documentation:
     * https://developers.google.com/calendar/api/v3/reference/events/delete
     */

    const accessToken = utils.getAccessTokenFromRequest(req);
    utils.oauth2Client.setCredentials({ access_token: accessToken });
    const googleCalendarApi = google.calendar({ version: 'v3', auth: utils.oauth2Client });

    if (missingGoogleEventDeleteFields(req)) {
        res.status(StatusCodes.BAD_REQUEST).send("Missing fields necessary for deleting Google event.");
        return;
    }

    const googleEventId = req.body.event.extendedProps.googleEventId;
    const googleCalendarId = req.body.event.extendedProps.googleCalendarId;
    try {
        const response = await googleCalendarApi.events.delete({
            auth: utils.oauth2Client,
            calendarId: googleCalendarId,
            eventId: googleEventId,
        });

        if (response.status === 204 || response.status === 200) {
            res.status(StatusCodes.OK).send();
        } else {
            res.status(response.status).send();
        }
    }
    catch (err) {
        console.error(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
    }
}

const missingGoogleEventDeleteFields = (req) => {
    if (!req.body.event) {
        return true;
    }

    if (!req.body.event.extendedProps) {
        return true;
    }

    if (!req.body.event.extendedProps.googleEventId) {
        return true;
    }

    if (!req.body.event.extendedProps.googleCalendarId) {
        return true;
    }

    return false;
}

const getGoogleEvents = async (req, res) => {
    const email = utils.getEmailFromReq(req);
    const allEvents = await dbGoogleEvents.find({ email: email });
    res.status(StatusCodes.OK).send(allEvents);
}

const getUnsyncedGoogleEvents = async (req, res) => {
    const email = utils.getEmailFromReq(req);
    const accessToken = await utils.getAccessTokenFromRequest(req);
    let unsyncedEvents = [];
    let error = null;

    try {
        unsyncedEvents = await googleSync.syncGoogleData(accessToken, email);
        console.log(`[getUnsyncedGoogleEvents] Fetching for ${email}.`);
        if (unsyncedEvents.length > 0) {
            console.log(`Unsynced events: ${unsyncedEvents.length}.`);
        }
    } catch (err) {
        console.log(`[getUnsyncedGoogleEvents] Error:\n${err}`)
        error = err;
    }

    if (!error) {
        res.status(StatusCodes.OK).send(unsyncedEvents);
    } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
}

const insertEventToCalendar = async (req, res) => {
    try {
        const accessToken = utils.getAccessTokenFromRequest(req);
        utils.oauth2Client.setCredentials({ access_token: accessToken });
        const calendar = google.calendar('v3');
        const response = await calendar.events.insert({
            auth: utils.oauth2Client,
            calendarId: 'primary',
            requestBody: {
                summary: req.body.summary,
                start: {
                    dateTime: new Date(req.body.startDateTime)
                },
                end: {
                    dateTime: new Date(req.body.endDateTime)
                }
            }
        })
        res.status(StatusCodes.OK).send(response);
    }
    catch (error) {
        console.log(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
}

module.exports = router;