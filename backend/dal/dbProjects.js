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

    // Custom Functions
    updateExportProject: updateExportProject,
}