const fs = require('fs');
const express = require('express');
const {google} = require('googleapis');
const authHelper = require('./auth_helper.js');

const GOOGLE_CLIENT_ID = '255089907729-d285lq0bfp7kjhpt99m03a3sktpsva5i.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, 'http://localhost:3000');
const REFRESH_TOKEN = "1//09YIF0ysClN6xCgYIARAAGAkSNwF-L9Iroo7bm7L0ZUu4GagMAWRRTdsBWezinyLMjHex_ZrS9vYeNWrvzH_k8cvPM2xLAg4LRp0";  //FIXME:store in DB associated with user

// Routing
const router = express.Router();
router.get('/events', (req, res) => { get_calendar_events(req, res) });
router.post('/events', (req, res) => { insert_event_to_calendar(req, res) });

router.post('/create-tokens', async(req, res) => {
    try{
        const {code} = req.body;
        const {tokens} = await oauth2Client.getToken(code);
        res.send(tokens); //FIXME: DELETE THIS after creating a DB to store this in (don't ever return these tokens to the client)
    }
    catch(error){
        console.log(error);
    }
})

async function insert_event_to_calendar(req, res) {
    try{
        const {summary, startDateTime, endDateTime} = req.body;
        oauth2Client.setCredentials({refresh_token: REFRESH_TOKEN});
        const calendar = google.calendar('v3');
        const response = await calendar.events.insert({
            auth: oauth2Client,
            calendarId: 'primary',
            requestBody: {
                summary: summary,
                start:{
                    dateTime: new Date(startDateTime)
                },
                end:{
                    dateTime: new Date(endDateTime)
                } 
            }
        })
        res.send(response);
    }
    catch(error){
        console.log(error);
    }
}

async function get_calendar_events(req, res){
    oauth2Client.setCredentials({refresh_token: REFRESH_TOKEN});
    const calendar = google.calendar({version: 'v3', auth: oauth2Client});
    calendar.events.list({
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
    }, (err, result) => {
            if(err){
                return console.log('The API returned an error: ' + err);  
            }
            else{
                const events = [];
                res.send(JSON.stringify(result.data.items));
            } 
        }
    );

    // // Load client secrets from a local file.
    // const content = await fs.promises.readFile('credentials.json');
    // // Authorize a client with credentials, then call the Google Calendar API.
    // authHelper.authorize(JSON.parse(content), listEvents, res);

}

function listEvents(auth, res) {
    const calendar = google.calendar({version: 'v3', auth});
    calendar.events.list({
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
    }, (err, result) => {
            if(err){
                return console.log('The API returned an error: ' + err);  
            }
            else{
                const events = [];
                // result.data.items.forEach(element => {
                //     const our_event = getOurEventFromGoogleEvent(element);
                //     events.push(our_event);
                // });

                // res.send(JSON.stringify(events));
                res.send(JSON.stringify(result.data.items));
            } 
        }
    );
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

function getOurEventFromGoogleEvent(event) {
    const new_event = new OurEvent(event.summary);

    return new_event;
}

module.exports = router;