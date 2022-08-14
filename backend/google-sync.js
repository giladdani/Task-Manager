
const { google } = require('googleapis');
const utils = require('./utils');
const UserModel = require('./models/user');
const GoogleEventModel = require('./models/googleevent');
const ProjectModel = require('./models/project')


const syncGoogleData = async (accessToken, email) => {
    let unsyncedEvents = [];

    try {
        utils.oauth2Client.setCredentials({ access_token: accessToken });
        const googleCalendarClient = google.calendar({ version: 'v3', auth: utils.oauth2Client });

        const [unsyncedGoogleCalendars, prevSyncToken, nextSyncToken] = await getUnsyncedGoogleCalendars(googleCalendarClient, email);
        updateUserCalendarsSyncToken(prevSyncToken, nextSyncToken, email);
        let newCalendarId2Sync = await getNewCalendarsIds(unsyncedGoogleCalendars, email);
        let deletedCalendarsId = getDeletedCalendarsIds(unsyncedGoogleCalendars);

        addMissingCalendars(newCalendarId2Sync, email);
        updateUserDeletedCalendars(deletedCalendarsId, email);
        updateDeletedProjects(deletedCalendarsId, email);
        let deletedCalendarEvents = await getDeletedCalendarsEventsDB(deletedCalendarsId, email);
        removeDeletedCalendarsEvents(deletedCalendarsId, email);
        // unsyncedEvents = await getUnsyncedEventsAllCalendars(googleCalendarClient, email, deletedCalendarsId);
        let [allUnsyncedEvents, calendarId2PrevSyncTokenMap, calendarId2NextSyncTokenMap] = await getUnsyncedEventsAllCalendars(googleCalendarClient, email, deletedCalendarsId);
        updateEventCollectionSyncTokens(calendarId2PrevSyncTokenMap, calendarId2NextSyncTokenMap, email);
        updateDBWithUnsyncedEvents(allUnsyncedEvents, email)
        deletedCalendarEvents.forEach(event => event.status = 'cancelled');
        unsyncedEvents = allUnsyncedEvents.concat(deletedCalendarEvents);
    }
    catch (error) {
        console.log(`[syncGoogleData] Error:\n\n${error}`);
    }

    return unsyncedEvents;
}

/**
 * If the user deleted a calendar that is an exported project, we also delete the project on our end.
 * @param {*} deletedCalendarsId 
 * @param {*} email 
 */
const updateDeletedProjects = async (deletedCalendarsId, email) => {
    for(const calendarId of deletedCalendarsId) {
        let deleteProjectDocs = await ProjectModel.deleteOne({ 'googleCalendarId': calendarId }); // TODO: try without the await
    }
}

const updateUserDeletedCalendars = async (deletedCalendarsId, email) => {
    if (deletedCalendarsId.length > 0) {
        // Remove deleted calendars from the user's sync token array.
        await UserModel.updateOne(
            { email: email },
            {
                $pull: {
                    eventListCalendarId2SyncToken: {
                        key: {
                            $in: deletedCalendarsId,
                        }
                    }
                }
            }
        )
    }
}

const removeDeletedCalendarsEvents = async (deletedCalendarsId, email) => {
    if (deletedCalendarsId.length > 0) {
        // Delete all calendar events from our DB
        await GoogleEventModel.deleteMany( // No need to await
            {
                email: email,
                calendarId: {
                    $in: deletedCalendarsId
                },
            }
        );
    }
}

