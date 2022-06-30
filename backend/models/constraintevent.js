const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

const constraintEventSchema = new Schema({
    daysOfWeek: [Number],
    start: Date,
    end: Date,
    startRecur: Date,
    endRecur: Date,
    startTime: String,
    endTime: String,
    display: String,
    isConstraint: Boolean,
    backgroundColor: String,
    title: String,
    // userID: Number,
    // constraintID: Number.
})

const ConstraintEvent = mongoose.model('ConstraintEvent', constraintEventSchema);
module.exports = ConstraintEvent;