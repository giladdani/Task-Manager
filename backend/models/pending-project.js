const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

// TODO: find out how to use inheritance with project schema, and then just add the few unique fields
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
    participatingEmails: [String],
    exportedToGoogle: Boolean,
    googleCalendarId: String,
    maxEventsPerDay: Number,
    dayRepetitionFrequency: Number,
    dailyStartHour: Date,
    dailyEndHour: Date,
    ignoredConstraintsIds: [String],
    tagIds: [String],
    daysOfWeek: [Number],
    
    requestingUser: String,
    awaitingApproval: [String],
    approvingUsers: [String],
})

const PendingProject = mongoose.model('PendingProject', pendingProjectSchema);
module.exports = PendingProject;