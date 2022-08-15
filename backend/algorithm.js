const DayConstraintModel = require('./models/constraintevent')
const EventModel = require('./models/projectevent')
const dataObjects = require('./dataobjects');
const dataobjects = require('./dataobjects');
const utils = require('./utils');

/**
 * This function receives an event to reschedule, with the event's project - which holds its parameters.
 * The function stops upon finding the first available time slow to insert the event.
 * It returns a single event object with the new dates.
 * @param {*} event 
 * @param {*} project 
 */
const rescheduleEvent = async (event, allEvents, project) => {
    // Get event length
    const eventStartDate = utils.getEventStart(event);
    const eventEndDate = utils.getEventEnd(event);
    let hoursInEvent = Math.abs(eventEndDate - eventStartDate) / 36e5;
    project.timeEstimate = hoursInEvent;

    const currDate = new Date();
    if (eventStartDate < currDate) {
        project.start = currDate;
    } else {
        project.start = eventEndDate;
    }

    // TODO: allow the user to decide to reschedule from current date or from the event's date and onwards

    const [events, estimatedTimeLeft] = await generateSchedule(project);

    return [events, estimatedTimeLeft];
}

const generateSchedule = async (project) => {
    let allEventsGeneratedBySchedule = [];
    let timeLeft = null;
    let allEvents = await getAllEvents(project);
    const estimatedTimeTotal = project.timeEstimate;
    let estimatedTimeLeft = estimatedTimeTotal;
    const spacingBetweenEventsMinutes = project.spacingLengthMinutes;
    const allConstraintsArr = await getAllConstraints(project);
    const allConstraintsSpecialObj = sortAllConstraintsIntoSpecialObj(allConstraintsArr);
    let currentDate = getStartDate(project);
    currentDate = resetDateFields(currentDate, false, false, true, true); // Reset the seconds and milliseconds to avoid failing comparisons on inconsequential details
    let endDate = new Date(project.end);
    const maxEventsPerDay = Number(project.maxEventsPerDay);
    const sessionLengthMinutes = project.sessionLengthMinutes;

    console.log(`[generateSchedule] Number of events before filter: ${allEvents.length}`)
    allEvents = filterEvents(allEvents, currentDate, endDate);
    console.log(`[generateSchedule] Number of events after filter: ${allEvents.length}`)

    let firstIteration = true;
    while ((!isCurrDatePastEndDate(currentDate, endDate)) && estimatedTimeLeft > 0) {
        const allCurrDayConstraints = getAllCurrDateConstraints(currentDate, allConstraintsSpecialObj);
        const allCurrDayEvents = getAllCurrDayEvents(currentDate, allEvents);
        const allConstraintsAsEvents = changeConstraintsToEvents(allCurrDayConstraints, currentDate, project);
        allConstraintsAsEvents.forEach(constraintEvent => allCurrDayEvents.push(constraintEvent));

        //  go over all curr day events and check if any of them belong to the project
        let eventsSoFarInDay = 0;
        for (const event of allCurrDayEvents) {
            if (event.extendedProps && event.extendedProps.projectId) {
                if (event.extendedProps.projectId == project.id) {
                    eventsSoFarInDay++;
                }
            }
        }

        // We set the start time based on the current date, in case this is the first day of the project, and the user wants to start from specific hours.
        // let currStartTime = new dataObjects.Time(currentDate.getHours(), currentDate.getMinutes());
        let currStartTime = getDailyStartTime(project);
        if (firstIteration) {
            const currDateTimeWindow = new dataObjects.Time(currentDate.getHours(), currentDate.getMinutes());

            if (isLaterTime(currDateTimeWindow, currStartTime)) {
                currStartTime = cloneTime(currDateTimeWindow);
            }
        }

        // const finalEndTime = new dataObjects.Time(23, 59);
        const finalEndTime = getDailyEndTime(project);


        while (isLaterTime(finalEndTime, currStartTime) && estimatedTimeLeft > 0 && !isAtMaxEventsPerDay(maxEventsPerDay, eventsSoFarInDay)) {
            const sessionLengthToFind = getSessionLengthFromEstimatedTimeLeft(sessionLengthMinutes, estimatedTimeLeft);
            let endTime = addMinutesToTime(currStartTime, sessionLengthToFind, false);

            if (isLaterTime(endTime, finalEndTime)) {
                currStartTime = cloneTime(endTime);
                continue;
            }

            let timeWindow = new dataObjects.TimeWindow(currStartTime, endTime);
            const tempStartDate = new Date(currentDate);
            const tempEndDate = new Date(currentDate);
            tempStartDate.setHours(currStartTime.hour);
            tempStartDate.setMinutes(currStartTime.minute);
            tempStartDate.setSeconds(0);
            tempStartDate.setMilliseconds(0);
            tempEndDate.setHours(endTime.hour);
            tempEndDate.setMinutes(endTime.minute);
            tempEndDate.setSeconds(0);
            tempEndDate.setMilliseconds(0);
            const tempEvent = { start: tempStartDate, end: tempEndDate }
            let allOverlappingEvents = getAllOverlappingEvents(tempEvent, allCurrDayEvents);

            // In the future we can consider specific events and perhaps see if we are allowed to ignore them.
            // For now if there is an overlap at all our algorithm moves on
            if (allOverlappingEvents.length > 0) {
                // TODO: change this to Reduce for some functional programming practice
                let latestEvent = findLatestEvent(allOverlappingEvents);

                /**
                 * If it's an overnight event into the following day, we can't just set currStartTime to the end time of the event.
                 * It could cause an endless loop if the end hour of the event is earlier than the start (say, start Monday 18:00 and end Tuesday 15:00).
                 * Therefore if the event ends the next day, we set currStartTime to the end of the day.
                 */

                let [latestEventStart, latestEventEnd] = utils.getEventDates(latestEvent);
                if (latestEventEnd.getDay() > latestEventStart.getDay()) {
                    currStartTime = cloneTime(finalEndTime);
                } else {
                    let latestEventEndTime = getTimeWindowFromEvent(latestEvent).endTime;
                    currStartTime = cloneTime(latestEventEndTime);
                }

                continue;
            } else {
                // At this point in the code we're not dealing with overlaps.
                const closestEarlierEvent = getClosestEarlierEvent(currStartTime, allCurrDayEvents);
                if (closestEarlierEvent != null) {
                    if (!isConstraintEvent(closestEarlierEvent)) {
                        currStartTime = addMinutesToTime(currStartTime, spacingBetweenEventsMinutes, false);
                        endTime = addMinutesToTime(currStartTime, sessionLengthToFind, false);
                        timeWindow = new dataObjects.TimeWindow(currStartTime, endTime);
                        const tempStartDate = new Date(currentDate);
                        const tempEndDate = new Date(currentDate);
                        tempStartDate.setHours(currStartTime.hour);
                        tempStartDate.setMinutes(currStartTime.minute);
                        tempStartDate.setSeconds(0);
                        tempStartDate.setMilliseconds(0);
                        tempEndDate.setHours(endTime.hour);
                        tempEndDate.setMinutes(endTime.minute);
                        tempEndDate.setSeconds(0);
                        tempEndDate.setMilliseconds(0);
                        const tempEvent = { start: tempStartDate, end: tempEndDate }

                        // Check again for overlapping events after adding minutes
                        allOverlappingEvents = getAllOverlappingEvents(tempEvent, allCurrDayEvents);
                        if (allOverlappingEvents.length > 0) {
                            latestEvent = findLatestEvent(allOverlappingEvents);
                            latestEventEndTime = getTimeWindowFromEvent(latestEvent).endTime;
                            currStartTime = cloneTime(latestEventEndTime);

                            continue;
                        }
                    }
                }

                const closestLaterEvent = getClosestLaterEvent(currStartTime, allCurrDayEvents);

                if (closestLaterEvent != null) {
                    if (!isConstraintEvent(closestLaterEvent)) {
                        // Check if time between curr time window and event start time is <= spacing between events
                        endTime = addMinutesToTime(currStartTime, sessionLengthToFind, false);
                        timeWindow = new dataObjects.TimeWindow(currStartTime, endTime);

                        let closestLaterEventStartTime = getTimeWindowFromEvent(closestLaterEvent).startTime;
                        let minutesGap = getMinutesBetweenTimes(endTime, closestLaterEventStartTime);

                        if (minutesGap < spacingBetweenEventsMinutes) {
                            latestEventEndTime = getTimeWindowFromEvent(closestLaterEvent).endTime;
                            currStartTime = cloneTime(latestEventEndTime);

                            continue;
                        }
                    }
                }

                // Create event
                let event = await createEventFromStartTime(project, sessionLengthToFind, currStartTime, currentDate);
                allEventsGeneratedBySchedule.push(event);
                allCurrDayEvents.push(event);
                estimatedTimeLeft = updateTimeEstimate(estimatedTimeLeft, sessionLengthToFind);
                eventsSoFarInDay++;
            }
        }

        currentDate = getNextDate(project, currentDate, eventsSoFarInDay);
        timeLeft = estimatedTimeLeft;
        firstIteration = false;
    }

    console.log(`[generateSchedule] Finished generating schedule. Events created: ${allEventsGeneratedBySchedule.length}. Estimated time left: ${timeLeft}`);

    return [allEventsGeneratedBySchedule, timeLeft];
}

