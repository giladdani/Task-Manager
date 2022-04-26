const express = require('express');
const User = require('./models/user');
const DayConstraintModel = require('./models/dayconstraint')
const EventModel = require('./models/event')
const dataObjects = require('./dataobjects');
const dataobjects = require('./dataobjects');
const utils = require('./utils');



// Routing
const router = express.Router();
router.post('/events/generate', (req, res) => { generateSchedule(req, res) });  // TODO: what's the correct URL? 


/* Schedule Generating Algorithm
The algorithm receives:
    -   Time estimate of project
    -   Starting Day
    -   Deadline \ timeframe
    -   Constraints (exist in the database, not part of the request)
        -   General
        -   Specific
        -   Spacing
        -   Existing calendars
        -   Min Session Length
        -   Max Session Length
        -   Later on: "Spread" \ Intensity (e.g ASAP or evenly spread until deadline)
*/

const generateSchedule = async (req) => {
    const projectName = req.body.projectName;
    const estimatedTimeTotal = getTimeEstimate(req);    // TODO: Int or float representing hours (decide how to model it)
    let estimatedTimeLeft = estimatedTimeTotal;         // TODO: Int or float representing hours (decide how to model it)
    // TODO: check if estiamtedTime is a positive number?

    const allConstraintsArr = await getAllConstraints();        // An array of all the constraints

    const allConstraintsSpecialObj = sortAllConstraintsIntoSpecialObj(allConstraintsArr);

    let currentDate = getTaskStartDate(req);
    let endDate = getTaskEndDate(req);
    let allEventsGeneratedBySchedule = [];

    while ((!isCurrDatePastEndDate(currentDate, endDate)) && estimatedTimeLeft > 0) {
        const allCurrDayConstraints = getAllCurrDateConstraints(currentDate, allConstraintsSpecialObj);
        const allForbiddenWindowsDayConstraint = createDayConstraintFromAllCurrDayConstraints(currentDate, allCurrDayConstraints);
        const dayConstraintAllPossibleWindows = createPossibleWindowsFromForbidden(allForbiddenWindowsDayConstraint);

        let foundAvailableWindow = true;
        const sessionLengthMinutes = req.body.sessionLengthMinutes;
        while (foundAvailableWindow) {
            let availableTimeWindowIndex = findAvailableTimeWindowIndex(sessionLengthMinutes, dayConstraintAllPossibleWindows) // find available hours matching constraints, such as min\max session length 
            if (availableTimeWindowIndex == -1) { // No time window found
                foundAvailableWindow = false;
                continue;
            }

            const possibleTimeWindow = dayConstraintAllPossibleWindows.possibleTimeWindows[availableTimeWindowIndex];
            let event = createEventFromTimeWindow(req, sessionLengthMinutes, possibleTimeWindow, currentDate); // TODO: add as a parameter all the task details, such as name
            allEventsGeneratedBySchedule.push(event);

            breakChosenWindowBySessionSize(sessionLengthMinutes, availableTimeWindowIndex, dayConstraintAllPossibleWindows); // Indicates that this time frame has been taken
            estimatedTimeLeft = updateTimeEstimate(estimatedTime, possibleTimeWindow);
        }

        currentDate = advanceDateByDays(currentDate, 1, true);
    }

    // addEventsToDB(allEventsGeneratedBySchedule); // TODO:

    return allEventsGeneratedBySchedule;
}

