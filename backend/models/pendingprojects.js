const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

const pendingProjectSchema = new Schema({
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
    sharedEmails: [String],
    exportedToGoogle: Boolean,
    googleCalendarId: String,
    maxEventsPerDay: Number,
    dayRepetitionFrequency: Number,
    dailyStartHour: Date,
    dailyEndHour: Date,
    ignoredConstraintsIds: [String],
    
    requestingUser: String,
    awaitingUserApproval: String,
})

const PendingProject = mongoose.model('PendingProject', pendingProjectSchema);
module.exports = PendingProject;