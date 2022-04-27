const express = require('express');
const {google} = require('googleapis');
const User = require('./models/user');
const EventModel = require('./models/event')
const StatusCodes = require('http-status-codes').StatusCodes;


const GOOGLE_CLIENT_ID = '255089907729-d285lq0bfp7kjhpt99m03a3sktpsva5i.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, 'http://localhost:3000');

// Routing
const router = express.Router();
router.get('/events/google', (req, res) => { getAllEventsGoogle(req, res) });
router.get('/events/regular', (req, res) => { getAllEventsRegular(req, res) });

router.post('/events', (req, res) => { insertEventToCalendar(req, res) });
router.post('/create-tokens', (req, res) => { createTokens(req, res) });

const createTokens = async(req, res) => {
    try{
        const {code} = req.body;
        const {tokens} = await oauth2Client.getToken(code);
        res.send(tokens);
    }
    catch(error){
        console.log(error);
    }
}

const getAllEventsRegular = async(req, res) => {
    const allEvents = await EventModel.find({}); // TODO: find based on user

    res.status(StatusCodes.OK).send(allEvents);
}

const getAllEventsGoogle = async(req, res) => {
    let allEvents = [];

    // Google
    const accessToken = req.headers['access_token'].slice(req.headers['access_token'].lastIndexOf(' ')+1);
    oauth2Client.setCredentials({access_token: accessToken});
    const googleCalendarClient = google.calendar({version: 'v3', auth: oauth2Client});
    const allGoogleCalendars = await getAllGoogleCalendars(googleCalendarClient);
    for (const calendar of allGoogleCalendars) {
        const calendarEvents = await getEventsFromCalendar(googleCalendarClient, calendar.id);
        allEvents = allEvents.concat(calendarEvents);
    }

    res.status(StatusCodes.OK).send(allEvents);
}

const getAllGoogleCalendars = async(calendar) => {
    const response = await calendar.calendarList.list({});
    return response.data.items;
}

const getEventsFromCalendar = async(calendarClient, calendarId) => {
    try{
        const response = await calendarClient.events.list({
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

const insertEventToCalendar = async(req, res) => {
    try{
        // const accessToken = req.headers['access_token'].slice(req.headers['access_token'].lastIndexOf(' ')+1);
        // oauth2Client.setCredentials({access_token: accessToken});
        // const calendar = google.calendar('v3');
        const response = await calendar.events.insert({
            auth: oauth2Client,
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

class OurEvent {
    constructor(summary) {
        this.summary = `${summary}, from the task manager!`;
        this.creation_date = new Date(Date.now()).toLocaleString();
    }
}

class OurCalendar {
    constructor(name, text) {
        this.name = name;
        this.text = text;
    }
}

const getOurEventFromGoogleEvent = (event) => {
    const new_event = new OurEvent(event.summary);

    return new_event;
}

module.exports = router;