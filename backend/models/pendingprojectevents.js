const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

const pendingProjectEventSchema = new Schema({
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
    friendEmail: String,
    extendedProps: {
        isConstraint: Boolean,
    }
})

const PendingProjectEvent = mongoose.model('PendingProjectEvent', pendingProjectEventSchema);
module.exports = PendingProjectEvent;