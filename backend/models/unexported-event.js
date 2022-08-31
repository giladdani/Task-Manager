const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

const unexportedEventSchema = new Schema({
    title: String,
    id: String,
    sharedId: String,
    projectTitle: String,
    projectId: String,
    projectSharedId: String,
    gEventId: String, // The ID of the Google event this local event is tied to
    calendarId: String, // The ID of the Google calendar this event is attached to, in case of partially exported projects
    start: Date,
    end: Date,
    backgroundColor: String,
    unexportedEvent: Boolean,
    email: String,
    independentTagIds: [String],
    projectTagIds: [String],
    ignoredProjectTagIds: [String],
})

const UnexportedEvent = mongoose.model('UnexportedEvent', unexportedEventSchema);
module.exports = UnexportedEvent;