const Model = require('../models/constraint')

async function findOne(query) {
    const promise = await Model.findOne(query);

    return promise;
}

async function find(query) {
    const promise = await Model.find(query);

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
}