const getAllEvents = async (project) => {
    let events = []

    for (const email of project.participatingEmails) {
        let userEvents = await utils.getAllUserEvents(email);
        events = events.concat(userEvents);
    }

    return events;
}

function isConstraintEvent(event) {
    if (!event) {
        return false;
    }

    if (!event.extendedProps) {
        return false;
    }

    if (!event.extendedProps.isConstraint) {
        return false;
    }

    return event.extendedProps.isConstraint;
}

/**
 * This function returns an array of all the events that overlap with the given time window.
 * An overlap can occur if: 
 *  -   An event's end is after the time window's start and before its end.
 *  -   An event's start is after the time window's start and before its end.
 * @param {*} event1 
 * @param {*} allCurrDayEvents 
 */
function getAllOverlappingEvents(event1, allCurrDayEvents) {
    let allOverlappingEvents = [];

    for (const event of allCurrDayEvents) {
        // const event = getTimeWindowFromEvent(event);

        if (isOverlap(event1, event)) {
            allOverlappingEvents.push(event);
        }
    }

    return allOverlappingEvents;
}

function findLatestEvent(events) {
    if (!events || events.length == 0) {
        return null;
    }

    let latestEvent = events[0];

    for (const event of events) {
        const latestEventTime = getTimeWindowFromEvent(latestEvent);
        const currEventTimeWindow = getTimeWindowFromEvent(event);

        if (isLaterTime(currEventTimeWindow.endTime, latestEventTime.endTime)) {
            latestEvent = event;
        }
    }

    return latestEvent;
}

