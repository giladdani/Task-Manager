const Model = require('../models/unexported-event')

async function find(query) {
    const promise = Model.find(query);

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



/* --------------------------------------------------------------
-----------------------------------------------------------------
---------------------------- Exports ----------------------------
-----------------------------------------------------------------
-------------------------------------------------------------- */
module.exports = {
    find: find,
    insertMany: insertMany,
    deleteOne: deleteOne,
    deleteMany: deleteMany,

    // Custom Functions
    findByProject: findByProject,
}