const updateEventCollectionSyncTokens = async (calendarId2PrevSyncTokenMap, calendarId2NextSyncTokenMap, email) => {
    let map = new Map();

    for (const [calendarId, prevSyncToken] of calendarId2PrevSyncTokenMap) {
        let nextSyncToken = calendarId2NextSyncTokenMap.get(calendarId);

        if (prevSyncToken !== nextSyncToken) {
            let updateRes = await UserModel.updateOne(
                { email: email, "eventListCalendarId2SyncToken.key": calendarId },
                { "$set": { "eventListCalendarId2SyncToken.$.value": nextSyncToken } }
            )
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
    for (const event of unsyncedEvents) {
        eventsIds.push(event.id);
    }

    await GoogleEventModel.deleteMany( // I tried without await but I never saw the DB updated for some reason
        {
            email: email,
            id: {
                $in: eventsIds,
            }
        }
    );

    let undeletedEvents = unsyncedEvents.filter(event => event.status !== 'cancelled');
    const docsEvents = GoogleEventModel.insertMany(undeletedEvents);
}

const addMissingCalendars = async (missingCalendarId2Sync, email) => {
    if (missingCalendarId2Sync.length > 0) {
        let userDataUpdate = await UserModel.updateOne(
            { email: email },
            {
                $push: {
                    eventListCalendarId2SyncToken: {
                        $each: missingCalendarId2Sync,
                    }
                }
            });
    }
}

/**
 * When a calendar is deleted by the user at Google, when asking for all calendars to then ask for all their events, the deleted ones won't appear.
 * @param {[String]} deletedCalendarsId An array of IDs of all the deleted calendars.
 * @param {*} email 
 */
const getDeletedCalendarsEventsDB = async (deletedCalendarsId, email) => {
    let deletedCalendarsEvents = [];

    if (deletedCalendarsId.length > 0) {
        // Delete all calendar events from our DB
        let calendarEvents = await GoogleEventModel.find( // No need to await
            {
                email: email,
                calendarId: {
                    $in: deletedCalendarsId
                },
            }
        );

        deletedCalendarsEvents = deletedCalendarsEvents.concat(calendarEvents);
    }

    return deletedCalendarsEvents;
}

/**
 * Finds all the unsynced events of all the user's calendars. The function first acquires all the user's calendars, then asks for their events with the sync tokens.
 * Ntoe that deleted calendars won't be spotted here, so finding the user's events from deleted calendars requires a different function.
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
    const userDataPromise = UserModel.findOne({ email: email });

    await Promise.all([colorsPromise, calendarListPromise, userDataPromise])
        .then(async (responses) => {
            let calendarColors = responses[0].data.calendar; // An array of all colors of all calendars, see https://developers.google.com/calendar/api/v3/reference/colors/get
            let eventColors = responses[0].data.event; // Some events have been specifically modified for different colors
            let calendarList = responses[1];
            let userData = responses[2];

            for (const calendar of calendarList.data.items) {
                const calendarSyncToken = getCalendarSyncToken(userData, calendar.id);
                const [unsyncedCalendarEvents, nextSyncToken] = await getUnsyncedEventsFromCalendar(googleCalendarClient, calendar.id, calendarSyncToken, email, calendar.summary);
                calendarId2PrevSyncTokenMap.set(calendar.id, calendarSyncToken);
                calendarId2NextSyncTokenMap.set(calendar.id, nextSyncToken);
                // // const [background, foreground] = getColorString(calendar, calendarColors, eventColors);
                let calendarEventsWithCalendarId = unsyncedCalendarEvents.map(event => {
                    const [background, foreground] = getColorString(calendar, event, calendarColors, eventColors);

                    return (
                        {
                            ...event,
                            calendarId: calendar.id,
                            backgroundColor: background,
                            foregroundColor: foreground,
                            email: email,
                            fetchedByUser: false,
                            isGoogleEvent: true,
                        })
                }
                );

                // // if (areModifiedEvents && unsyncedCalendarEvents.length > 0) {
                // //     // /**
                // //     //  * Modified events need to be updated in the DB.
                // //     //  * One way to do it is remove events whose status is cancelled, and just update events whose status is confirmed with the new fields.
                // //     //  * What we do right now is simply remove all the DB events that have been modified, so we re-insert them at the end of the function.
                // //     //  */
                // //     let removeIds = [];
                // //     let deletedEvents = [];
                // //     for (const modifiedEvent of unsyncedCalendarEvents) {
                // //         removeIds.push(modifiedEvent.id);
                // //         if (modifiedEvent.status === 'cancelled') {
                // //             deletedEvents.push(modifiedEvent);
                // //         }
                // //     }

                // //     await GoogleEventModel.deleteMany( // I tried without await but I never saw the DB updated for some reason
                // //         {
                // //             email: email,
                // //             id: {
                // //                 $in: removeIds,
                // //             }
                // //         }
                // //     );

                // //     calendarEventsWithCalendarId = calendarEventsWithCalendarId.filter(event => !deletedEvents.includes(event));
                // // }

                allUnsyncedEvents = allUnsyncedEvents.concat(calendarEventsWithCalendarId);
            }
        })

    return [allUnsyncedEvents, calendarId2PrevSyncTokenMap, calendarId2NextSyncTokenMap];
}


