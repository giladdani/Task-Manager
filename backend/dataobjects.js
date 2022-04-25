
const DAY_SUNDAY = "Sunday";
const DAY_MONDAY = "Monday";
const DAY_TUESDAY = "Tuesday";
const DAY_WEDNESDAY = "Wednesday";
const DAY_THURSDAY = "Thursday";
const DAY_FRIDAY = "Friday";
const DAY_SATURDAY = "Saturday";

class Time {
    constructor(hourInDay, minuteInDay) {
        // TODO:
        // Check if parameters are valid ranges (both int, and hour [0,23], minute [0,59])

        this.hourInDay = hourInDay;
        this.minuteInDay = minuteInDay;
    }
}

class TimeWindow {
    constructor(startTime, endTime) {
        // TODO: check end hour is after starthour
        this.startTime = startTime;
        this.endTime = endTime;
    }
}

class DayConstraint {
	constructor(day) {
        this.day = day;
        this.forbiddenTimeWindows = [];
	}

    // TODO: method to add TimeWindow ?
}


module.exports = {
    Time: Time,
    TimeWindow: TimeWindow,
    DayConstraint: DayConstraint,
}