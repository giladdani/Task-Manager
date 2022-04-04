const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    user_name: String,
    refresh_token: String
    // last_name: String,
    // age: Number,
    // position: String
})

const User = mongoose.model('User', userSchema);
module.exports = User;