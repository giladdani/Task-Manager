const express = require('express');
const { google } = require('googleapis');
const StatusCodes = require('http-status-codes').StatusCodes;
const EventModel = require('./models/projectevent')
const utils = require('./utils');

// Routing
const router = express.Router();
router.post('/events', (req, res) => { insertEventToCalendar(req, res) });
router.get('/events/google', (req, res) => { getAllEventsGoogle(req, res) });
router.put('/events/google', (req, res) => { updateGoogleEvent(req, res) });
router.post('/events/generated', (req, res) => { insertGeneratedEventsToCalendar(req, res) });
router.put('/events/unexported', (req, res) => { updateUnexportedEvent(req, res) });

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
        const calendarEventsWithCalendarId = calendarEvents.map(event => ({ ...event, calendarId: calendar.id, backgroundColor: background, }));
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
    const colorEntry = colors.at(colorId - 1);
    const background = colorEntry.at(1).background;
    const foreground = colorEntry.at(1).foreground;

    return [background, foreground];
}

const updateGoogleEvent = async (req, res) => {
    const accessToken = utils.getAccessTokenFromRequest(req);
    utils.oauth2Client.setCredentials({ access_token: accessToken });
    const googleCalendarApi = google.calendar({ version: 'v3', auth: utils.oauth2Client });
    const googleEventId = req.body.event.extendedProps.googleEventId; // TODO: add a check that this even exists, and if not return error
    try {
        const response = await googleCalendarApi.events.patch({
            auth: utils.oauth2Client,
            calendarId: req.body.googleCalendarId,
            eventId: googleEventId,
            resource: {
                start: {
                    dateTime: new Date(req.body.event.start)
                },
                end: {
                    dateTime: new Date(req.body.event.end)
                }
            }
        });
        res.status(StatusCodes.OK).send(response);
    }
    catch (err) {
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
}

const updateUnexportedEvent = async (req, res) => {
    let errorMsg = null;

    const eventId = req.body.event.id;
    if (!eventId) {
        res.status(StatusCodes.BAD_REQUEST).send(`No event id.`);
        return;
    }

    const event = req.body.event;
    if (!eventId) {
        res.status(StatusCodes.BAD_REQUEST).send(`No event in request.`);
        return;
    }

    try {
        const docs = await EventModel.updateOne({ 'id': eventId }, event);
    } catch (err) {
        console.log(err);
        errorMsg = err;
    }

    if (errorMsg == null) {
        console.log(`[updateUnexportedEvent] Successfully updated unexported event ${eventId}`);
        res.status(StatusCodes.OK).send(`Successfully updated unexported event ${event.title}`);
    } else {
        console.log("ERROR: Failed to update unexported event.");
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Unknown server error: ' + errorMsg);
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