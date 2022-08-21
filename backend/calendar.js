const express = require('express');
const { google } = require('googleapis');
const StatusCodes = require('http-status-codes').StatusCodes;
const EventModel = require('./models/unexported-event')
const dbUnexportedEvents = require('./dal/dbUnexportedEvents');
const dbProjects = require('./dal/dbProjects');
const googleSync = require('./google-sync');
const utils = require('./utils');
const dbGoogleEvents = require('./dal/dbGoogleEvents');

// Routing
const router = express.Router();
router.get('/events', (req, res) => { getAllEvents(req, res) });
router.get('/events/google', (req, res) => { getGoogleEvents(req, res) });
router.get('/events/google/unsynced', (req, res) => { getUnsyncedGoogleEvents(req, res) });
router.get('/:projectId/events', (req, res) => { getProjectEvents(req, res) });
router.post('/events', (req, res) => { insertEventToCalendar(req, res) });
router.delete('/events', (req, res) => { deleteEvent(req, res) });
router.patch('/events', (req, res) => { updateEvent(req, res) });

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

const updateEvent = async (req, res) => {
    const event = req.body.event;
    if (!event) {
        res.status(StatusCodes.BAD_REQUEST).send("Must attach event to request.");
        return;
    }

    const fieldsToUpdate = req.body.fieldsToUpdate;
    if (!fieldsToUpdate) {
        res.status(StatusCodes.BAD_REQUEST).send("Must attach fields to update");
        return;
    }

    try {
        if (utils.isConstraintEvent(event)) {
            res.status(StatusCodes.BAD_REQUEST).send("Cannot update constraints from this call.");
        } else if (utils.isUnexportedProjectEvent(event)) {
            updateUnexportedEvent(req, res);
        } else {
            updateGoogleEvent(req, res);
        }
    }
    catch (err) {
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

const updateGoogleEvent = async (req, res) => {
    /**
     * Google Calendar API documentation:
     * https://developers.google.com/calendar/api/v3/reference/events/patch
     */
    try {
        const accessToken = utils.getAccessTokenFromRequest(req);
        utils.oauth2Client.setCredentials({ access_token: accessToken });
        const googleCalendarApi = google.calendar({ version: 'v3', auth: utils.oauth2Client });

        if (missingGoogleEventUpdateFields(req)) {
            res.status(StatusCodes.BAD_REQUEST).send("Missing fields in the request.");
            return;
        }

        if (!utils.accessRoleAllowsWritingFCEvent(req.body.event)) {
            res.status(StatusCodes.FORBIDDEN).send("Access role does not allow updating.");
            return;
        }

        const googleEventId = req.body.event.extendedProps.googleEventId;
        const googleCalendarId = req.body.event.extendedProps.googleCalendarId;
        const params = {
            auth: utils.oauth2Client,
            calendarId: googleCalendarId,
            eventId: googleEventId,
            resource: {
                summary: req.body.fieldsToUpdate.title,
                start: {
                    dateTime: new Date(req.body.fieldsToUpdate.start)
                },
                end: {
                    dateTime: new Date(req.body.fieldsToUpdate.end)
                }
            }
        }

        const response = await googleCalendarApi.events.patch(params);
        res.status(response.status).send();
    }
    catch (err) {
        console.error(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error with updating event: ${err}`);
    }
}

const updateUnexportedEvent = async (req, res) => {
    try {
        if (missingUnexportedEventUpdateFields(req)) {
            res.status(StatusCodes.BAD_REQUEST).send("Missing fields in the request.");
            return;
        }

        let fieldsToUpdate = req.body.fieldsToUpdate;
        let event = req.body.event;
        event.title = fieldsToUpdate.title;
        event.start = fieldsToUpdate.start;
        event.end = fieldsToUpdate.end;
        const docs = await EventModel.updateOne({ 'id': event.id }, event);
        if (docs.matchedCount === 1 && docs.modifiedCount === 1) {
            console.log(`[updateUnexportedEvent] Successfully updated unexported event ${event.id}`);
            res.status(StatusCodes.OK).send();
        } else {
            console.log("ERROR: Failed to update unexported event.");
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
        }
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