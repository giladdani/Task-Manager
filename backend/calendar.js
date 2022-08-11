const express = require('express');
const { google } = require('googleapis');
const StatusCodes = require('http-status-codes').StatusCodes;
const EventModel = require('./models/projectevent')
const UserModel = require('./models/user')
const GoogleEventModel = require('./models/googleevent')
const ProjectModel = require('./models/project')
const googleSync = require('./google-sync');
const SharedEventsModel = require('./models/sharedeventsmodel')
const utils = require('./utils');


// Routing
const router = express.Router();
router.get('/events', (req, res) => { getAllEvents(req, res) });
router.get('/events/google', (req, res) => { getGoogleEvents(req, res) });
router.get('/events/google/unsynced', (req, res) => { getUnsyncedGoogleEvents(req, res) });
router.get('/:projectId/events', (req, res) => { getProjectEvents(req, res) });

router.post('/events', (req, res) => { insertEventToCalendar(req, res) });
router.delete('/events', (req, res) => { deleteEvent(req, res) });
router.patch('/events', (req, res) => { updateEvent(req, res) });

router.get('/sharedevents', (req, res) => { getAllSharedEvents(req, res) });
router.post('/sharedevents', (req, res) => { shareEvents(req, res) });
router.post('/events/generated', (req, res) => { insertGeneratedEventsToCalendar(req, res) });

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
        let project = await ProjectModel.findOne({ id: projectId })
        let email = await utils.getEmailFromReq(req);

        if (project.exportedToGoogle) {
            let accessToken = await utils.getAccessTokenFromRequest(req);
            await googleSync.syncGoogleData(accessToken, email);


            projectEvents = await GoogleEventModel.find(
                {
                    'email': email,
                    'extendedProperties.private.fullCalendarProjectId': projectId,
                }
            )
            // projectEvents = await GoogleEventModel.find(
            //     {
            //         email: email,
            //         extendedProperties: {
            //             private: {
            //                 fullCalendarProjectId: projectId,
            //             }
            //         }
            //     }
            // )
        } else {
            projectEvents = await EventModel.find(
                {
                    email: email,
                    projectId: projectId,
                }
            )
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


const getAllEvents = async (req, res) => {
    const email = await utils.getEmailFromReq(req);

    // Get all Google events
    // Get all unexported events

    // const allEvents = await GoogleEventModel.find({ email: email, fetchedByUser: false });
    const allEvents = await GoogleEventModel.find({ email: email });

    res.status(StatusCodes.OK).send(allEvents);

    GoogleEventModel.updateMany(
        { email: email },
        {
            $set:
            {
                fetchedByUser: true,
            }
        })
        .then(res => {
            console.log(`Finished updating user ${email} Google events to fetched.`);
        })
}

const shareEvents = async (req, res) => {

    const userEmail = utils.getEmailFromReq(req);

    let body = {
        allEvents: allEvents,
        shareWithUserEmail: userEmail,
    }

    body.allEvents.forEach(event => {
        event.email = userEmail;
        event.shareWithUser = shareWithUserEmail;
    })

    const docsEvents = await SharedEventsModel.insertMany(allEvents);

    res.status(StatusCodes.OK).send();
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
        docs = await EventModel.deleteOne({ 'id': eventId })
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

const getAllSharedEvents = async (req, res) => {
    const userEmail = await utils.getEmailFromReq(req);
    const allEvents = await SharedEventsModel.find({ 'shareWithUser': userEmail });
    res.status(StatusCodes.OK).send(allEvents);
}

const getGoogleEvents = async (req, res) => {
    const email = await utils.getEmailFromReq(req);

    // const allEvents = await GoogleEventModel.find({ email: email, fetchedByUser: false });
    const allEvents = await GoogleEventModel.find({ email: email });

    res.status(StatusCodes.OK).send(allEvents);

    GoogleEventModel.updateMany(
        { email: email },
        {
            $set:
            {
                fetchedByUser: true,
            }
        })
        .then(res => {
            console.log(`Finished updating user ${email} Google events to fetched.`);
        })
}

const getUnsyncedGoogleEvents = async (req, res) => {
    const email = await utils.getEmailFromReq(req);
    const accessToken = await utils.getAccessTokenFromRequest(req);
    console.log(`[getUnsyncedGoogleEvents] Fetching for ${email}`);
    let unsyncedEvents = [];

    // Method 1: receive unsynced events from Google directly and isert them into DB
    unsyncedEvents = await googleSync.syncGoogleData(accessToken, email);

    // Method 2: receive from DB. Good if we use intervals server-side to update.
    // {    
    //     unsyncedEvents = await GoogleEventModel.find({ email: email, fetchedByUser: false });
    //     GoogleEventModel.updateMany( // Avoid await?
    //     { email: email },
    //     {
    //         $set:
    //         {
    //             fetchedByUser: true,
    //         }
    //     }
    //     )
    // }

    res.status(StatusCodes.OK).send(unsyncedEvents);
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