const breakChosenWindowBySessionSize = (sessionLengthMinutes, availableTimeWindowIndex, dayConstraintAllPossibleWindows) => {
    const chosenWindow = dayConstraintAllPossibleWindows.possibleTimeWindows[availableTimeWindowIndex];

    if (chosenWindow == null) {
        return;
    }

    dayConstraintAllPossibleWindows.possibleTimeWindows.splice(availableTimeWindowIndex, 1);

    const addedMinutes = chosenWindow.startTime.minute + sessionLengthMinutes;
    const newStartTimeHour = chosenWindow.startTime.hour + (addedMinutes / 60);
    const newStartTimeMinute = addedMinutes % 60;
    const newSmallerStartTime = new dataObjects.Time(newStartTimeHour, newStartTimeMinute);
    const newSmallerEndTime = new dataObjects.Time(chosenWindow.endTime.hour, chosenWindow.endTime.minute);

    const newSmallerTimeWindow = new dataObjects.TimeWindow(newSmallerStartTime, newSmallerEndTime);

    if (!isEmptyTimeWindow(newSmallerTimeWindow)) {
        dayConstraintAllPossibleWindows.possibleTimeWindows.push(newSmallerTimeWindow);
        // optional TODO: sort time windows
    }
}

const isNoOverlap = (timeWindow1, timeWindow2) => {
    let earlierTime = null;
    let laterTime = null;

    if (isEarlierTime(timeWindow1, timeWindow2)) {
        earlierTime = timeWindow1;
        laterTime = timeWindow2;
    } else {
        earlierTime = timeWindow2;
        laterTime = timeWindow1;
    }

    if (earlierTime.endTime.hour < laterTime.startTime.hour) {
        return true;
    }

    if (earlierTime.endTime.hour == laterTime.startTime.hour) {
        if (earlierTime.endTime.minute <= laterTime.endTime.minute) {
            return true;
        }
    }

    return false;
}

const isOverlap = (timeWindow1, timeWindow2) => {
    return ! isNoOverlap(timeWindow1, timeWindow2);
}

const createPossibleWindowsFromForbidden = (tempDayConstraint) => {
    // Initialization
    const allPossibleTimeWindowsDayConstraint = {
        possibleTimeWindows: [],
    }

    const startTime = new dataObjects.Time(00, 00);
    const endTime = new dataObjects.Time(23, 59);
    const startingTimeWindow = new dataObjects.TimeWindow(startTime, endTime)

    allPossibleTimeWindowsDayConstraint.possibleTimeWindows.push(startingTimeWindow);

    const newTimeWindowsToAdd = [];

    // Go over all forbidden
    tempDayConstraint.forbiddenTimeWindows.forEach((forbiddenTimeWindow) => {
        // Go over all possible
        for (const possibleTimeWindow of allPossibleTimeWindowsDayConstraint.possibleTimeWindows) {
            if (doesWindow1ContainWindow2(forbiddenTimeWindow, possibleTimeWindow)) {
                possibleTimeWindow.startTime = cloneTimeWindow(possibleTimeWindow.endTime);
            } else if (doesWindow1ContainWindow2(possibleTimeWindow, forbiddenTimeWindow)) {
                possibleTimeWindow.endTime = cloneTimeWindow(forbiddenTimeWindow.startTime);

                const newWindowStart = cloneTimeWindow(forbiddenTimeWindow.endTime);
                const newWindowEnd = cloneTimeWindow(possibleTimeWindow.endTime);
                const newWindow = new dataObjects.TimeWindow(newWindowStart, newWindowEnd);

                if ( ! isEmptyTimeWindow(newWindow)) {
                    newTimeWindowsToAdd.push(newWindow);
                }
            } else if ( isOverlap(possibleTimeWindow, forbiddenTimeWindow)) {
                if (isEarlierTime(forbiddenTimeWindow, possibleTimeWindow)) {
                    possibleTimeWindow.startTime = cloneTimeWindow(forbiddenTimeWindow.endTime); // "Push" possibleStart to forbiddenEnd
                } else { // Possible is earlier
                    possibleTimeWindow.endTime = cloneTimeWindow(forbiddenTimeWindow.endTime); // "Pull" possibleEnd to forbiddenStart
                }
            }
        }
    })

    // optional TODO: go over time windows and remove "empty" ones
    
    // add newTimeWindows to possibleTimeWindows
    newTimeWindowsToAdd.forEach((newTimeWindow) => {
        allPossibleTimeWindowsDayConstraint.possibleTimeWindows.push(newTimeWindow);
    })

    // OPTIONAL TODO: sort time frames

    return allPossibleTimeWindowsDayConstraint;
}

