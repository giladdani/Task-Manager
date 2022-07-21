const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

const projectEventSchema = new Schema({
    title: String,
    eventID: String,
    projectName: String,
    projectID: String,
    start: Date,
    end: Date,
    backgroundColor: String,
    unexportedEvent: Boolean,
    email: String,
})

const ProjectEvent = mongoose.model('ProjectEvent', projectEventSchema);
module.exports = ProjectEvent;