function getTimeWindowFromEvent(event) {
    const eventStartDate = utils.getEventStart(event);
    const startHour = eventStartDate.getHours();
    const startMin = eventStartDate.getMinutes();
    const startTime = new dataobjects.Time(startHour, startMin);

    const eventEndDate = utils.getEventEnd(event);
    const endHour = eventEndDate.getHours();
    const endMin = eventEndDate.getMinutes();
    const endTime = new dataobjects.Time(endHour, endMin);

    const timeWindow = new dataobjects.TimeWindow(startTime, endTime);

    return timeWindow;
}

/**
 * This function returns a new time object, based on the given time, after adding the minutes to add to it.
 * 
 * @param {*} time 
 * @param {*} minutesToAdd 
 * @param {*} resetPastMidnight determines whether the new time object should be reset at midnight. 
 * For example, if the time given is 23:50, and minutes to add is 60, 
 * if reset is set to true then the returned time will be 00:50.
 * Otherwise the returned time will be 24:50
 */
function addMinutesToTime(time, minutesToAdd, resetPastMidnight) {
    let newTime = cloneTime(time);
    let addedMinutes = time.minute + Number(minutesToAdd);

    newTime.minute = addedMinutes % 60;
    newTime.hour = time.hour + Math.floor(addedMinutes / 60);

    if (resetPastMidnight == true) {
        newTime.hour = newTime.hour % 24;
    }

    return newTime;
}

