const express = require('express');
const User = require('./models/user');
const DayConstraintModel = require('./models/constraintevent')
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
    let allEventsGeneratedBySchedule = [];

    try {
        const projectName = req.body.projectName;
        const allEvents = req.body.allEvents;
        const estimatedTimeTotal = getTimeEstimate(req);    // TODO: Int or float representing hours (decide how to model it)
        let estimatedTimeLeft = estimatedTimeTotal;         // TODO: Int or float representing hours (decide how to model it)
        // TODO: check if estiamtedTime is a positive number?

        const spacingBetweenEventsMinutes = getSpacingBetweenEvents(req);
        const allConstraintsArr = await getAllConstraints();        // An array of all the constraints
        const allConstraintsSpecialObj = sortAllConstraintsIntoSpecialObj(allConstraintsArr);
        let currentDate = getTaskStartDate(req);
        let endDate = getTaskEndDate(req);

        // TODO: performance: remove all the events before the start time and after the end time of the project?

        while ((!isCurrDatePastEndDate(currentDate, endDate)) && estimatedTimeLeft > 0) {
            const allCurrDayConstraints = getAllCurrDateConstraintsAndEvents(currentDate, allConstraintsSpecialObj);
            const allCurrDayEvents = getAllCurrDayEvents(currentDate, allEvents);
            // TODO: for performance, remove allCurrDatEvents from the allEvents object, to gradually size it down?
            const allForbiddenWindowsDayConstraint = createDayConstraintFromAllCurrDayConstraints(currentDate, allCurrDayConstraints, allCurrDayEvents);
            const dayConstraintAllPossibleWindows = createPossibleWindowsFromForbidden(allForbiddenWindowsDayConstraint);

            let foundAvailableWindow = true;
            const sessionLengthMinutes = getSessionLength(req);

            while (foundAvailableWindow && estimatedTimeLeft > 0) {
                const sessionLengthToFind = getSessionLengthFromEstimatedTimeLeft(sessionLengthMinutes, estimatedTimeLeft);

                let availableTimeWindowIndex = findAvailableTimeWindowIndex(sessionLengthToFind, dayConstraintAllPossibleWindows) // find available hours matching constraints, such as min\max session length 
                if (availableTimeWindowIndex == -1) { // No time window found
                    foundAvailableWindow = false;
                    continue;
                }

                const possibleTimeWindow = dayConstraintAllPossibleWindows.possibleTimeWindows[availableTimeWindowIndex];
                let event = createEventFromTimeWindow(req, sessionLengthToFind, possibleTimeWindow, currentDate); // TODO: add as a parameter all the task details, such as name
                allEventsGeneratedBySchedule.push(event);

                shrinkChosenWindowFromStartBySessionSize(sessionLengthToFind, availableTimeWindowIndex, dayConstraintAllPossibleWindows, spacingBetweenEventsMinutes); // Indicates that this time frame has been taken
                estimatedTimeLeft = updateTimeEstimate(estimatedTimeLeft, sessionLengthToFind);
            }

            currentDate = advanceDateByDays(currentDate, 1, true);
        }
    } catch (err) {
        console.log("error in schedule generating algorithm:" + err);
    }


    /* TODO:
    Add following details to events:
        *   User email
        *   Something to mark them as project events not yet exported to Google

    */

    console.log("Finished generating schedule");
    return allEventsGeneratedBySchedule;
}

const getSessionLengthFromEstimatedTimeLeft = (sessionLengthMinutesPreference, estimatedTimeLeft) => {
    let sessionLengthRes;

    let sessionLengthPrefInHours = sessionLengthMinutesPreference / 60;

    if (estimatedTimeLeft > sessionLengthPrefInHours) {
        sessionLengthRes = sessionLengthMinutesPreference;
    } else {
        sessionLengthRes = Math.ceil(estimatedTimeLeft * 60);
    }

    return sessionLengthRes;
}

