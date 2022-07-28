const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    title: String,
    id: String,
    timeEstimate: Number,
    start: Date,
    end: Date,
    sessionLengthMinutes: Number,
    spacingLengthMinutes: Number,
    backgroundColor: String,
    email: String,
    exportedToGoogle: Boolean,
    googleCalendarId: String
})

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;