/**
 * This function finds the closest event that ENDS no later than the given start time.
 * If there is no such event, the function returns null;
 * @param {*} startTime 
 * @param {*} allCurrDayEvents 
 * @returns 
 */
function getClosestEarlierEvent(startTime, allCurrDayEvents) {
    let closestEarlierEvent = null;

    if (allCurrDayEvents.length > 0) {
        for (const currEvent of allCurrDayEvents) {
            const currEventEndTime = getTimeWindowFromEvent(currEvent).endTime;

            if (isLaterOrEqualTime(startTime, currEventEndTime)) {
                if (closestEarlierEvent === null) {
                    closestEarlierEvent = currEvent;
                } else {
                    const currClosestEndTime = getTimeWindowFromEvent(closestEarlierEvent).endTime;

                    if (isLaterTime(currEventEndTime, currClosestEndTime)) {
                        closestEarlierEvent = currEvent;
                    }
                }
            }
        }
    }

    return closestEarlierEvent;
}

/**
 * This function finds the closest event that starts no sooner than the given end time.
 * If there is no such event, the function returns null;
 * @param {*} endTime 
 * @param {*} allCurrDayEvents 
 * @returns 
 */
function getClosestLaterEvent(endTime, allCurrDayEvents) {
    let closestLaterEvent = null;

    if (allCurrDayEvents.length > 0) {
        for (const currEvent of allCurrDayEvents) {
            const currEventStartTime = getTimeWindowFromEvent(currEvent).startTime;

            if (isLaterOrEqualTime(currEventStartTime, endTime)) {
                if (closestLaterEvent == null) {
                    closestLaterEvent = currEvent;
                }

                const currClosestStartTime = getTimeWindowFromEvent(closestLaterEvent).startTime;

                if (isLaterTime(currClosestStartTime, currEventStartTime)) {
                    closestLaterEvent = currEvent;
                }
            }
        }
    }

    return closestLaterEvent;
}

/**
 * This function receives two time objects and returns the amount of minutes separating them.
 * It assumes time1 is earlier than time2.
 * @param {*} time1 
 * @param {*} time2 
 */
function getMinutesBetweenTimes(time1, time2) {
    let fullHours;

    fullHours = time2.hour - time1.hour - 1;

    let minutesBetween = (60 - time1.minute) + time2.minute + (fullHours * 60);

    return minutesBetween;
}

