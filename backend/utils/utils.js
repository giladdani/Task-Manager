const { google } = require('googleapis');
const StatusCodes = require('http-status-codes').StatusCodes;
const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, `${process.env.FRONTEND_HOST}:${process.env.FRONTEND_PORT}`);
const axios = require('axios').default;
const uuidv4 = require('uuid').v4;
const nodemailer = require('nodemailer');

const EventModel = require('../models/unexported-event')
const GoogleEventModel = require('../models/google-event')
const consts = require('./consts');

const websiteMainColor = '#282c34';

// TODO: figure out how to make proper use of OAuth 2 - right now we're creating an instance upon every usage and it seems weird
function getOauth2Client() {
    const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, `${process.env.FRONTEND_HOST}:${process.env.FRONTEND_PORT}`);

    return oauth2Client;
}

const googleAccessRole = {
    none: 'none',
    freeBusyReader: 'freeBusyReader',
    reader: 'reader',
    writer: 'writer',
    owner: 'owner',
}

function accessRoleAllowsWriting_GoogleDBEvent(dbGEvent) {
    if (!dbGEvent) {
        return false;
    }

    let accessRole = dbGEvent.accessRole;

    if (!accessRole) {
        return false;
    }

    return accessRole === googleAccessRole.writer || accessRole === googleAccessRole.owner;
}

function accessRoleAllowsWriting_FullCalendarEvent(fcEvent) {
    if (!fcEvent) {
        return false;
    }

    if (!fcEvent.extendedProps) {
        return false;
    }

    let accessRole = fcEvent.extendedProps.accessRole;

    if (!accessRole) {
        return false;
    }

    return accessRole === googleAccessRole.writer || accessRole === googleAccessRole.owner;
}

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

const getEmailFromReq = (req) => {
    const email = req.headers[consts.emailHeader];

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
    let res = null;

    try {

        const response = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        res= response.data.picture;
    }
    catch (err) {
        console.error(err);
    }

    return res;
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
    const unexportedEvents = await EventModel.find({ email: email });

    events = events.concat(googleEvents);
    events = events.concat(unexportedEvents);

    return events;
}

/**
 * We need this function and to differentiate between the events because the Google event resource is different than the unexported event resource.
 * They save their dates differently.
 * @param {*} event 
 */
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

const getRandomColor = () => {
    let randomColor = Math.floor(Math.random() * 16777215).toString(16);
    randomColor = "#" + randomColor;

    return randomColor;
}

/**
 * This function receives an update resource for a Google Calendar event patch call.
 * If project tags are updated, and in particular if one is removed, then we need to go over the ignored tags of the specific event, and update them.
 * If an event ignores tag X, and tag X has been removed from the project, the tag also needs to be pulled from the event's ignored array.
 * This function performs that filter and makes sure that the updateResource will have the proper array of ignored IDs.
 * @param {*} dbGEvent The google event, as saved in our database, to be patched.
 * @param {*} updateResource The update resource with all the fields to be patched.
 * @returns The update resource with the proper ignoredTagIds field after filtering, if at all necessary. 
 */
function pullDeletedTagsFromIgnoredGEvent(dbGEvent, updateResource) {
    if (updateResource.projectTagIds) {
        let ignoredProjectTagIds = resource.ignoredProjectTagIds;
        if (!ignoredProjectTagIds) {
            ignoredProjectTagIds = dbGEvent.extendedProperties.private.ignoredProjectTagIds;
        }

        ignoredProjectTagIds = ignoredProjectTagIds.filter(ignoredId => eventUpdates.projectTagIds.includes(ignoredId));
        resource.extendedProperties = { private: { ignoredProjectTagIds: ignoredProjectTagIds } };
    }

    return updateResource;
}

/**
 * 
 * @param {*} error 
 * @retuns [statusCode, data]
 */
function parseError(error) {
    let statusCode = null;
    let data = null;

    if (error.code) {
        console.error(`Status error: ${error.code}`);
        statusCode = error.code;
    } else {
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    }

    return [statusCode, data];
}

function getGAPIClientCalendar(accessToken) {
    let oauth2Client = getOauth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    const googleCalendarApi = google.calendar({ version: 'v3', auth: oauth2Client });

    return googleCalendarApi;
}

module.exports = {
    oauth2Client: oauth2Client,
    websiteMainColor: websiteMainColor,
    googleAccessRole: googleAccessRole,
    accessRoleAllowsWriting_FullCalendarEvent: accessRoleAllowsWriting_FullCalendarEvent,
    accessRoleAllowsWriting_GoogleDBEvent: accessRoleAllowsWriting_GoogleDBEvent,
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
    getRandomColor: getRandomColor,
    pullDeletedTagsFromIgnoredGEvent: pullDeletedTagsFromIgnoredGEvent,
    parseError: parseError,


    getOauth2Client: getOauth2Client,
    getGAPIClientCalendar: getGAPIClientCalendar,
}