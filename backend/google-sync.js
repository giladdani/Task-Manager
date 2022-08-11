
const { google } = require('googleapis');
const utils = require('./utils');
const UserModel = require('./models/user');
const GoogleEventModel = require('./models/googleevent');

const syncGoogleData = async (accessToken, email) => {
    let allEvents = [];

    try {
        utils.oauth2Client.setCredentials({ access_token: accessToken });
        const googleCalendarClient = google.calendar({ version: 'v3', auth: utils.oauth2Client });

        const unsyncedGoogleCalendarsPromise = getUnsyncedGoogleCalendars(googleCalendarClient, email);
        let userDataFindPromise = UserModel.findOne({ email: email });
        let missingCalendarId2Sync = [];
        let deletedCalendarsId = [];
        await Promise.all([unsyncedGoogleCalendarsPromise, userDataFindPromise])
            .then(responses => {
                let unsyncedGoogleCalendars = responses[0];
                let userDataFind = responses[1];

                for (const calendar of unsyncedGoogleCalendars) {
                    const calendarId = calendar.id;
                    if (calendar.deleted === true) {
                        deletedCalendarsId.push(calendarId);
                    } else {
                        if (!(userDataFind.eventListCalendarId2SyncToken.some(keyVal => keyVal.key === calendarId))) {
                            missingCalendarId2Sync.push({
                                key: calendarId,
                                value: null,
                            })
                        }
                    }
                }
            })

        syncDeletedCalendars(deletedCalendarsId, email);

        // Add missing calendars to the user's sync token array.
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

        allEvents = await getUnsyncedEventsAllCalendars(googleCalendarClient, email);
        const docsEvents = GoogleEventModel.insertMany(allEvents);

    }
    catch (error) {
        console.log(`[syncGoogleData] Error:\n\n${error}`);
    }

    return allEvents;
}

const syncDeletedCalendars = async (deletedCalendarsId, email) => {
    if (deletedCalendarsId.length > 0) {
        // Remove deleted calendars from the user's sync token array.
        UserModel.updateOne(
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

        // Delete all calendar events from our DB
        GoogleEventModel.deleteMany( // No need to await
            {
                email: email,
                calendarId: {
                    $in: deletedCalendarsId
                },
            }
        );
    }
}

const getUnsyncedEventsAllCalendars = async (googleCalendarClient, email) => {
    let allEvents = [];
    const colorsPromise = googleCalendarClient.colors.get({});
    const calendarListPromise = googleCalendarClient.calendarList.list();
    const userDataPromise = UserModel.findOne({ email: email });


    await Promise.all([colorsPromise, calendarListPromise, userDataPromise])
        .then(async (responses) => {
            let calendarColors = responses[0].data.calendar; // An array of all colors of all calendars, see https://developers.google.com/calendar/api/v3/reference/colors/get
            let eventColors = responses[0].data.event; // Some events have been specifically modified for different colors
            let response = responses[1];
            let userData = responses[2];

            for (const calendar of response.data.items) {
                const calendarSyncToken = getCalendarSyncToken(userData, calendar.id);
                const [unsyncedCalendarEvents, areModifiedEvents] = await getUnsyncedEventsFromCalendar(googleCalendarClient, calendar.id, calendarSyncToken, email, calendar.summary);
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
                        })
                }
                );

                for (const event of calendarEventsWithCalendarId) {

                }

                if (areModifiedEvents && unsyncedCalendarEvents.length > 0) {
                    /**
                     * Modified events need to be updated in the DB.
                     * One way to do it is remove events whose status is cancelled, and just update events whose status is confirmed with the new fields.
                     * What we do right now is simply remove all the DB events that have been modified, so we re-insert them at the end of the function.
                     */
                    let removeIds = [];
                    let deletedEvents = [];
                    for (const modifiedEvent of unsyncedCalendarEvents) {
                        removeIds.push(modifiedEvent.id);
                        if (modifiedEvent.status === 'cancelled') {
                            deletedEvents.push(modifiedEvent);
                        }
                    }

                    await GoogleEventModel.deleteMany( // I tried without await but I never saw the DB updated for some reason
                        {
                            email: email,
                            id: {
                                $in: removeIds,
                            }
                        }
                    );

                    calendarEventsWithCalendarId = calendarEventsWithCalendarId.filter(event => !deletedEvents.includes(event));
                }

                allEvents = allEvents.concat(calendarEventsWithCalendarId);
            }
        })

    return allEvents;
}

