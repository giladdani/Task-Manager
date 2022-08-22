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
    participatingEmails: [String],
    exportedToGoogle: Boolean,
    googleCalendarId: String,
    maxEventsPerDay: Number,
    dayRepetitionFrequency: Number,
    dailyStartHour: Date,
    dailyEndHour: Date,
    ignoredConstraintsIds: [String],
    tags: [Schema.Types.Mixed]
})

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;