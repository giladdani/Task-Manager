const { google } = require('googleapis');
const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, `${process.env.FRONTEND_HOST}:${process.env.FRONTEND_PORT}`);
const axios = require('axios').default;
const uuidv4 = require('uuid').v4;
const nodemailer = require('nodemailer');

const EventModel = require('./models/projectevent')
const GoogleEventModel = require('./models/googleevent')


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'taskmanagerworkshop@gmail.com',    //TODO: encrypt and move to .env file
        pass: 'wffmpceddpyyzteg,'
    }
});

const getAccessTokenFromRequest = (req) => {
    return req.headers['access_token'].slice(req.headers['access_token'].lastIndexOf(' ') + 1);
}

const getEmailFromReq = async (req) => {
    const accessToken = getAccessTokenFromRequest(req);
    const email = await getEmailFromAccessToken(accessToken);
    return email;
}

const getAccessTokenFromCode = async (code) => {
    try {
        const { tokens } = await oauth2Client.getToken(code);
        return tokens.access_token;
    }
    catch (error) {
        console.log(error);
    }
}

const getEmailFromAccessToken = async (accessToken) => {
    let email = null;
    try {
        const res = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
        email = res.data.email;
    }
    catch (err) {
        console.log(err);
    }

    return email;
}

const getAvatarUrlFromAccessToken = async (accessToken) => {
    const response = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    return response.data.picture;
}

const generateId = () => {
    return uuidv4();
}

const isConstraintEvent = (event) => {
    if (!event) {
        return false;
    }

    if (!event.extendedProps || !event.extendedProps.isConstraint) {
        return false;
    }

    return event.extendedProps.isConstraint;
}

const isUnexportedProjectEvent = (event) => {
    if (!event) {
        return false;
    }

    if (!event.extendedProps || !event.extendedProps.unexportedEvent) {
        return false;
    }

    return event.extendedProps.unexportedEvent;
}

/**
 * Returns NULL if no project ID could be found.
 * @param {*} event 
 */
const getEventProjectId = (event) => {
    let res = null;

    if (!event) {
        return null;
    }

    if (!event.extendedProps || !event.extendedProps.projectId) {
        return null;
    }

    return event.extendedProps.projectId;
}

const sendEmailToUser = (userEmail) => {
    const subject = "Subject";      // TODO: change as you like
    const body = "Body";

    const mailOptions = {
        from: 'taskmastermta@gmail.com',
        to: userEmail,
        subject: subject,
        text: body
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    })
}

// TODO: move to a better file?
const getAllUserEvents = async (email) => {
    let events = [];

    // TODO: use Promise All here
    const googleEvents = await GoogleEventModel.find({ email: email });
    const unexportedEvents = await EventModel.find({email: email});

    events = events.concat(googleEvents);
    events = events.concat(unexportedEvents);

    return events;
}

/**
 * We need this function and to differentiate between the events because the Google event resource is different than the unexported event resource.
 * They save their dates differently.
 * @param {*} event 
 */
// TODO: maybe just add a field to Google events and check that? Like 'isGoogleEvent'
 const getEventStart = (event) => {
    let date = null;

    if (!event) {
        return null;
    }

    if (event.isGoogleEvent) {
        date = new Date(event.start.dateTime);
    } else {
        date = new Date(event.start);
    }

    return date;
}

const getEventEnd = (event) => {
    let date = null;

    if (!event) {
        return null;
    }

    if (event.isGoogleEvent) {
        date = new Date(event.end.dateTime);
    } else {
        date = new Date(event.end);
    }

    return date;
}

/**
 * 
 * @param {*} event 
 * @returns An array [start, end] with the dates. Null if no valid dates could be found.
 */
const getEventDates = (event) => {
    let start = getEventStart(event);
    let end = getEventEnd(event);

    if (!isValidDate(start)) {
        start = null;
    }

    if (!isValidDate(end)) {
        end = null;
    }

    return [start, end]
}

function isValidDate(date) {
    return date instanceof Date && !isNaN(date);
  }

module.exports = {
    oauth2Client: oauth2Client,
    generateId: generateId,
    getAccessTokenFromRequest: getAccessTokenFromRequest,
    getEmailFromReq: getEmailFromReq,
    getAccessTokenFromCode: getAccessTokenFromCode,
    getEmailFromAccessToken: getEmailFromAccessToken,
    getAvatarUrlFromAccessToken: getAvatarUrlFromAccessToken,
    isConstraintEvent: isConstraintEvent,
    isUnexportedProjectEvent: isUnexportedProjectEvent,
    getEventProjectId: getEventProjectId,
    sendEmailToUser: sendEmailToUser,
    getAllUserEvents: getAllUserEvents,
    getEventStart: getEventStart,
    getEventEnd: getEventEnd,
    getEventDates: getEventDates,
    isValidDate: isValidDate,
}