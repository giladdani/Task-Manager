const Model = require('../models/project')

async function findOne(query) {
    const promise = await Model.findOne(query);

    return promise;
}

async function find(query) {
    const promise = await Model.find(query);

    return promise;
}

async function create(element) {
    const promise = await Model.create(element);

    return promise;
}

async function deleteOne(query) {
    const promise = Model.deleteOne(query);

    return promise;
}

async function updateOne(filter, update) {
    promise = Model.updateOne(filter, update);

    return promise;
}



/* --------------------------------------------------------------
-----------------------------------------------------------------
----------------------- Custom Functions ------------------------
-----------------------------------------------------------------
-------------------------------------------------------------- */
async function updateExportProject(projectId, googleCalendarId) {
    let promise = Model.updateOne({ 'id': projectId },
        {
            $set: {
                exportedToGoogle: true,
                googleCalendarId: googleCalendarId,
            }
        });

    return promise;
}

async function addTags(projectId, tagIds) {
    let promise = null;
    if (tagIds.length > 0) {
        promise = await Model.updateOne(
            { projectId: projectId },
            {
                $addToSet: {
                    tagIds: {
                        $each: tagIds,
                    }
                }
            }
        )
    }

    return promise;
}

async function removeTags(projectId, tagIds) {
    let promise = null;
    if (tagIds.length > 0) {
        promise = Model.updateOne(
            { projectId: projectId },
            {
                $pull: {
                    tagIds: {
                        $in: tagIds,
                    }
                }
            }
        )
    }

    return promise;
}

/**
 * Removes a deleted tag from all projects in the DB.
 */
async function deleteTag(tagId) {
    let promise = Model.updateMany(
        {},
        {
            $pull: {
                tagIds: tagId,
            }
        }
    )

    return promise;
}

/**
 * Removes all deleted tags from projects in the DB.
 * @param {*} arrTagIdsToRemove 
 * @param {*} email Optional.
 */
async function deleteTags(arrTagIdsToRemove, email) {
    let promise = null;

    if (arrTagIdsToRemove && arrTagIdsToRemove.length > 0) {
        let filter = {};
        if (email) filter.email = email;

        promise = Model.updateMany(
            filter,
            {
                $pull: {
                    tagIds: {
                        $in: arrTagIdsToRemove,
                    }
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
    findOne: findOne,
    find: find,
    create: create,
    deleteOne: deleteOne,
    updateOne: updateOne,

    // Custom Functions
    updateExportProject: updateExportProject,
    addTags: addTags,
    removeTags: removeTags,
    deleteTag: deleteTag,
    deleteTags: deleteTags,
}