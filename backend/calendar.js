const express = require('express');
const { google } = require('googleapis');
const StatusCodes = require('http-status-codes').StatusCodes;
const EventModel = require('./models/projectevent')
const SharedEventsModel = require('./models/sharedeventsmodel')
const utils = require('./utils');

// Routing
const router = express.Router();
router.post('/events', (req, res) => { insertEventToCalendar(req, res) });
router.delete('/events', (req, res) => { deleteEvent(req, res) });
router.get('/events/google', (req, res) => { getAllEventsGoogle(req, res) });
router.get('/sharedevents', (req, res) => { getAllSharedEvents(req, res) });
router.post('/sharedevents', (req, res) => { shareEvents(req, res) });



router.patch('/events', (req, res) => { updateEvent(req, res) });
router.post('/events/generated', (req, res) => { insertGeneratedEventsToCalendar(req, res) });

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

const getAllEventsGoogle = async (req, res) => {
    let allEvents = [];
    const accessToken = utils.getAccessTokenFromRequest(req);
    utils.oauth2Client.setCredentials({ access_token: accessToken });
    const googleCalendarClient = google.calendar({ version: 'v3', auth: utils.oauth2Client });
    const allGoogleCalendars = await getAllGoogleCalendars(googleCalendarClient);
    const allGoogleCalendarColors = await getAllGoogleCalendarColors(googleCalendarClient);
    for (const calendar of allGoogleCalendars) {
        const calendarEvents = await getEventsFromCalendar(googleCalendarClient, calendar.id);
        const [background, foreground] = getColorString(calendar, allGoogleCalendarColors);
        const calendarEventsWithCalendarId = calendarEvents.map(event => ({ ...event, calendarId: calendar.id, backgroundColor: background, borderColor: foreground }));
        allEvents = allEvents.concat(calendarEventsWithCalendarId);
    }
    res.status(StatusCodes.OK).send(allEvents);
}

const getAllGoogleCalendars = async (calendar) => {
    const response = await calendar.calendarList.list({});

    return response.data.items;
}

const getAllGoogleCalendarColors = async (calendar) => {
    const response = await calendar.colors.get({});

    return response.data.calendar; // An array of all colors of all calendars, see https://developers.google.com/calendar/api/v3/reference/colors/get
}

const getEventsFromCalendar = async (googleCalendarApi, calendarId) => {
    try {
        const currDate = new Date();
        const timeMinDate = new Date(currDate).setMonth(currDate.getMonth() - 1);
        const timeMaxDate = new Date(currDate).setMonth(currDate.getMonth() + 3);

        const response = await googleCalendarApi.events.list({
            calendarId: calendarId,
            timeMin: (new Date(timeMinDate)).toISOString(),
            timeMax: (new Date(timeMaxDate)).toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        return response.data.items;
    }
    catch (err) {
        console.log(err);
    }
}

const getColorString = (calendar, allGoogleCalendarColors) => {
    /*
    The Google Calendar API for colors was a bit weird for me.
    I kept failing in the code when I treated it as an array.
    To better understand enter the debugger and see how the objects are saved.
    
    https://developers.google.com/calendar/api/v3/reference/colors/get
    https://developers.google.com/calendar/api/v3/reference/colors#resource
    */
    const colorId = Number(calendar.colorId);
    const colors = Object.entries(allGoogleCalendarColors);
    const colorEntry = colors[colorId - 1];
    const background = colorEntry[1].background;
    const foreground = colorEntry[1].foreground;

    return [background, foreground];
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