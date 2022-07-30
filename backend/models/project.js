const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    title: String,
    id: String,
    sharedId: String,
    timeEstimate: Number,
    start: Date,
    end: Date,
    sessionLengthMinutes: Number,
    spacingLengthMinutes: Number,
    backgroundColor: String,
    email: String,
    exportedToGoogle: Boolean,
    googleCalendarId: String,
    maxEventsPerDay: Number,
    dayRepetitionFrequency: Number,
})

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;