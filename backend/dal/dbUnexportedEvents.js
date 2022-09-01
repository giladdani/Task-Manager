const Model = require('../models/unexported-event')

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

/**
 * https://www.mongodb.com/docs/manual/reference/method/db.collection.updateOne/
 */
async function updateOne(filter, update) {
    const promise = Model.updateOne(filter, update);

    return promise;
}

/**
 * 
 * @param {*} filter 
 * @param {*} update 
 * @returns 
 */
async function updateMany(filter, update) {
    const promise = Model.updateMany(filter, update);

    return promise;
}

async function insertMany(events) {
    let promise = Model.insertMany(events);

    return promise;
}

async function deleteOne(query) {
    let promise = Model.deleteOne(query);

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
async function findByProject(email, projectId) {
    let promise = await Model.find(
        {
            email: email,
            projectId: projectId,
        }
    )

    return promise;
}

/**
 * When patching a project, certain fields also "trickle down" to the events.
 * This updates all events related to the updated project, with the new fields.
 * @param {*} projectId The ID of the project that was patched.
 * @param {*} eventUpdates The fields to update in the events.
 */
async function patchEventsFromProjectPatch(projectId, eventUpdates) {
    let objForUpdate = { $set: eventUpdates }

    if (eventUpdates.projectTagIds) {
        /**
         * If project tag IDs are updated, we need to remove from the event's "ignored tags" all the tags that no longer exist in the project.
         * For example: consider a Project has tags A, B, C.
         * An event ignored tag B.
         * The project tags are updated to A, C, D.
         * We need to remove ignored tag B from the event's ignored list, as it's no longer part of the project tags.
         */
        let pullUpdate = {
            $pull: {
                "tags.ignoredProjectTagIds": {
                    $nin: eventUpdates.projectTagIds,
                }
            }
        }

        await Model.updateMany(
            { projectId: projectId },
            pullUpdate,
        );

        // objForUpdate = {
        //     objForUpdate,
        //     pullUpdate,
        // }
    }


    let promise = Model.updateMany(
        { projectId: projectId },
        objForUpdate
    );

    return promise;
}

/**
 * Removes tags from all events.
 * @param {*} arrTagIds An array of tag IDs to remove.
 * @param {*} email Optional.
 * @returns 
 */
async function deleteTags(arrTagIds, email) {
    let promise = null;

    if (arrTagIds && arrTagIds.length > 0) {
        let filter = {};
        if (email) filter.email = email;
        promise = Model.updateMany(
            filter,
            {
                $pull: {
                    "tags.independentTagIds": {
                        $in: arrTagIds,
                    },
                    "tags.projectTagIds": {
                        $in: arrTagIds,
                    },
                    "tags.ignoredProjectTagIds": {
                        $in: arrTagIds,
                    },
                }
            }
        )
    }

    return promise;
}





/* --------------------------------------------------------------
-----------------------------------------------------------------
---------------------------- Exports ----------------------------
-----------------------------------------------------------------
-------------------------------------------------------------- */
module.exports = {
    find: find,
    findOne: findOne,
    updateOne: updateOne,
    updateMany: updateMany,
    insertMany: insertMany,
    deleteOne: deleteOne,
    deleteMany: deleteMany,

    // Custom Functions
    findByProject: findByProject,
    patchEventsFromProjectPatch: patchEventsFromProjectPatch,
    deleteTags: deleteTags,
}