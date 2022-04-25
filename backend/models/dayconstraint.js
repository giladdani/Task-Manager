const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

class Time {
    constructor(hourInDay, minuteInDay) {
        // TODO:
        // Check if parameters are valid ranges (both int, and hour [0,23], minute [0,59])

        this.hourInDay = hourInDay;
        this.minuteInDay = minuteInDay;
    }
}

class TimeWindow {
    constructor(startHour, endHour) {
        // TODO: check end hour is after starthour
        this.startHour = startHour;
        this.endHour = endHour;
    }
}

const dayConstraintSchema = new Schema({
    day: String,
    forbiddenTimeWindows: [Schema.Types.Mixed],
    // userID: Number,
    // constraintID: Number.
})


const DayConstraint = mongoose.model('DayConstraint', dayConstraintSchema);
module.exports = DayConstraint;