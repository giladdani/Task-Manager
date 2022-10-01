class Time {
    constructor(hour, minute) {
        this.hour = hour;
        this.minute = minute;
    }
}

class TimeWindow {
    constructor(startTime, endTime) {
        this.startTime = startTime;
        this.endTime = endTime;
    }
}

class DayConstraint {
	constructor(day) {
        this.day = day;
        this.forbiddenTimeWindows = [];
	}
}

module.exports = {
    Time: Time,
    TimeWindow: TimeWindow,
    DayConstraint: DayConstraint,
}