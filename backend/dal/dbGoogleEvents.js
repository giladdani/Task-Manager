const Model = require('../models/google-event')

async function find(query) {
    const promise = Model.find(query);

    return promise;
}

/**
 * https://www.mongodb.com/docs/manual/reference/method/db.collection.findOne/
 */
async function findOne(query, projection) {
    const promise = Model.findOne(query, projection);

    return promise;
}

async function insertMany(events) {
    let promise = Model.insertMany(events);

    return promise;
}

async function deleteMany(query) {
    let promise = Model.deleteMany(query);

    return promise;
}



/* --------------------------------------------------------------
-----------------------------------------------------------------
----------------------- Custom Functions ------------------------
-----------------------------------------------------------------
-------------------------------------------------------------- */
async function deleteEventsByCalendar(email, calendarId) {
    let promise = Model.deleteMany(
        {
            email: email,
            calendarId: calendarId,
        }
    );

    return promise;
}

/**
 * 
 * @param {[String]} eventIds An array of all IDs to delete.
 * @returns 
 */
async function deleteByIds(email, eventIds) {
    let promise = Model.deleteMany(
        {
            email: email,
            id: {
                $in: eventIds,
            }
        }
    )

    return promise;
}

async function findByProject(email, projectId) {
    let promise = await Model.find(
        {
            'email': email,
            'extendedProperties.private.fullCalendarProjectId': projectId,
        }
    )

    return promise;
}

async function findByCalendar(email, calendarId) {
    let promise = Model.find(
        {
            email: email,
            calendarId: calendarId,
        }
    )

    return promise;
}

async function updateFetchStatus(email, fetchStatus) {
    let promise = Model.updateMany(
        { email: email },
        {
            $set:
            {
                fetchedByUser: fetchStatus,
            }
        });

    return promise;
}

/**
 * Finds all the events with reference to the provided tags.
 * @param {*} arrTagIds An array of tag IDs.
 * @param {*} email Optional.
 */
async function findByTags(arrTagIds, email) {
    let filter = {
        $or: [
            {
                "tags.independentTagIds": {
                    $in: arrTagIds
                }
            },
            {
                "tags.projectTagIds": {
                    $in: arrTagIds
                }
            },
            {
                "tags.ignoredProjectTagIds": {
                    $in: arrTagIds
                }
            },
        ]
    }

    if (email) filter.email = email;

    return find(filter);
}

/**
 * Finds all the events with reference to the provided tags, in their active fields only (meaning not in the ignored tags array)
 * @param {*} arrTagIds An array of tag IDs.
 * @param {*} email Optional.
 */
 async function findByActiveTags(arrTagIds, email) {
    let filter = {
        $or: [
            {
                "tags.independentTagIds": {
                    $in: arrTagIds
                }
            },
            {
                "tags.projectTagIds": {
                    $in: arrTagIds
                }
            },
        ]
    }

    if (email) filter.email = email;

    return find(filter);
}





/* --------------------------------------------------------------
-----------------------------------------------------------------
---------------------------- Exports ----------------------------
-----------------------------------------------------------------
-------------------------------------------------------------- */
module.exports = {
    find: find,
    findOne: findOne,
    insertMany: insertMany,
    deleteMany: deleteMany,

    // Custom Functions
    deleteEventsByCalendar: deleteEventsByCalendar,
    deleteByIds: deleteByIds,
    findByProject: findByProject,
    findByCalendar: findByCalendar,
    updateFetchStatus: updateFetchStatus,
    findByTags: findByTags,
    findByActiveTags: findByActiveTags,

}