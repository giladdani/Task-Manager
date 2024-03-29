
const { google } = require('googleapis');
const utils = require('./utils');
const consts = require('./consts');
const dbUsers = require('../dal/dbUsers');
const dbGoogleEvents = require('../dal/dbGoogleEvents');
const dbProjects = require('../dal/dbProjects');
const { googleAccessRole } = require('./utils');
const eventsUtils = require('../business-logic/events/events-utils');
const dbUnexportedEvents = require('../dal/dbUnexportedEvents');
const { addTags } = require('../dal/dbProjects');

/**
 * Wrap with try-catch in case there's a Google error.
 * @param {*} accessToken 
 * @param {*} email 
 * @returns Unsynced Google events.
 */
const syncGoogleData = async (accessToken, email) => {
    let unsyncedEvents = [];
    const oauth2Client = utils.getOauth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    const googleCalendarClient = utils.getGAPIClientCalendar(accessToken);
    const [unsyncedGoogleCalendars, prevSyncToken, nextSyncToken] = await getUnsyncedGoogleCalendars(googleCalendarClient, email);
    await updateUserCalendarsSyncToken(prevSyncToken, nextSyncToken, email);
    let newCalendarId2Sync = await getNewCalendarsIds(unsyncedGoogleCalendars, email);
    let deletedCalendarsId = getDeletedCalendarsIds(unsyncedGoogleCalendars);
    addMissingCalendars(newCalendarId2Sync, email);
    updateUserDeletedCalendars(deletedCalendarsId, email);
    updateDeletedProjects(deletedCalendarsId, email);
    let deletedCalendarEvents = await getDeletedCalendarsEventsDB(deletedCalendarsId, email);
    removeDeletedCalendarsEvents(deletedCalendarsId, email);
    let [allUnsyncedEvents, calendarId2PrevSyncTokenMap, calendarId2NextSyncTokenMap] = await getUnsyncedEventsAllCalendars(googleCalendarClient, email, deletedCalendarsId);
    updateEventCollectionSyncTokens(calendarId2PrevSyncTokenMap, calendarId2NextSyncTokenMap, email);
    updateDBWithUnsyncedEvents(allUnsyncedEvents, email)
    deletedCalendarEvents.forEach(event => event.status = 'cancelled');
    unsyncedEvents = allUnsyncedEvents.concat(deletedCalendarEvents);

    return unsyncedEvents;
}

/**
 * If the user deleted a calendar that is an exported project, we also delete the project on our end.
 * @param {*} deletedCalendarsId 
 * @param {*} email 
 */
const updateDeletedProjects = async (deletedCalendarsId, email) => {
    for (const calendarId of deletedCalendarsId) {
        await dbProjects.deleteOne({ 'googleCalendarId': calendarId });

    }
}

const updateUserDeletedCalendars = async (deletedCalendarsId, email) => {
    return dbUsers.removeDeletedCalendars(email, deletedCalendarsId);
}

const removeDeletedCalendarsEvents = async (deletedCalendarsId, email) => {
    for (const calendarId of deletedCalendarsId) {
        await dbGoogleEvents.deleteEventsByCalendar(email, calendarId);
    }
}

const updateEventCollectionSyncTokens = async (calendarId2PrevSyncTokenMap, calendarId2NextSyncTokenMap, email) => {
    let map = new Map();

    for (const [calendarId, prevSyncToken] of calendarId2PrevSyncTokenMap) {
        let nextSyncToken = calendarId2NextSyncTokenMap.get(calendarId);

        if (prevSyncToken !== nextSyncToken) {
            await dbUsers.updateEventsCollectionSyncToken(email, calendarId, nextSyncToken);
        }
    }
}

/**
 * Inserts all the new events into the DB, and removes all the deleted ones.
 * @param {*} unsyncedEvents 
 */
const updateDBWithUnsyncedEvents = async (unsyncedEvents, email) => {
    /**
     * Ideally, we want to remove all the deleted events, add all the new events, and just update the existing but modified events.
     * We can easily recognize if an event is deleted, but we can't easily find out if an event is unsynced because it's new,
     * or if it's unsynced because it has been modified somehow.
     * Furthermore if a sync token has expired on Google's end, it returns all the calendar's events.
     * 
     * The suboptimal but easy solution I chose for now is just to delete all the events in the DB that match the IDs of unsynced events,
     * and then re-insert them (not including the deleted ones).
     * While it's not great, for the most part I also don't think it will affect things too drastically.
     */

    let eventsIds = [];
    let sharedEvents = [];
    for (const event of unsyncedEvents) {
        eventsIds.push(event.id);
        if (eventsUtils.g_IsSharedEvent(event)) sharedEvents.push(event);
    }

    await dbGoogleEvents.deleteByIds(email, eventsIds);  // I tried without await but I never saw the DB updated for some reason
    let undeletedEvents = unsyncedEvents.filter(event => event.status !== 'cancelled');
    dbGoogleEvents.insertMany(undeletedEvents);
    await updateSharedEvents(sharedEvents);
}