const cloneTimeWindow = (timeWindow) => {
    const cloneStartHour = timeWindow.startTime.hour;
    const cloneStartMinute = timeWindow.startTime.minute;
    const cloneTimeStart = new dataObjects.Time(cloneStartHour, cloneStartMinute);

    const cloneEndHour = timeWindow.endTime.hour;
    const cloneEndMinute = timeWindow.endTime.minute;
    const cloneTimeEnd = new dataObjects.Time(cloneEndHour, cloneEndMinute);

    const cloneTimeWindow = new dataObjects.TimeWindow(cloneTimeStart, cloneTimeEnd);

    return cloneTimeWindow;
}


const doesWindow1ContainWindow2 = (timeWindow1, timeWindow2) => {
    let doesContain = false; 

    if (isEarlierOrEqualTime(timeWindow1.startTime, timeWindow2.startTime)) {
        if (isLaterOrEqualTime(timeWindow1.endTime, timeWindow2.endTime)) {
            doesContain = true;
        }
    }

    return doesContain;
}

const isWindow1EndOverlapIntoWindow2Start = (timeWindow1, timeWindow2) => {
    // Example case 1:
    // time1: 08:00-09:30
    // time2: 09:00-12:00

    // Example case 3 (full containment):
    // time1: 09:00-15:00
    // time2: 10:00-12:00



    // Example case: 
    // possible (time2):    09:00-15:00
    // forbidden (time1):   10:00-11:00

    // time1: 15:00-18:00
    // time2: 10:00-12:00

    // time1 09:00-12:00
    // time2 08:00-13:00
    let isOverlap = false;

    if (isLaterTime(timeWindow1.endTime, timeWindow2.startTime) && isEarlierTime(timeWindow1.startTime, timeWindow2.endTime)) {
        isOverlap = true;
    }

    return isOverlap;
}

const isWindow1StartOverlapIntoWindow2End = (timeWindow1, timeWindow2) => {
    // Example case
    // time1: 09:00-12:00
    // time2: 08:00-09:30
    // Overlap area: 09:00-09:30





    // Option 1
    if ((possibleStart < forbiddenEnd) && (possibleEnd > forbiddenEnd))
        possibleStart = forbiddenEnd // "Push up" possibleStart



    let isOverlap = false;

    if (isEarlierTime(timeWindow1.startTime, timeWindow2.endTime) && (isLaterTime(timeWindow1.endTime, timeWindow2.startTime))) {
        isOverlap = true;
    }

    return isOverlap;
}

/**
 * Returns TRUE if time1 is earlier than time2
 * @param {*} timeWindow1 
 * @param {*} timeWindow2 
 * @returns 
 */
const isEarlierTime = (time1, time2) => {
    let isEarlier = false;

    isEarlier = (time1.hour < time2.hour) || (time1.hour == time2.hour && time1.minute < time2.minute);

    return isEarlier;
}

const isEarlierOrEqualTime = (time1, time2) => {
    let isEarlier = false;

    isEarlier = (time1.hour < time2.hour) || (time1.hour == time2.hour && time1.minute <= time2.minute);

    return isEarlier;
}

/**
 * Returns TRUE if time1 is later than time2
 * @param {*} time1 
 * @param {*} time2 
 * @returns 
 */
const isLaterTime = (time1, time2) => {
    let isLater = false;

    isLater = (time1.hour > time2.hour) || (time1.hour == time2.hour && time1.minute > time2.minute);

    return isLater;
}

const isLaterOrEqualTime = (time1, time2) => {
    let isLaterOrEqual = false;

    isLaterOrEqual = (time1.hour > time2.hour) || (time1.hour == time2.hour && time1.minute >= time2.minute);

    return isLaterOrEqual;
}

