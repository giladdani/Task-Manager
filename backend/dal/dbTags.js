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

async function deleteOne(query) {
    let promise = Model.deleteOne(query);

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
}