/**
 * This function receives an array of Google events,
 * and updates all the shared events in our DB that they represent.
 * @param {*} sharedGEvents An array of Google events, where each event represents a shared event on our application.
 */
async function updateSharedEvents(sharedGEvents) {
    for(const gEvent of sharedGEvents) {
        let sharedEventId = eventsUtils.g_GetSharedEventId(gEvent);
        if (!sharedEventId) continue; 
        
        let title = gEvent.summary;
        let start = new Date(gEvent.start.dateTime);
        let end = new Date(gEvent.end.dateTime);
        if (!start || !end) continue;

        let updateObj = {
            $set: {
                title: title,
                start: start,
                end: end,
            }
        }

        dbUnexportedEvents.updateMany({sharedId: sharedEventId}, updateObj);
    }
}

const addMissingCalendars = async (missingCalendarId2Sync, email) => {
    for (const element of missingCalendarId2Sync) {
        await dbUsers.addCalendar(email, element.key);
    }
}

/**
 * When a calendar is deleted by the user at Google, when asking for all calendars to then ask for all their events, the deleted ones won't appear.
 * @param {[String]} deletedCalendarsId An array of IDs of all the deleted calendars.
 * @param {*} email 
 */
const getDeletedCalendarsEventsDB = async (deletedCalendarsId, email) => {
    let deletedCalendarsEvents = [];

    for (const calendarId of deletedCalendarsId) {
        let calendarEvents = await dbGoogleEvents.findByCalendar(email, calendarId);
        deletedCalendarsEvents = deletedCalendarsEvents.concat(calendarEvents);
    }

    return deletedCalendarsEvents;
}

/**
 * Finds all the unsynced events of all the user's calendars. The function first acquires all the user's calendars, then asks for their events with the sync tokens.
 * Note that deleted calendars won't be spotted here, so finding the user's events from deleted calendars requires a different function.
 * @param {*} googleCalendarClient 
 * @param {*} email 
 * @param {*} deletedCalendarsId 
 * @returns An array of [allUnsyncedEvents, calendarId2PrevSyncTokenMap, calendarId2NextSyncTokenMap]. The two maps allow updating the sync tokens.
 */
const getUnsyncedEventsAllCalendars = async (googleCalendarClient, email) => {
    let allUnsyncedEvents = [];
    let calendarId2PrevSyncTokenMap = new Map();
    let calendarId2NextSyncTokenMap = new Map();
    const colorsPromise = googleCalendarClient.colors.get({});
    const calendarListPromise = googleCalendarClient.calendarList.list();
    const userDataPromise = dbUsers.findOne({ email: email });

    await Promise.all([colorsPromise, calendarListPromise, userDataPromise])
        .then(async (responses) => {
            let calendarColors = responses[0].data.calendar; // An array of all colors of all calendars, see https://developers.google.com/calendar/api/v3/reference/colors/get
            let eventColors = responses[0].data.event; // Some events have been specifically modified for different colors
            let calendarList = responses[1];
            let userData = responses[2];

            for (const calendar of calendarList.data.items) {
                const calendarSyncToken = getCalendarSyncToken(userData, calendar.id);
                let [unsyncedCalendarEvents, nextSyncToken] = await getUnsyncedEventsFromCalendar(googleCalendarClient, calendar.id, calendarSyncToken, email, calendar.summary);
                calendarId2PrevSyncTokenMap.set(calendar.id, calendarSyncToken);
                calendarId2NextSyncTokenMap.set(calendar.id, nextSyncToken);
                let modifiedEvents = convertToDBModel(unsyncedCalendarEvents, email, calendar, calendarColors, eventColors);
                allUnsyncedEvents = allUnsyncedEvents.concat(modifiedEvents);
            }
        })

    return [allUnsyncedEvents, calendarId2PrevSyncTokenMap, calendarId2NextSyncTokenMap];
}


/**
 * Returns unsynced calendars only. Does not update the sync token!
 * @param {*} googleCalendarClient 
 * @param {*} email 
 * @returns An array of [calendars, prevSyncToken, nextSyncToken]. Note that nextSyncToken may be the same as current sync token.
 */