const isEmptyTimeWindow = (timeWindow) => {
    let isIdenticalTime = false;

    if (timeWindow.startTime.hour == timeWindow.endTimeHour && timeWindow.startTime.minute == timeWindow.startTime.minute) {
        isIdenticalTime = true;
    }

    return isIdenticalTime;
}

const breakDownContainingWindow = (containingTimeWindow, forbiddenTimeWindow) => {
    // Break down earlier part
    // earlyStart = containing.start
    // earlyEnd = forbidden.start
    const earlyStartHour = containingTimeWindow.startTime.hour;
    const earlyStartMinute = containingTimeWindow.startTime.minute;
    const earlyStartTime = new dataObjects.Time(earlyStartHour, earlyStartMinute);

    const earlyEndHour = forbiddenTimeWindow.startTime.hour;
    const earlyEndMinute = forbiddenTimeWindow.startTime.minute;
    const earlyEndTime = new dataObjects.Time(earlyEndHour, earlyEndMinute);

    const earlyWindow = new dataObjects.TimeWindow(earlyStartTime, earlyEndTime);


    // Break down late part
    // later.start = forbidden.end
    // later.end = containing.end
    const lateStartHour = forbiddenTimeWindow.endTime.hour;
    const lateStartMinute = forbiddenTimeWindow.endTime.minute;
    const lateStartTime = new dataObjects.Time(lateStartHour, lateStartMinute);

    const lateEndHour = containingTimeWindow.endTime.hour;
    const lateEndMinute = containingTimeWindow.endTime.minute;
    const lateEndTime = new dataObjects.Time(lateEndHour, lateEndMinute);

    const lateWindow = new dataObjects.TimeWindow(lateStartTime, lateEndTime);


    return [earlyWindow, lateWindow];
}

const findContainingTimeWindow = (dayWithAllPossibleTimeWindow, forbiddenTimeWindow) => {
    let possibleTimeWindowRes = undefined;

    for (const possibleTimeWindow of dayWithAllPossibleTimeWindow.possibleTimeWindows) {
        if (possibleTimeWindow.startTime.hour < forbiddenTimeWindow.startTime.hour || possibleTimeWindow.endTime.hour > forbiddenTimeWindow.endTime.hour) {
            possibleTimeWindowRes = possibleTimeWindow;
            break;
        }

        if (possibleTimeWindow.startTime.hour > forbiddenTimeWindow.startTime.hour || possibleTimeWindow.endTime.hour < forbiddenTimeWindow.endTime.hour) {
            continue;
        }

        if (isStartingHoursTheSame(possibleTimeWindow, forbiddenTimeWindow)) {
            if (isPossibleStartingMinuteLaterThanForbiddenStartingMinute(possibleTimeWindow.startTime.minute, forbiddenTimeWindow.startTime.minute)) {
                continue;
            }
        }

        if (isStartingHoursTheSame(possibleTimeWindow.endTime, forbiddenTimeWindow.endTime)) {
            if (isPossibleEndMinuteEarlierThanForbiddenLateMinute(possibleTimeWindow.endTime.minute, forbiddenTimeWindow.endTime.minute)) {
                continue;
            }
        }

        possibleTimeWindowRes = possibleTimeWindow;
        break;
    }

    return possibleTimeWindowRes;
}

const isStartingHoursTheSame = (timeWindow1, timeWindow2) => {
    return (timeWindow1.hour == timeWindow2.hour);
}

const isPossibleStartingMinuteLaterThanForbiddenStartingMinute = (possibleStartMinute, forbiddenStartMinute) => {
    return (possibleStartMinute > forbiddenStartMinute);
}

const isPossibleEndMinuteEarlierThanForbiddenLateMinute = (possibleEndMinute, forbiddenEndMinute) => {
    return (possibleEndMinute < forbiddenEndMinute);
}

