const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

const eventSchema = new Schema({
    userID: Number,
    title: String,
    // eventID: Number,
    projectName: String,
    // projectID: String,
    start: Date,
    end: Date,
    backgroundColor: String,
    unexportedEvent: Boolean,
    // user ID
})

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;