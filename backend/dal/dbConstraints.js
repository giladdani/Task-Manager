const Model = require('../models/constraint')

async function findOne(query) {
    const promise = await Model.findOne(query);

    return promise;
}

async function find(query) {
    const promise = await Model.find(query);

    return promise;
}

async function create(documents) {
    const promise = await Model.create(documents);

    return promise;
}

async function deleteOne(query) {
    let promise = Model.deleteOne(query);

    return promise;
}

async function replaceOne(filter, replacement) {
    let promise = Model.updateOne(filter, replacement);

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
    replaceOne: replaceOne,
}