const shrinkChosenWindowFromStartBySessionSize = (sessionLengthMinutes, availableTimeWindowIndex, dayConstraintAllPossibleWindows, spacingBetweenEventsMinutes) => {
    const chosenWindow = dayConstraintAllPossibleWindows.possibleTimeWindows[availableTimeWindowIndex];

    if (chosenWindow == null) {
        return;
    }

    let addedMinutes = chosenWindow.startTime.minute + sessionLengthMinutes + spacingBetweenEventsMinutes;
    addedMinutes = Math.min(addedMinutes, getMinutesInWindow(chosenWindow));
    const newStartTimeHour = chosenWindow.startTime.hour + Math.floor((addedMinutes / 60));
    const newStartTimeMinute = addedMinutes % 60;
    const newSmallerStartTime = new dataObjects.Time(newStartTimeHour, newStartTimeMinute);

    chosenWindow.startTime = newSmallerStartTime;

    if (isEmptyTimeWindow(chosenWindow)) {
        dayConstraintAllPossibleWindows.possibleTimeWindows.splice(availableTimeWindowIndex, 1);
    }
}

const isNoOverlap = (timeWindow1, timeWindow2) => {
    let earlierTime = null;
    let laterTime = null;

    if (isEarlierStartTimeTime(timeWindow1, timeWindow2)) {
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
        if (earlierTime.endTime.minute <= laterTime.startTime.minute) {
            return true;
        }
    }

    return false;
}

const isOverlap = (timeWindow1, timeWindow2) => {
    return !isNoOverlap(timeWindow1, timeWindow2);
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


    // Go over all forbidden
    tempDayConstraint.forbiddenTimeWindows.forEach((forbiddenTimeWindow) => {
        const newTimeWindowsToAdd = [];
        for (const possibleTimeWindow of allPossibleTimeWindowsDayConstraint.possibleTimeWindows) {
            let timeWindow1 = null;
            let timeWindow2 = null;

            if (doesWindow1ContainWindow2(forbiddenTimeWindow, possibleTimeWindow)) {
                possibleTimeWindow.startTime = cloneTime(possibleTimeWindow.endTime);
            } else if (doesWindow1ContainWindow2(possibleTimeWindow, forbiddenTimeWindow)) {
                const newWindowStart = cloneTime(forbiddenTimeWindow.endTime);
                const newWindowEnd = cloneTime(possibleTimeWindow.endTime);
                const newWindow = new dataObjects.TimeWindow(newWindowStart, newWindowEnd);
                if (!isEmptyTimeWindow(newWindow)) {
                    timeWindow2 = newWindow;
                }

                possibleTimeWindow.endTime = cloneTime(forbiddenTimeWindow.startTime);
                if (!isEmptyTimeWindow(possibleTimeWindow)) {
                    timeWindow1 = cloneTimeWindow(possibleTimeWindow);
                }
            } else if (isOverlap(possibleTimeWindow, forbiddenTimeWindow)) {
                if (isEarlierStartTimeTime(forbiddenTimeWindow, possibleTimeWindow)) {
                    possibleTimeWindow.startTime = cloneTime(forbiddenTimeWindow.endTime); // "Push" possibleStart to forbiddenEnd

                    if (!isEmptyTimeWindow(possibleTimeWindow)) {
                        timeWindow1 = cloneTimeWindow(possibleTimeWindow);
                    }
                } else { // Possible is earlier
                    possibleTimeWindow.endTime = cloneTime(forbiddenTimeWindow.endTime); // "Pull" possibleEnd to forbiddenStart

                    if (!isEmptyTimeWindow(possibleTimeWindow)) {
                        timeWindow1 = cloneTimeWindow(possibleTimeWindow);
                    }
                }
            } else { // No contact at all between them
                timeWindow1 = cloneTimeWindow(possibleTimeWindow);
            }

            if (timeWindow1 != null) {
                newTimeWindowsToAdd.push(timeWindow1);
            }

            if (timeWindow2 != null) {
                newTimeWindowsToAdd.push(timeWindow2);
            }
        }

        allPossibleTimeWindowsDayConstraint.possibleTimeWindows = newTimeWindowsToAdd;
    })

    // optional TODO: go over time windows and remove "empty" ones


    // OPTIONAL TODO: sort time frames

    return allPossibleTimeWindowsDayConstraint;
}