// For each element:
// -	if element.start.hour > input.start.hour || element.end.hour < input.end.hour
// NOT ELEMENT, CONTINUE
// -	if element.start.hour < input.start.hour && element.end.hour > input.end.hour
// 	FOUND ELEMENT
// -	if element.start.hour == input.start.hour
// 		if (element.start.minute > input.start.minute) 
// 			BAD ELEMENT, CONTINUE
// -	if element.end.hour == input.end.hour
// 		if (element.end.minute < input.end.minute) 
// 			BAD ELEMENT, CONTINUE






const advanceDateByDays = (originalDate, days, resetToMidnightFlag) => {
    const cloneDate = new Date(originalDate.valueOf());
    cloneDate.setDate(cloneDate.getDate() + days);

    if (resetToMidnightFlag) {
        cloneDate.setHours(00, 00, 00);
    }

    return cloneDate;
}

const updateTimeEstimate = (estimatedTime, timeWindow) => {
    const startDate = new Date();
    const endDate = new Date(startDate);

    const startHour = timeWindow.startTime.hour;
    const startMinute = timeWindow.startTime.minute;
    startDate.setHours(startHour, startMinute, 00);

    const endHour = timeWindow.endTime.hour;
    const endMinute = timeWindow.endTime.minute;
    endDate.setHours(endHour, endMinute, 00);

    // Subtract from estimated time
    let hoursDiff = Math.abs(endDate - startDate) / 3_600_000;

    const newEstimate = estimatedTime - hoursDiff;

    return newEstimate;
}

const createEventFromTimeWindow = (req, sessionLengthMinutes, availableTimeWindow, currentDate) => {
    const userID = utils.getUserIDFromReq(req);
    const projectName = req.body.projectName;
    const eventName = projectName;

    const startHour = availableTimeWindow.startTime.hour;
    const startMinute = availableTimeWindow.startTime.minute;
    const startDate = new Date(currentDate);
    startDate.setHours(startHour, startMinute, 00);

    let endHour = startHour + (sessionLengthMinutes / 60);
    const minutesRemainder = sessionLengthMinutes % 60;
    let endMinute = (minutesRemainder + startMinute);
    if (endMinute >= 60) {
        endHour++;
        endMinute = endMinute % 60;
    }

    const endDate = new Date(currentDate);
    endDate.setHours(endHour, endMinute, 00);

    const event = {
        userID: userID,
        eventName: eventName,
        projectName: projectName,
        startDate: startDate,
        endDate: endDate,
    }

    return event;
}

/**
 * This function returns the index of an available time window.
 * It requires an object that has all possible time windows, as well as the requirements for the session length.
 * Meaning: minimum session size, maximum session size // TODO: add this a parameter
 * It returns NULL if no time window that matches the requirements can be found.
 */
const findAvailableTimeWindowIndex = (sessionLengthMinutes, dayConstraintAllPossibleWindows) => {
    let resIndex = -1;
    const possibleTimeWindows = dayConstraintAllPossibleWindows.possibleTimeWindows;
    for (let i = 0; i < possibleTimeWindows.length; i++) {
        const minutesInWindow = getMinutesInWindow(possibleTimeWindows[i]);
        if (minutesInWindow >= sessionLengthMinutes) {
            resIndex = i;
            break;
        }
    }

    return resIndex;
}

const getMinutesInWindow = (timeWindow) => {
    const startTime = timeWindow.startTime;
    const endTime = timeWindow.endTime;

    const minutes = endTime.minute + (60 - startTime.minute);
    const hours = endTime.hour - startTime.hour;

    if (minutes < 60) {
        hours = hours - 1;
    } else {
        minutes = minutes - 60
    }

    const totalMinutes = minutes + (hours * 60);

    return totalMinutes;
}

/**
 * This function creates a temporary object of a specific day and its constraints.
 * Meaning it receives all the relevant constraints as an array,
 * and creates from them a temporary DayConstraint object 
 * which states which hours are possible for work
 * @param {*} allCurrDayConstraints 
 */