const filterEvents = (allEvents, startDateOriginal, endDate) => {
    /**
     * We reset the hours, minutes and seconds of the start date because if the start date is in the middle of a day,
     * and that day already has project events in it,
     * we want to take note of those project events.
     * More generally we want to take note of any events in the day.
     * For example, if the day has an event at 12:00-13:00, and the start date is 12:30, the 12:00-13:00 event will get filtered.
     * TODO: if a person has a night shift starting the day before the start date, this still clashes and requires attention.
     */
    let startDate = resetDateFields(startDateOriginal, true, true, true, true);

    let eventsWithinDates = allEvents.filter(event => {
        let [eventStartDate, eventEndDate] = utils.getEventDates(event);

        if (!eventStartDate || !eventEndDate) {
            return false;
        }

        return (eventEndDate >= startDate
            && eventStartDate <= endDate);
    })

    return eventsWithinDates;
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

const isNoOverlap = (event1, event2) => {
    /**
     * Throughout this function you'll see that we create new dates, despite already having the dates in the arguments.
     * The reason is that sometimes the arguments could be JSON, and thus their "dates" are still in string format.
     * So we make sure we work with actual string objects.
     */
    let earlierEvent = null;
    let laterEvent = null;

    let [event1Start, event1End] = utils.getEventDates(event1);
    let [event2Start, event2End] = utils.getEventDates(event2);

    event1Start = resetDateFields(event1Start, false, false, true, true);
    event1End = resetDateFields(event1End, false, false, true, true);

    event2Start = resetDateFields(event2Start, false, false, true, true);
    event2End = resetDateFields(event2End, false, false, true, true);

    // if (isEarlierStartTimeTime(timeWindow1, timeWindow2)) {
    //     earlierTime = timeWindow1;
    //     laterTime = timeWindow2;
    // } else {
    //     earlierTime = timeWindow2;
    //     laterTime = timeWindow1;
    // }
    if (event1Start <= event2Start) {
        earlierEvent = event1;
        laterEvent = event2;
    } else {
        earlierEvent = event2;
        laterEvent = event1;
    }

    if (doesEvent1ContainEvent2(earlierEvent, laterEvent)) {
        return false;
    }

    let [earlierEventStart, earlierEventEnd] = utils.getEventDates(earlierEvent);
    let [laterEventStart, laterEventEnd] = utils.getEventDates(laterEvent);

    // Reset seconds and milliseconds
    earlierEventStart = resetDateFields(earlierEventStart, false, false, true, true);
    earlierEventEnd = resetDateFields(earlierEventEnd, false, false, true, true);
    laterEventStart = resetDateFields(laterEventStart, false, false, true, true);
    laterEventEnd = resetDateFields(laterEventEnd, false, false, true, true);
    if (earlierEventEnd <= laterEventStart) {
        return true;
    } else {
        return false;
    }
}

const isOverlap = (event1, event2) => {
    return !isNoOverlap(event1, event2);
}

function cloneTime(time) {
    if (!time) {
        return null;
    }

    const cloneHour = time.hour;
    const cloneMinute = time.minute;
    const cloneTime = new dataObjects.Time(cloneHour, cloneMinute);

    return cloneTime;
}

const doesEvent1ContainEvent2 = (event1, event2) => {
    let doesContain = false;

    /*
    Create new date objects in case one of the events holds its date as a string, and not an actual date object.
     */
    let [event1Start, event1End] = utils.getEventDates(event1);
    let [event2Start, event2End] = utils.getEventDates(event2);
    event1Start = resetDateFields(event1Start, false, false, true, true);
    event1End = resetDateFields(event1End, false, false, true, true);
    event2Start = resetDateFields(event2Start, false, false, true, true);
    event2End = resetDateFields(event2End, false, false, true, true);

    if (event1Start <= event2Start) {
        if (event1End >= event2End) {
            doesContain = true;
        }
    }

    return doesContain;
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

/**
 * Returns TRUE if time1 starts later or at the same time of time2.
 * @param {*} time1 
 * @param {*} time2 
 * @returns 
 */
const isLaterOrEqualTime = (time1, time2) => {
    let isLaterOrEqual = false;

    isLaterOrEqual = (time1.hour > time2.hour) || (time1.hour == time2.hour && time1.minute >= time2.minute);

    return isLaterOrEqual;
}

function getNextDate(project, currentDate, eventsSoFarInDay) {
    let nextDate = null;
    /*
        If no time was found in current day to place a single event, 
        there's no point skipping ahead with how the day spacing the user wanted.
        It could create unwanted situations where events could occur much farther apart than intended.
        To avoid that we advance by just one day when no time was found. 
    */
    // TODO: add a way to determine if user wants to skip every X days or perform specific days
    // let dayRepetitionFrequency = Number(project.dayRepetitionFrequency);
    // let daysToAdvanceBy = (eventsSoFarInDay > 0 ? dayRepetitionFrequency : 1);
    // nextDate = addDays(currentDate, daysToAdvanceBy, true);

    let currDay = currentDate.getDay();
    let daysOfWeek = project.daysOfWeek;
    daysOfWeek.sort((day1, day2) => { return (Number(day1) - Number(day2)) }); // Sort ascending
    currDayIndex = daysOfWeek.findIndex(day => Number(day) === currDay);
    let nextDayIndex = null;
    if (currDayIndex >= 0) {
        nextDayIndex = currDayIndex + 1;
        if (nextDayIndex === daysOfWeek.length) {
            nextDayIndex = 0;
        }
    } else {
        //  This could happen at the start of the algorithm, if the project's start date (e.g. a Monday) is not on the specified days for the project.
        if (currDay === 6) {
            nextDayIndex = daysOfWeek[0];
        } else {
            for (let [index, day] of daysOfWeek.entries()) {
                if (day < currDay) {
                    continue;
                } else {
                    nextDayIndex = index;
                    break;
                }
            }
        }
    }

    let nextDay = Number(daysOfWeek[nextDayIndex]);
    let daysToAdd = null;
    if (currDay < nextDay) {
        daysToAdd = nextDay - currDay;
    } else {
        daysToAdd = (6 - currDay) + nextDay + 1;
    }
    nextDate = addDays(currentDate, daysToAdd, true);

    return nextDate;
}

const addDays = (originalDate, days, resetToMidnightFlag) => {
    const cloneDate = new Date(originalDate.valueOf());
    cloneDate.setDate(cloneDate.getDate() + days);

    if (resetToMidnightFlag) {
        cloneDate.setHours(00, 00, 00, 0);
    }

    return cloneDate;
}

/**
 * 
 * @param {Date} date 
 * @param {Boolean} resetHours 
 * @param {Boolean} resetMinutes 
 * @param {Boolean} resetSeconds 
 * @param {Boolean} resetMilliseconds 
 * @returns a new date object with the stated fields reset to 0. The other fields are left untouched.
 */
const resetDateFields = (date, resetHours, resetMinutes, resetSeconds, resetMilliseconds) => {
    if (!date) {
        return null;
    }

    let newDate = new Date(date.valueOf());

    if (resetHours) {
        newDate.setHours(0);
    }

    if (resetMinutes) {
        newDate.setMinutes(0);
    }

    if (resetSeconds) {
        newDate.setSeconds(0);
    }

    if (resetMilliseconds) {
        newDate.setMilliseconds(0);
    }

    return newDate;
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

const createEventFromStartTime = async (project, sessionLengthMinutes, startTime, currentDate) => {
    const userEmail = project.email;
    const projectTitle = project.title;
    const startHour = startTime.hour;
    const startMinute = startTime.minute;
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
    const eventID = utils.generateId();
    const sharedId = project.sharedId ? utils.generateId() : null;

    const event = {
        title: projectTitle,
        id: eventID,
        sharedId: sharedId,
        projectTitle: projectTitle,
        projectId: project.id,
        start: startDate,
        end: endDate,
        backgroundColor: project.backgroundColor,
        unexportedEvent: true,
        email: userEmail,
    }

    return event;
}

/**
 * This function returns all the constraints relevant to a given date.
 * Relevant constraints are either those which are general constraints for the relevant day 
 * (e.g. all Tuesday constraints, if currentDate is a Tuesday)
 * or all constraints relevant to the specific date alone
 * This function also needs to receive an object of all constraints 
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

const getAllCurrDayEvents = (currentDate, allEvents) => {
    let allCurrDayEvents = [];
    const currDateWithoutTime = new Date(currentDate).setHours(0, 0, 0, 0);
    allEvents.forEach((event) => {
        let eventDateStartWithoutTime = utils.getEventStart(event).setHours(0, 0, 0, 0);
        if (eventDateStartWithoutTime.valueOf() === currDateWithoutTime.valueOf()) {
            allCurrDayEvents.push(event);
        }
    })

    return allCurrDayEvents;
}

/**
 * 
 * @param {*} allCurrDayConstraints 
 * @param {*} currentDate 
 * @param {*} project The project object holds all the contstraint IDs to ignore. Such constraint will not be returned from this function.
 * @returns 
 */
function changeConstraintsToEvents(allCurrDayConstraints, currentDate, project) {
    let allConstraintsAsEvents = []

    for (const constraint of allCurrDayConstraints) {
        if (isIgnoredConstraint(constraint, project)) {
            continue;
        }
        const constraintStartTimeStr = constraint.startTime;
        const constraintStartTimeStrSplit = constraintStartTimeStr.split(":");
        const constraintStartHour = Number(constraintStartTimeStrSplit[0])
        const constraintStartMinute = Number(constraintStartTimeStrSplit[1]);
        let currDateStart = new Date(currentDate);

        currDateStart.setHours(constraintStartHour);
        currDateStart.setMinutes(constraintStartMinute);

        const constraintEndTimeStr = constraint.endTime;
        const constraintEndTimeStrSplit = constraintEndTimeStr.split(":");
        const constraintEndHour = Number(constraintEndTimeStrSplit[0])
        const constraintEndMinute = Number(constraintEndTimeStrSplit[1]);
        let currDateEnd = new Date(currentDate);
        currDateEnd.setHours(constraintEndHour);
        currDateEnd.setMinutes(constraintEndMinute);

        const title = constraint.title;

        const newEvent = {
            title: title,
            start: currDateStart,
            end: currDateEnd,

            extendedProps: {
                isConstraint: true,
            }
        }

        allConstraintsAsEvents.push(newEvent);
    }

    return allConstraintsAsEvents;
}

function isIgnoredConstraint(constraint, project) {
    let ignoreId = false;

    for (const ignoredConstraintId of project.ignoredConstraintsIds) {
        if (ignoredConstraintId == constraint.id) {
            ignoreId = true;
            break;
        }
    }

    return ignoreId;
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

function getStartDate(project) {
    let startDate = new Date(project.start);
    startDate = getNextDate(project, startDate, 0);

    return startDate;
}

const isCurrDatePastEndDate = (currentDate, endDate) => {
    return new Date(currentDate) > new Date(endDate);
}

const getDailyStartTime = (project) => {
    const dailyStartTime = new dataObjects.Time(0, 0);
    const projectDailyStartTime = new Date(project.dailyStartHour);
    dailyStartTime.hour = projectDailyStartTime.getHours();
    dailyStartTime.minute = projectDailyStartTime.getMinutes();

    return dailyStartTime;
}

const getDailyEndTime = (project) => {
    // const finalEndTime = new dataObjects.Time(23, 59);
    const dailyEndTime = new dataObjects.Time(23, 59);
    const projectDailyEndTime = new Date(project.dailyEndHour);
    dailyEndTime.hour = projectDailyEndTime.getHours();
    dailyEndTime.minute = projectDailyEndTime.getMinutes();

    return dailyEndTime;
}

const isAtMaxEventsPerDay = (maxEventsPerDay, eventsSoFarInDay) => {
    if (!maxEventsPerDay || maxEventsPerDay == -1) {
        return false;
    } else {
        return (maxEventsPerDay == eventsSoFarInDay);
    }
}

const getAllConstraints = async (project) => {
    let allConstraints = [];

    for (const email of project.participatingEmails) {
        const userConstraints = await DayConstraintModel.find({ 'email': email });
        allConstraints = allConstraints.concat(userConstraints);
    }

    return allConstraints;
}

module.exports = {
    generateSchedule: generateSchedule,
    rescheduleEvent: rescheduleEvent,
}