const cloneTime = (timeWindow) => {
    const cloneHour = timeWindow.hour;
    const cloneMinute = timeWindow.minute;
    const cloneTime = new dataObjects.Time(cloneHour, cloneMinute);

    return cloneTime;
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

    if (isLaterTime(timeWindow1.endTime, timeWindow2.startTime) && isEarlierStartTimeTime(timeWindow1.startTime, timeWindow2.endTime)) {
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

    if (isEarlierStartTimeTime(timeWindow1.startTime, timeWindow2.endTime) && (isLaterTime(timeWindow1.endTime, timeWindow2.startTime))) {
        isOverlap = true;
    }

    return isOverlap;
}

/**
 * Returns TRUE if time1 starts earlier than time2
 * @param {*} timeWindow1 
 * @param {*} timeWindow2 
 * @returns 
 */
const isEarlierStartTimeTime = (time1, time2) => {
    let isEarlier = false;

    isEarlier = (time1.startTime.hour < time2.startTime.hour) || (time1.startTime.hour == time2.startTime.hour && time1.startTime.minute < time2.startTime.minute);

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

    if (timeWindow.startTime.hour == timeWindow.endTime.hour && timeWindow.startTime.minute == timeWindow.startTime.minute) {
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

const updateTimeEstimate = (estimatedTimeLeft, sessionLengthMinutes) => {
    // estimated time - hours given in float

    const hoursInSession = Math.floor(sessionLengthMinutes / 60);
    const minuteRemainder = sessionLengthMinutes % 60; // 15
    const minuteRatioInHour = minuteRemainder / 60;

    estimatedTimeLeft = estimatedTimeLeft - hoursInSession;
    estimatedTimeLeft = estimatedTimeLeft - minuteRatioInHour;

    return estimatedTimeLeft;
}

const createEventFromTimeWindow = (req, sessionLengthMinutes, availableTimeWindow, currentDate) => {
    const userID = utils.getUserIDFromReq(req);
    const projectName = req.body.projectName;
    const eventName = projectName;

    const startHour = availableTimeWindow.startTime.hour;
    const startMinute = availableTimeWindow.startTime.minute;
    const startDate = new Date(currentDate);
    startDate.setHours(startHour, startMinute, 00);

    let endHour = startHour + Math.floor((sessionLengthMinutes / 60));
    const minutesRemainder = sessionLengthMinutes % 60;
    let endMinute = (minutesRemainder + startMinute);
    if (endMinute >= 60) {
        endHour++;
        endMinute = endMinute % 60;
    }

    const endDate = new Date(currentDate);
    endDate.setHours(endHour, endMinute, 00);

    const event = {
        // userID: userID,
        title: projectName,
        start: startDate,
        end: endDate,
        backgroundColor: "green",
        unexportedEvent: true,
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

    let minutes = endTime.minute + (60 - startTime.minute);
    let hours = endTime.hour - startTime.hour;

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
const createDayConstraintFromAllCurrDayConstraints = (currentDate, allCurrDayConstraints, allCurrDayEvents) => {
    const dayConstraintRes = new dataobjects.DayConstraint(null);

    allCurrDayEvents.forEach((dayEvent) => {
        // Create forbidden time window from day hours

        const startDate = new Date(dayEvent.start);
        const startHour = startDate.getHours();
        const startMin = startDate.getMinutes();        
        const startTime = new dataobjects.Time(startHour, startMin);

        const endDate = new Date(dayEvent.end);
        const endHour = endDate.getHours();
        const endMin = endDate.getMinutes();
        const endTime = new dataobjects.Time(endHour, endMin);

        const timeWindow = new dataobjects.TimeWindow(startTime, endTime);

        dayConstraintRes.forbiddenTimeWindows.push(timeWindow);
    })

    allCurrDayConstraints.forEach((dayConstraint) => {
        const startTimeSplitStr = dayConstraint.startTime.split(":");
        const startHour = Number(startTimeSplitStr[0]);
        const startMin = Number(startTimeSplitStr[1]);
        const startTime = new dataobjects.Time(startHour, startMin);


        const endTimeSplitStr = dayConstraint.endTime.split(":");
        const endHour = Number(endTimeSplitStr[0]);
        const endMin = Number(endTimeSplitStr[1]);
        const endTime = new dataobjects.Time(endHour, endMin);

        const timeWindow = new dataobjects.TimeWindow(startTime, endTime);

        dayConstraintRes.forbiddenTimeWindows.push(timeWindow);
    })


    // OLD CODE before using allEvents
    // allCurrDayConstraints.forEach((dayConstraint) => {
    //     dayConstraint.forbiddenTimeWindows.forEach((forbiddenTimeWindow) => {
    //         dayConstraintRes.forbiddenTimeWindows.push(forbiddenTimeWindow);
    //     })
    // })

    // TODO: optimization - merge hours(e.g. 11:00-12:30 and 11:30-13:00 become a single frame of 11:00-13:00)

    return dayConstraintRes;
}

/**
 * This function returns all the constraints relevant to a given date.
 * Relevant constraints are either those which are general constraints for the relevant day 
 * (e.g. all Tuesday constraints, if currentDate is a Tuesday)
 * or all constraints relevant to the specific date alone
 * This function also needs to receive an object of all constraints // TODO: add parameter
 * @param {*} currentDate 
 */
const getAllCurrDateConstraintsAndEvents = (currentDate, allConstraintsSpecialObj) => {
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

const getAllCurrDayEvents = (currentDate, allEvents) => {
    let allCurrDayEvents = [];
    const currDateWithoutTime = new Date(currentDate).setHours(0,0,0,0);
    allEvents.forEach((event) => {
        let eventDateStartWithoutTime = new Date(event.start).setHours(0,0,0,0);
        let eventDateEndWithoutTime = new Date(event.end).setHours(0,0,0,0);

        if (eventDateStartWithoutTime.valueOf() === currDateWithoutTime.valueOf()) {
            allCurrDayEvents.push(event);
        }
    })

    return allCurrDayEvents;
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
        if (dayConstraint.daysOfWeek.includes(0)) {
            allConstraintsObj.Sunday.push(dayConstraint);
        }

        if (dayConstraint.daysOfWeek.includes(1)) {
            allConstraintsObj.Monday.push(dayConstraint);
        }

        if (dayConstraint.daysOfWeek.includes(2)) {
            allConstraintsObj.Tuesday.push(dayConstraint);
        }

        if (dayConstraint.daysOfWeek.includes(3)) {
            allConstraintsObj.Wednesday.push(dayConstraint); 
        }

        if (dayConstraint.daysOfWeek.includes(4)) {
            allConstraintsObj.Thursday.push(dayConstraint);    
        }

        if (dayConstraint.daysOfWeek.includes(5)) {
            allConstraintsObj.Friday.push(dayConstraint);
        }

        if (dayConstraint.daysOfWeek.includes(6)) {
            allConstraintsObj.Saturday.push(dayConstraint); 
        }
    })

    return allConstraintsObj;
}


const getTaskStartDate = (req) => {
    // TODO: checks
    const dateString = req.body.startDate;
    const date = new Date(dateString);

    return date;
}

const getTaskEndDate = (req) => {
    // TODO: check
    const dateString = req.body.endDate;
    const date = new Date(dateString);

    return date;
}

const isCurrDatePastEndDate = (currentDate, endDate) => {
    return new Date(currentDate) > new Date(endDate);
}


function compareTime(time1, time2) {
    return new Date(time1) > new Date(time2); // true if time1 is later
}

const getSessionLength = (request) => {
    // TODO: checks, and return null if needed
    let sessionLength = request.body.sessionLengthMinutes;

    sessionLength = parseInt(sessionLength);

    return sessionLength;
}

const getSpacingBetweenEvents = (request) => {
    let spacingMin = request.body.spacingLengthMinutes;

    spacingMin = parseInt(spacingMin);

    return spacingMin;
}

const getTimeEstimate = (request) => {
    let estimatedTime = request.body.estimatedTime;

    estimatedTime = parseFloat(estimatedTime);

    return estimatedTime;
}

const getAllConstraints = async () => {
    // TODO: get all constraints
    // Maybe this should be a more general function, not just for the algorithm?
    // The front-end for example will want to display all constraints on the constraints-page too so the server should offer this in general
    const allConstraints = await DayConstraintModel.find({}); // TODO: find based on user

    // TODO: translate to our objects


    return allConstraints;
}

module.exports = {
    generateSchedule: generateSchedule,
}