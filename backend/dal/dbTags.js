const Model = require('../models/tag.js')

async function findOne(query) {
    const promise = Model.findOne(query);

    return promise;
}

async function find(query) {
    const promise = Model.find(query);

    return promise;
}

async function create(documents) {
    const promise = Model.create(documents);

    return promise;
}

async function deleteOne(filter) {
    let promise = Model.deleteOne(filter);

    return promise;
}

async function deleteMany(filter) {
    let promise = Model.deleteMany(filter);

    return promise;
}



/* --------------------------------------------------------------
-----------------------------------------------------------------
----------------------- Custom Functions ------------------------
-----------------------------------------------------------------
-------------------------------------------------------------- */
async function findByIds(ids) {
    let promise = Model.find(
        {
            id: {
                $in: ids,
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
        let filter = {
            id: {
                $in: arrTagIdsToRemove,
            }
        }
        if (email) filter.email = email;

        promise = Model.deleteMany(filter);
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
    deleteMany: deleteMany,

    // Custom Functions
    findByIds: findByIds,
    deleteTags: deleteTags,
}