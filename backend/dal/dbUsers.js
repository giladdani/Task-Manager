
const UserModel = require('./models/user');

async function updateOne(filter, update, options) {
    return UserModel.updateOne(filter, update, options);
}

module.exports = {
    // updateOne: updateOne,
}