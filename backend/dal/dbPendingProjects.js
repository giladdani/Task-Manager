const Model = require('../models/pending-project')

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
async function addApprovingUser(projectSharedId, approverEmail) {
    // add user to approving users
    await Model.updateOne({ 'sharedId': projectSharedId },
        {
            $push: {
                approvingUsers: approverEmail,
            }
        });

    // remove user from awaiting approval
    await Model.updateOne({ 'sharedId': projectSharedId },
        {
            $pull: {
                awaitingApproval: approverEmail,
            }
        });
}



/* --------------------------------------------------------------
-----------------------------------------------------------------
---------------------------- Exports ----------------------------
-----------------------------------------------------------------
-------------------------------------------------------------- */
module.exports = {
    find: find,
    findOne: findOne,
    create: create,
    deleteOne: deleteOne,

    // Custom Functions
    addApprovingUser: addApprovingUser,
}