const getUnsyncedGoogleCalendars = async (googleCalendarClient, email) => {
    const userData = await dbUsers.findOne({ email: email });
    let syncToken = userData.calendarsSyncToken;
    let prevSyncToken = syncToken;
    let calendars = [];
    let nextSyncToken = null;
    let response = await googleCalendarClient.calendarList.list({ syncToken: syncToken, });
    calendars = response.data.items;
    nextSyncToken = response.data.nextSyncToken;

    return [calendars, prevSyncToken, nextSyncToken]
}

const updateUserCalendarsSyncToken = async (prevSyncToken, nextSyncToken, email) => {
    let updatePromise = null;

    if (prevSyncToken !== nextSyncToken) {
        dbUsers.updateCalendarsSyncToken(email, nextSyncToken)
    }

    return updatePromise;
}

const getDeletedCalendarsIds = (unsyncedGoogleCalendars) => {
    let deletedCalendarsId = [];

    for (const calendar of unsyncedGoogleCalendars) {
        const calendarId = calendar.id;
        if (calendar.deleted === true) {
            deletedCalendarsId.push(calendarId);
        }
    }

    return deletedCalendarsId;
}

const getNewCalendarsIds = async (unsyncedGoogleCalendars, email) => {
    let newCalendarId2Sync = [];
    let userData = await dbUsers.findOne({ email: email });
    for (const calendar of unsyncedGoogleCalendars) {
        const calendarId = calendar.id;

        if (!calendar.deleted) {
            if (!(userData.eventListCalendarId2SyncToken.some(keyVal => keyVal.key === calendarId))) {
                newCalendarId2Sync.push({
                    key: calendarId,
                    value: null,
                })
            }
        }
    }

    return newCalendarId2Sync;
}

const getCalendarSyncToken = (userData, calendarId) => {
    let syncToken = null;

    const keyValPair = userData.eventListCalendarId2SyncToken.find(element => element.key === calendarId);
    if (keyValPair) {
        syncToken = keyValPair.value;
    }

    return syncToken;
}

/**
 * This function returns all the unsynced events from the calendar, based on the calendar ID provided.
 * If the sync token is null, the function performs an initial sync.
 * If the sync token is expired, the function performs an initial sync but also deletes all the events from the DB.
 * @param {*} googleCalendarApi 
 * @param {*} calendarId 
 * @param {string} syncToken
 * @param {string} email 
 * @param {string} summary 
 * @returns 
 */
const getUnsyncedEventsFromCalendar = async (googleCalendarApi, calendarId, syncToken, email, summary) => {
    let events = [];
    let nextSyncToken = null;

    if (syncToken === null) {
        [events, nextSyncToken] = await getInitialSyncEvents(googleCalendarApi, calendarId, email, summary);
    } else {
        try {
            let pageToken = null;
            do {
                response = await googleCalendarApi.events.list({
                    calendarId: calendarId,
                    singleEvents: true,
                    syncToken: syncToken,
                    pageToken: pageToken,
                });

                events = events.concat(response.data.items);
                nextSyncToken = response.data.nextSyncToken;
                pageToken = response.data.nextPageToken;
            } while (pageToken);
        }
        catch (err) {
            console.log(err);

            // Perform initial sync
            if (err.code === 410) {
                /**
                 * If our old sync token is expired, we need to refetch all the events.
                 * If we insert them all as is, we'll have duplicates. So we also delete all the events of this calendar we already have saved.
                 */

                await dbGoogleEvents.deleteMany({ email: email, calendarId: calendarId });
                [events, nextSyncToken] = await getInitialSyncEvents(googleCalendarApi, calendarId, email, summary);
            }
        }
    }

    return [events, nextSyncToken];
}

/**
 * 
 * @param {*} unsyncedCalendarEvents An array of google events.
 * @returns An array of all the events adjusted to match the DB Model.
 */
function convertToDBModel(unsyncedCalendarEvents, email, calendar, calendarColors, eventColors) {
    let modelEvents = unsyncedCalendarEvents.map(gEvent => {
        const [background, foreground] = getColorString(calendar, gEvent, calendarColors, eventColors);
        let tags = parseTags(gEvent);
        let accessRole = getEventAccessRole(calendar, gEvent, email);

        return (
            {
                ...gEvent,
                calendarId: calendar.id,
                backgroundColor: background,
                foregroundColor: foreground,
                email: email,
                fetchedByUser: false,
                isGoogleEvent: true,
                accessRole: accessRole,
                tags: tags,
            })
    }
    );

    return modelEvents;
}

/**
 * The function DOES NOT update the sync token!
 * @param {*} googleCalendarApi 
 * @param {*} calendarId 
 * @param {*} email 
 * @param {*} calendarSummary Only for debugging purposes.
 * @returns An array of [events, nextSyncToken], where events is all the calendar's events.
 */
