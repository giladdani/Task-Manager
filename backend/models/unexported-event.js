const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

const unexportedEventSchema = new Schema({
    title: String,
    id: String,
    sharedId: String,
    projectTitle: String,
    projectId: String,
    projectSharedId: String,
    start: Date,
    end: Date,
    backgroundColor: String,
    unexportedEvent: Boolean,
    email: String,
    tags: [Schema.Types.Mixed],
})

const UnexportedEvent = mongoose.model('UnexportedEvent', unexportedEventSchema);
module.exports = UnexportedEvent;