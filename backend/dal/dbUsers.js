const Model = require('../models/user');

async function findOne(query) {
    const promise = await Model.findOne(query);

    return promise;
}

/* --------------------------------------------------------------
-----------------------------------------------------------------
----------------------- Custom Functions ------------------------
-----------------------------------------------------------------
-------------------------------------------------------------- */
/**
 * 
 * @param {*} email 
 * @param {[String]} deletedCalendarsId An array of IDs of all deleted calendars.
 */
async function removeDeletedCalendars(email, deletedCalendarsId) {
    let promise = null;
    if (deletedCalendarsId.length > 0) {
        // Remove deleted calendars from the user's sync token array.
        promise = await Model.updateOne(
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

    return promise;
}

async function updateCalendarsSyncToken(email, nextSyncToken) {
    let promise = Model.updateOne(
        { email: email },
        {
            $set:
            {
                calendarsSyncToken: nextSyncToken,
            }
        })

    return promise;
}

async function updateEventsCollectionSyncToken(email, calendarId, nextSyncToken) {
    let promise = Model.updateOne(
        {
            email: email,
            "eventListCalendarId2SyncToken.key": calendarId
        },
        {
            "$set": {
                "eventListCalendarId2SyncToken.$.value": nextSyncToken
            }
        }
    )

    return promise;
}

/**
 * Adds a new calendar to the user.
 * It starts with a NULL sync token.
 * @param {*} email 
 * @param {*} calendarId 
 */
async function addCalendar(email, calendarId) {
    let promise = await Model.updateOne(
        { email: email },
        {
            $push: {
                eventListCalendarId2SyncToken: {
                    key: calendarId,
                    value: null,
                }
            }
        });

    return promise;
}



/* --------------------------------------------------------------
-----------------------------------------------------------------
---------------------------- Exports ----------------------------
-----------------------------------------------------------------
-------------------------------------------------------------- */
module.exports = {
    findOne: findOne,

    // Custom Functions
    removeDeletedCalendars: removeDeletedCalendars,
    updateCalendarsSyncToken: updateCalendarsSyncToken,
    updateEventsCollectionSyncToken: updateEventsCollectionSyncToken,
    addCalendar: addCalendar,
}