const createDayConstraintFromAllCurrDayConstraints = (currentDate, allCurrDayConstraints) => {
    const dayConstraint = new dataobjects.DayConstraint(null);

    allCurrDayConstraints.forEach((dayConstraint) => {
        dayConstraint.forbiddenTimeWindows.forEach((forbiddenTimeWindow) => {
            dayConstraint.forbiddenTimeWindows.push(forbiddenTimeWindow);
        })
    })

    // TODO: optimization - merge hours(e.g. 11:00-12:30 and 11:30-13:00 become a single frame of 11:00-13:00)

    return dayConstraint;
}

/**
 * This function returns all the constraints relevant to a given date.
 * Relevant constraints are either those which are general constraints for the relevant day 
 * (e.g. all Tuesday constraints, if currentDate is a Tuesday)
 * or all constraints relevant to the specific date alone
 * This function also needs to receive an object of all constraints // TODO: add parameter
 * @param {*} currentDate 
 */
const getAllCurrDateConstraints = (currentDate, allConstraintsSpecialObj) => {
    const dayNum = currentDate.getDay();

    let allDayConstraints = null;

    if (dayNum == 0) {
        allDayConstraints = allConstraintsSpecialObj.Sunday;
    }

    if (dayNum == 1) {
        allDayConstraints = allConstraintsSpecialObj.Monday;
    }

    if (dayNum == 2) {
        allDayConstraints = allConstraintsSpecialObj.Tuesday;
    }

    if (dayNum == 3) {
        allDayConstraints = allConstraintsSpecialObj.Wednesday;
    }

    if (dayNum == 4) {
        allDayConstraints = allConstraintsSpecialObj.Thursday;
    }

    if (dayNum == 5) {
        allDayConstraints = allConstraintsSpecialObj.Friday;
    }

    if (dayNum == 6) {
        allDayConstraints = allConstraintsSpecialObj.Saturday;
    }

    return allDayConstraints;
}

const sortAllConstraintsIntoSpecialObj = (allConstraintsArr) => {
    const allConstraintsObj = {
        Sunday: [],
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
    }

    allConstraintsArr.forEach((dayConstraint) => {
        if (dayConstraint.day == "Sunday") {
            allConstraintsObj.Sunday.push(dayConstraint);
        } else if (dayConstraint.day == "Monday") {
            allConstraintsObj.Monday.push(dayConstraint);
        } else if (dayConstraint.day == "Tuesday") {
            allConstraintsObj.Tuesday.push(dayConstraint);
        } else if (dayConstraint.day == "Wednesday") {
            allConstraintsObj.Wednesday.push(dayConstraint);
        } else if (dayConstraint.day == "Thursday") {
            allConstraintsObj.Thursday.push(dayConstraint);
        } else if (dayConstraint.day == "Friday") {
            allConstraintsObj.Friday.push(dayConstraint);
        } else if (dayConstraint.day == "Saturday") {
            allConstraintsObj.Saturday.push(dayConstraint);
        }
    })

    return allConstraintsObj;
}


const getTaskStartDate = (req) => {
    // TODO: checks
    return req.body.startDate;
}

const getTaskEndDate = (req) => {
    // TODO: check
    return req.body.endDate;
}

const isCurrDatePastEndDate = (currentDate, endDate) => {
    return new Date(currentDate) > new Date(endDate);
}


function compareTime(time1, time2) {
    return new Date(time1) > new Date(time2); // true if time1 is later
}

const getTimeEstimate = (request) => {
    const estimatedTime = request.body.estimatedTime;

    return estimatedTime;
}

const getAllConstraints = async () => {
    // TODO: get all constraints
    // Maybe this should be a more general function, not just for the algorithm?
    // The front-end for example will want to display all constraints on the constraints-page too so the server should offer this in general
    const allConstraints = await DayConstraintModel.find({}); // TODO: find based on user

    return allConstraints;
}

module.exports = {
    generateSchedule: generateSchedule,
}