/**
 * Returns unsynced calendars only. Does not update the sync token!
 * @param {*} calendar 
 * @param {*} email 
 * @returns An array of [calendars, prevSyncToken, nextSyncToken]. Note that nextSyncToken may be the same as current sync token.
 */
const getUnsyncedGoogleCalendars = async (calendar, email) => {
    const userData = await UserModel.findOne({ email: email });
    let syncToken = userData.calendarsSyncToken;
    let prevSyncToken = syncToken;
    let calendars = [];
    let nextSyncToken = null;
    let response = await calendar.calendarList.list({ syncToken: syncToken, });
    calendars = response.data.items;
    nextSyncToken = response.data.nextSyncToken;

    return [calendars, prevSyncToken, nextSyncToken]
}

const updateUserCalendarsSyncToken = async (prevSyncToken, nextSyncToken, email) => {
    let updatePromise = null;

    if (prevSyncToken !== nextSyncToken) {
        updatePromise = await UserModel.updateOne(
            { email: email },
            {
                $set:
                {
                    calendarsSyncToken: nextSyncToken,
                }
            })
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

    let userData = await UserModel.findOne({ email: email });

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
    let prevSyncToken = syncToken;
    let nextSyncToken = null;
    let areModifiedEvents = false;

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

            // // if (syncToken !== nextSyncToken) {
            // //     let updateRes = await UserModel.updateOne(
            // //         { email: email, "eventListCalendarId2SyncToken.key": calendarId },
            // //         { "$set": { "eventListCalendarId2SyncToken.$.value": nextSyncToken } }
            // //     )
            // // }

            // // areModifiedEvents = events.length > 0;
        }
        catch (err) {
            console.log(err);

            // Perform initial sync
            if (err.code === 410) {
                /**
                 * If our old sync token is expired, we need to refetch all the events.
                 * If we insert them all as is, we'll have duplicates. So we also delete all the events of this calendar we already have saved.
                 */

                // let deletePromise = await GoogleEventModel.deleteMany({ email: email, calendarId: calendarId });
                [events, nextSyncToken] = await getInitialSyncEvents(googleCalendarApi, calendarId, email, summary);
            }
        }
    }

    return [events, nextSyncToken];
}



/**
 * The function also updates the next sync token in the DB.
 * @param {*} googleCalendarApi 
 * @param {*} calendarId 
 * @param {*} email 
 * @param {*} calendarSummary 
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

    let query = {
        email: email,
        "eventListCalendarId2SyncToken.key": calendarId,
    }

    let updateRes = await UserModel.updateOne(
        query,
        {
            $set: {
                "eventListCalendarId2SyncToken.$.value": nextSyncToken,
            }
        }
    );

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
 * Upon logging into the website, we reset all the user's events to unfetched\unsynced
 * so that when the client requests his events for the first time, he receives all of them if any already exist in the system.
 * @param {string} email The email of the user whose events must be reset to unsynced and unfetched.
 */
const resetEventsFetchStatus = async (email) => {
    return GoogleEventModel.updateMany(
        { email: email },
        {
            $set:
            {
                fetchedByUser: false,
            }
        });
}

module.exports = {
    syncGoogleData: syncGoogleData,
    resetEventsFetchStatus: resetEventsFetchStatus,
}