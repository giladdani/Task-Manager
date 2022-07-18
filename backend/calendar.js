const express = require('express');
const {google} = require('googleapis');
const StatusCodes = require('http-status-codes').StatusCodes;
const utils = require('./utils');

// Routing
const router = express.Router();
router.get('/events/google', (req, res) => { getAllEventsGoogle(req, res) });
router.post('/events', (req, res) => { insertEventToCalendar(req, res) });
router.put('/events', (req, res) => { updateGoogleEvent(req, res) });

const getAllEventsGoogle = async(req, res) => {
    let allEvents = [];
    const accessToken = utils.getAccessTokenFromRequest(req);
    utils.oauth2Client.setCredentials({access_token: accessToken});
    const googleCalendarClient = google.calendar({version: 'v3', auth: utils.oauth2Client});
    const allGoogleCalendars = await getAllGoogleCalendars(googleCalendarClient);
    for (const calendar of allGoogleCalendars) {
        const calendarEvents = await getEventsFromCalendar(googleCalendarClient, calendar.id);
        const calendarEventsWithCalendarId = calendarEvents.map(event => ({ ...event, calendarId: calendar.id }));
        allEvents = allEvents.concat(calendarEventsWithCalendarId);
    }
    res.status(StatusCodes.OK).send(allEvents);
}

const getAllGoogleCalendars = async(calendar) => {
    const response = await calendar.calendarList.list({});
    return response.data.items;
}

const getEventsFromCalendar = async(googleCalendarApi, calendarId) => {
    try{
        const response = await googleCalendarApi.events.list({
            calendarId: calendarId,
            timeMin: (new Date()).toISOString(),
            maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime',
        });
        return response.data.items;
    }
    catch(err){
        console.log(err);
    }
}

const updateGoogleEvent = async(req, res) => {
    const accessToken = utils.getAccessTokenFromRequest(req);
    utils.oauth2Client.setCredentials({access_token: accessToken});
    const googleCalendarApi = google.calendar({version: 'v3', auth: utils.oauth2Client});
    try{
        const response = await googleCalendarApi.events.patch({
            auth: utils.oauth2Client,
            calendarId: req.body.googleCalendarId,
            eventId: req.body.event.id,
            resource: {
                start:{
                    dateTime: new Date(req.body.event.start)
                },
                end:{
                    dateTime: new Date(req.body.event.end)
                } 
            }
        });
        res.send(response);
    }
    catch(err){
        console.log(err);
    }
}

const insertEventToCalendar = async(req, res) => {
    try{
        const accessToken = utils.getAccessTokenFromRequest(req);
        utils.oauth2Client.setCredentials({access_token: accessToken});
        const calendar = google.calendar('v3');
        const response = await calendar.events.insert({
            auth: utils.oauth2Client,
            calendarId: 'primary',
            requestBody: {
                summary: req.body.summary,
                start:{
                    dateTime: new Date(req.body.startDateTime)
                },
                end:{
                    dateTime: new Date(req.body.endDateTime)
                }
            }
        })
        res.send(response);
    }
    catch(error){
        console.log(error);
    }
}

module.exports = router;