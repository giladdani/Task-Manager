const express = require('express');
const {google} = require('googleapis');
const StatusCodes = require('http-status-codes').StatusCodes;
const utils = require('./utils');

// Routing
const router = express.Router();
router.get('/events/google', (req, res) => { getAllEventsGoogle(req, res) });
router.post('/', (req, res) => { createGoogleCalendar(req, res) });
router.post('/events', (req, res) => { insertEventToCalendar(req, res) });
router.post('/events/generated', (req, res) => { insertGeneratedEventsToCalendar(req, res) });
router.put('/events', (req, res) => { updateGoogleEvent(req, res) });

const createGoogleCalendar = async (req, res) => {
    const accessToken = utils.getAccessTokenFromRequest(req);
    utils.oauth2Client.setCredentials({access_token: accessToken});
    const googleCalendarApi = google.calendar({version: 'v3', auth: utils.oauth2Client});

    try{
        const googleRes = await googleCalendarApi.calendars.insert({
            auth: utils.oauth2Client,
            resource: {
              summary: req.body.calendarName,
            }
          })

        res.status(StatusCodes.OK).send(googleRes);
    }
    catch(err){
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }


}

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
        const currDate = new Date();
        const timeMinDate = new Date(currDate).setMonth(currDate.getMonth() - 1);
        const timeMaxDate = new Date(currDate).setMonth(currDate.getMonth() + 3);

        const response = await googleCalendarApi.events.list({
            calendarId: calendarId,
            timeMin: (new Date(timeMinDate)).toISOString(),
            timeMax: (new Date(timeMaxDate)).toISOString(),
            // maxResults: 100,
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
        res.status(StatusCodes.OK).send(response);
    }
    catch(err){
        console.log(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
}

const insertGeneratedEventsToCalendar = async(req, res) => {
    try{
        const accessToken = utils.getAccessTokenFromRequest(req);
        utils.oauth2Client.setCredentials({access_token: accessToken});
        const calendar = google.calendar('v3');

        const events = req.body.events;
        const calendarId = req.body.googleCalendarId;

        // TODO: change this to batch

        for(const event of events) {
            const response = await calendar.events.insert({
                auth: utils.oauth2Client,
                calendarId: calendarId,
                requestBody: {
                    summary: event.title,
                    start:{
                        dateTime: new Date(event.start)
                    },
                    end:{
                        dateTime: new Date(event.end)
                    },
                    extendedProperties: {
                        private: {
                            fullCalendarProjectID: 666,
                        },
                    }
                }
            })
        }

        res.status(StatusCodes.OK).send(response);
    }
    catch(error){
        console.log(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
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
        res.status(StatusCodes.OK).send(response);
    }
    catch(error){
        console.log(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
}

module.exports = router;