/**
 * Returns unsynced calendars only. Makes use of the sync token. Updates the sync token at the DB.
 * @param {*} calendar 
 * @param {*} email 
 * @returns 
 */
const getUnsyncedGoogleCalendars = async (calendar, email) => {
    const userData = await UserModel.findOne({ email: email });
    let syncToken = userData.calendarsSyncToken;
    let calendars = [];
    let nextSyncToken = null;
    let response = await calendar.calendarList.list({ syncToken: syncToken, });
    calendars = response.data.items;
    nextSyncToken = response.data.nextSyncToken;
    let updateRes = null;
    if (syncToken !== nextSyncToken) {
        updateRes = await UserModel.updateOne(
            { email: email },
            {
                $set:
                {
                    calendarsSyncToken: nextSyncToken,
                }
            })
    }

    return calendars;
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
    let areModifiedEvents = false;

    if (syncToken === null) {
        events = await getInitialSyncEvents(googleCalendarApi, calendarId, email, summary);
    } else {
        try {
            let pageToken = null;
            let nextSyncToken = null;
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

            if (syncToken !== nextSyncToken) {
                let updateRes = await UserModel.updateOne(
                    { email: email, "eventListCalendarId2SyncToken.key": calendarId },
                    { "$set": { "eventListCalendarId2SyncToken.$.value": nextSyncToken } }
                )
            }

            areModifiedEvents = events.length > 0;
        }
        catch (err) {
            console.log(err);

            // Perform initial sync
            if (err.code === 410) {
                /**
                 * If our old sync token is expired, we need to refetch all the events.
                 * If we insert them all as is, we'll have duplicates. So we also delete all the events of this calendar we already have saved.
                 */
                let deletePromise = GoogleEventModel.deleteMany({ email: email, calendarId: calendarId });
                let eventsPromise = getInitialSyncEvents(googleCalendarApi, calendarId, email, summary);
                Promise.all([deletePromise, eventsPromise])
                    .then(responses => {
                        for (const response of responses) {
                            console.log(`Hey this is some response, ${response.stats}`);
                        }
                    })
            }
        }
    }

    return [events, areModifiedEvents];
}



/**
 * The function also updates the next sync token in the DB.
 * @param {*} googleCalendarApi 
 * @param {*} calendarId 
 * @param {*} email 
 * @param {*} calendarSummary 
 * @returns 
 */
const getInitialSyncEvents = async (googleCalendarApi, calendarId, email, calendarSummary) => {
    const currDate = new Date();
    const timeMinDate = new Date(currDate).setMonth(currDate.getMonth() - 12);
    const timeMaxDate = new Date(currDate).setMonth(currDate.getMonth() + 12);

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
        eventListCalendarId2SyncToken: {
            key: calendarId,
        }
    }

    // Different option
    let query2 = {
        email: email,
        "eventListCalendarId2SyncToken.key": calendarId,
    }

    let updateRes = await UserModel.updateOne(
        query2,
        {
            $set: {
                "eventListCalendarId2SyncToken.$.value": nextSyncToken,
            }
        }
    );

    return events;
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
    // else {
    //     colorId = Number(calendar.colorId);
    //     colors = Object.entries(calendarColors);
    // }

    // const colorEntry = colors[colorId - 1];
    // const background = colorEntry[1].background;
    // const foreground = colorEntry[1].foreground;

    // const colorId = Number(calendar.colorId);
    // const colors = Object.entries(allGoogleCalendarColors);
    // const colorEntry = colors[colorId - 1];
    // const background = colorEntry[1].background;
    // const foreground = colorEntry[1].foreground;

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