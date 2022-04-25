const express = require('express');
const User = require('./models/user');
const DayConstraintModel = require('./models/dayconstraint')
const dataObjects = require('./dataobjects');
const dataobjects = require('./dataobjects');


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

const generateSchedule = async(req) => {
    try{
        const name = req.body.name;
        const estimatedTimeTotal = getTimeEstimate(req);    // TODO: Int or float representing hours (decide how to model it)
        let estimatedTimeLeft = estimatedTimeTotal;         // TODO: Int or float representing hours (decide how to model it)
        // TODO: check if estiamtedTime is a positive number?

        const allConstraintsArr = await getAllConstraints();        // An array of all the constraints

        const allConstraintsSpecialObj = sortAllConstraintsIntoSpecialObj(allConstraintsArr);

        let currentDate = getTaskStartDate(req);
        let endDate = getTaskEndDate(req);
        let allEventsGeneratedBySchedule = [];

        while ( (! isCurrDatePastEndDate(currentDate, endDate)) && estimatedTimeLeft > 0) {
            const allCurrDayConstraints = getAllCurrDateConstraints(currentDate, allConstraintsSpecialObj);
            const tempDayConstraint = createDayConstraintFromAllCurrDayConstraints(currentDate, allCurrDayConstraints);

            let foundAvailableHours = true;
            while (foundAvailableHours) {
                let timeWindow = findAvailableTimeWindowByConstraints(tempDayConstraint) // find available hours matching constraints, such as min\max session length 
                
                if (timeWindow === null) { // No time frame found
                    foundAvailableHours = false;
                    continue;
                } 

                // Create event from the timeWindow
                let event = createEventFromTimeWindow(timeWindow); // TODO: add as a parameter all the task details, such as name
                addEventToList(event, allEventsGeneratedBySchedule); // Add this event to list of events created for the schedule
                removeTimeWindowFromDayConstraint(timeWindow, tempDayConstraint); // Indicates that this time frame has been taken
                estimatedTimeLeft = updateTimeEstimate(estimatedTime, timeWindow);
            }

            currentDate = advanceDateByDays(currentDate, 1);
        }

        addEventsToUser(allEventsGeneratedBySchedule);
    }
    catch(error){
        console.log(error);
    }
}

/**
 * This function receives a date and advances it by the given number of days.
 * @param {*} currentDate 
 * @param {*} daysToAdd 
 */
const advanceDate = (currentDate, daysToAdd) => {
    // TODO: implement
}

/**
 * This function returns an available time frame in a given day with its constraints.
 * It requires an object of a DayConstraint, as well as the requirements for the session size.
 * Meaning: minimum session size, maximum session size // TODO: add this a parameter
 * It returns NULL if no time window that matches the requirements can be found.
 * @param {*} tempDayConstraint 
 */
const findAvailableTimeWindowByConstraints = (dayConstraint) => {
    const sessionSizeMinutes = 60; // TODO: this is just a placeholder, add session size to request

    // TODO: implement!
    /*
    -    Start with DayConstraint object where all timeframes are POSSIBLE TIME FRAMES
    -   Go over the dayConstraint parameter and for each forbiddenTimeFrame in it, "chop" the POSSIBLE TIME FRAMES in the TempPossibleDayConstraint
    */
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
    return  req.body.startDate;
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