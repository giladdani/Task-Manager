const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

const eventSchema = new Schema({
    userID: Number,
    eventName: String,
    // eventID: Number,
    projectName: String,
    // projectID: String,
    startDate: Date,
    endDate: Date,
})

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;