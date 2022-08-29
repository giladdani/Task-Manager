const express = require('express');
const { google } = require('googleapis');
const StatusCodes = require('http-status-codes').StatusCodes;
const dbUnexportedEvents = require('../../dal/dbUnexportedEvents');
const dbProjects = require('../../dal/dbProjects');
const googleSync = require('../../utils/google-sync.js');
const utils = require('../../utils/utils.js');
const dbGoogleEvents = require('../../dal/dbGoogleEvents');
const eventsUtils = require('./events-utils');

// Routing
const router = express.Router();
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





/* --------------------------------------------------------------
-----------------------------------------------------------------
------------------------- UPDATE EVENT --------------------------
-----------------------------------------------------------------
-------------------------------------------------------------- */

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

        // TODO: add check for forbidden fields - in particulat ProjectTagIds, which should be updated through projects

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
    }
    catch (err) {
        console.error(`[updateEvent] Error!\n${err}`)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error with updating event: ${err}`);
    }
}

const updateGoogleEvent = async (req, res) => {
    try {
        const accessToken = utils.getAccessTokenFromRequest(req);
        let eventId = req.params.id;
        let dbGEvent = await dbGoogleEvents.findOne({id: eventId});
        let [statusCode, msg] = await eventsUtils.patchGoogleEvent(accessToken, dbGEvent, req.body);
        res.status(statusCode).send(msg);
    }
    catch (err) {
        console.error(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error with updating event: ${err}`);
    }
}

const updateUnexportedEvent = async (req, res) => {
    try {
        let eventId = req.params.id;
        let unexEvent = await dbUnexportedEvents.findOne({id: eventId});
        let [statusCode, msg] = await eventsUtils.patchUnexportedEvent(unexEvent, req.body);
        res.status(statusCode).send(msg);
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