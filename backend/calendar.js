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
    const fieldsToUpdate = req.body.fieldsToUpdate;
    let errorMsg = null;
    if (utils.isConstraintEvent(event)) {
        res.status(StatusCodes.BAD_REQUEST).send("Cannot update constraints from this call.");
    } else if (utils.isUnexportedProjectEvent(event)) {
        errorMsg = await updateUnexportedEvent(event, fieldsToUpdate);
    } else {
        errorMsg = await updateGoogleEvent(req);
    }

    if (errorMsg === null) {
        res.status(StatusCodes.OK).send();
    } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error with updating event: ${errorMsg}`);
    }
}

const updateGoogleEvent = async (req) => {
    let errorMsg = null;
    const accessToken = utils.getAccessTokenFromRequest(req);
    utils.oauth2Client.setCredentials({ access_token: accessToken });
    const googleCalendarApi = google.calendar({ version: 'v3', auth: utils.oauth2Client });
    const googleEventId = req.body.event.extendedProps.googleEventId; // TODO: add a check that this even exists, and if not return error
    const googleCalendarId = req.body.event.extendedProps.googleCalendarId; // TODO: add a check that this even exists, and if not return error
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
    try {
        const response = await googleCalendarApi.events.patch(params);
    }
    catch (err) {
        console.log(err);
        errorMsg = err;
    }

    return errorMsg;
}

const updateUnexportedEvent = async (event, fieldsToUpdate) => {
    let errorMsg = null;

    event.title = fieldsToUpdate.title;
    event.start = fieldsToUpdate.start;
    event.end = fieldsToUpdate.end;

    if (!event.id) {
        errorMsg = "No event id.";
        console.log(errorMsg);
        return errorMsg;
    }

    try {
        const docs = await EventModel.updateOne({ 'id': event.id }, event);
    } catch (err) {
        console.log(err);
        errorMsg = err;
    }

    if (errorMsg == null) {
        console.log(`[updateUnexportedEvent] Successfully updated unexported event ${event.id}`);
    } else {
        console.log("ERROR: Failed to update unexported event.");
    }

    return errorMsg;
}

const deleteEvent = async (req, res) => {
    const event = req.body.event;
    let errorMsg = null;
    if (utils.isConstraintEvent(event)) {
        res.status(StatusCodes.BAD_REQUEST).send("Cannot delete constraints from this call.");
    } else if (utils.isUnexportedProjectEvent(event)) {
        errorMsg = await deleteDBEvent(event);
    } else {
        errorMsg = await deleteGoogleEvent(req);
    }

    if (errorMsg === null) {
        res.status(StatusCodes.OK).send();
    } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error with deleting event: ${errorMsg}`);
    }
}

const deleteDBEvent = async (event) => {
    const eventId = event.id;

    let errorMsg = null;
    let docs = null;
    try {
        docs = await dbUnexportedEvents.deleteOne({ 'id': eventId })
    } catch (err) {
        errorMsg = err;
    }

    return errorMsg;
}

const deleteGoogleEvent = async (req) => {
    const accessToken = utils.getAccessTokenFromRequest(req);
    utils.oauth2Client.setCredentials({ access_token: accessToken });
    const googleCalendarApi = google.calendar({ version: 'v3', auth: utils.oauth2Client });
    const googleEventId = req.body.event.extendedProps.googleEventId; // TODO: add a check that this even exists, and if not return error
    const googleCalendarId = req.body.event.extendedProps.googleCalendarId;

    if (!googleEventId) {
        return "Error! No google event id.";
    }

    if (!googleCalendarId) {
        return "Error! No google calendar id.";
    }

    let errorMsg = null;
    try {
        const response = await googleCalendarApi.events.delete({
            auth: utils.oauth2Client,
            calendarId: googleCalendarId,
            eventId: googleEventId,
        });
        // res.status(StatusCodes.OK).send(response);

        // TODO: check that response is 200 OK
    }
    catch (err) {
        console.log(err);
        errorMsg = err;
        // res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }

    return errorMsg;
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