const getInitialSyncEvents = async (googleCalendarApi, calendarId, email, calendarSummary) => {
    const currDate = new Date();
    const timeMinDate = new Date(currDate).setMonth(currDate.getMonth() - 4);
    const timeMaxDate = new Date(currDate).setMonth(currDate.getMonth() + 6);
    let pageToken = null;
    let nextSyncToken = null;
    let events = [];

    do {
        const response = await googleCalendarApi.events.list({
            calendarId: calendarId,
            timeMin: (new Date(timeMinDate)).toISOString(),
            timeMax: (new Date(timeMaxDate)).toISOString(),
            singleEvents: true,
            pageToken: pageToken,
        });

        events = events.concat(response.data.items);
        nextSyncToken = response.data.nextSyncToken;
        pageToken = response.data.nextPageToken;
    } while (pageToken);

    return [events, nextSyncToken];
}

const getColorString = (calendar, event, calendarColors, eventColors) => {
    /*
    The Google Calendar API for colors was a bit weird for me.
    I kept failing in the code when I treated it as an array.
    To better understand enter the debugger and see how the objects are saved.
    
    https://developers.google.com/calendar/api/v3/reference/colors/get
    https://developers.google.com/calendar/api/v3/reference/colors#resource
    */


    let colorId = Number(calendar.colorId);
    let colors = Object.entries(calendarColors);
    let colorEntry = colors[colorId - 1];
    let background = colorEntry[1].background;
    let foreground = background;
    /**
     * Previously:
     * // let foreground = colorEntry[1].foreground;
     * While Google does keep foreground colors for all calendars and events, from what we could tell it was always just black.
     * On FullCalendar that black ends up being ugly.
     * So we set the border color of Full Calendar events to the backgroudn color, so it's clean.
     * Unexported events can maintain a black color.
     */

    if (event.attendees) {
        /**
         * Invites appear on Google Calendar as transparent.
         * I could not find out how to specify a color as transparent in FullCalendar,
         * so I set the color to be the main color of the website.
         */

        background = utils.websiteMainColor;
    }


    // Check if event has a specific color to override the basic calendar color
    if (event.colorId) {
        colorId = Number(event.colorId);
        colors = Object.entries(eventColors);
        colorEntry = colors[colorId - 1];

        // foreground = background;
        background = colorEntry[1].background;
        // foreground = colorEntry[1].foreground;

    }

    return [background, foreground];
}

/**
 * The tags within a Google event are saved as a String, not an array.
 * We save them in our DB as arrays of strings for comfort.
 * So we need to perform some object modification when fetching the events.
 * @returns A tag object with the typical fields.
 */
function parseTags(gEvent) {
    let tags = {
        independentTagIds: [],
        projectTagIds: [],
        ignoredProjectTagIds: [],
    }

    if (!gEvent) return tags;
    if (!gEvent.extendedProperties) return tags;
    if (!gEvent.extendedProperties.private) return tags;

    if (gEvent.extendedProperties.private[consts.gFieldName_IndTagIds]) {
        tags.independentTagIds = gEvent.extendedProperties.private[consts.gFieldName_IndTagIds].split(',');
    }

    if (gEvent.extendedProperties.private[consts.gFieldName_ProjTagIds]) {
        tags.projectTagIds = gEvent.extendedProperties.private[consts.gFieldName_ProjTagIds].split(',');
    }

    if (gEvent.extendedProperties.private[consts.gFieldName_IgnoredProjectTagIds]) {
        tags.ignoredProjectTagIds = gEvent.extendedProperties.private[consts.gFieldName_IgnoredProjectTagIds].split(',');
    }

    return tags;
}

const getEventAccessRole = (calendar, event, email) => {
    if (event.status === 'cancelled') {
        return utils.googleAccessRole.none;
    }

    if (event.organizer.email === calendar.id) {
        return calendar.accessRole;
    }

    if (event.attendees && event.attendees.some(attendee => attendee.email === email)) {
        let attendeeObj = event.attendees.find(attendee => attendee.email === email);
        if (attendeeObj && attendeeObj.responseStatus === 'needsAction') {
            return 'pendingInvitation';
        }

        if (event.guestsCanModify) {
            return googleAccessRole.writer;
        } else {
            return googleAccessRole.reader;
        }
    } 

    return googleAccessRole.none;
}

/**
 * Upon logging into the website, we reset all the user's events to unfetched\unsynced
 * so that when the client requests his events for the first time, he receives all of them if any already exist in the system.
 * @param {string} email The email of the user whose events must be reset to unsynced and unfetched.
 */
const resetEventsFetchStatus = async (email) => {
    dbGoogleEvents.updateFetchStatus(email, false);
}

module.exports = {
    syncGoogleData: syncGoogleData,
    resetEventsFetchStatus: resetEventsFetchStatus,
}