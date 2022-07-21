const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    title: String,
    id: String,
    eventsID: [String],
    timeEstimate: Number,
    start: Date,
    end: Date,
    backgroundColor: String,
    email: String,
})

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;