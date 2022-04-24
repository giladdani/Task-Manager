const express = require('express');
const User = require('./models/user');

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

const generateSchedule = async(req, res) => {
    try{
        const estimatedTimeTotal = getTimeEstimate(req);    // TODO: Int or float representing hours (decide how to model it)
        let estimatedTimeLeft = estimatedTimeTotal;         // TODO: Int or float representing hours (decide how to model it)

        // TODO: check if estiamtedTime is a positive number?

        const allConstraintsArr = getAllConstraints();        // An array of all the constraints
        // Optional: Sort all constraints by days for ease of access during algorithm run

        /* Idea: ConstraintsMegaObject {
            Sunday: []
            Monday: []
            ...
            SpecificDates[]
        }
        */

        let currentDate = getTaskStartDate(req);
        let endDate = getTaskEndDate(req);
        let allEventsGeneratedBySchedule = [];

        while ( (! isCurrDatePastEndDate(currentDate, endDate)) && estimatedTimeLeft > 0) {
            const allCurrDayConstraints = getAllCurrDateConstraints(currentDate);
            const tempDayConstraint = createDayConstraintFromAllCurrDayConstraints(allCurrDayConstraints);

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

}

/**
 * This function creates a temporary object of a specific day and its constraints.
 * Meaning it receives all the relevant constraints as an array,
 * and creates from them a temporary DayConstraint object 
 * which states which hours are possible for work
 * @param {*} allCurrDayConstraints 
 */
const createDayConstraintFromAllCurrDayConstraints = (allCurrDayConstraints) => {
    // TODO: implement

    /*

    let TempDayConstraint = new DayConstraint Object

    forEach item in the array:
        Check the forbidden hours
        Add forbidden hours to the TempDayConstraint


    return TempDayConstraint
    */
}

/**
 * This function returns all the constraints relevant to a given date.
 * Relevant constraints are either those which are general constraints for the relevant day 
 * (e.g. all Tuesday constraints, if currentDate is a Tuesday)
 * or all constraints relevant to the specific date alone
 * This function also needs to receive an object of all constraints // TODO: add parameter
 * @param {*} currentDate 
 */
const getAllCurrDateConstraints = (currentDate) => {
    // TODO: implement
    // Go over all constraints
    // Find those relevant in the Day
    // Find those relevant in the specific date
    // Add them to an array
    // Send back
}


const getTaskStartDate = (request) => {
    // TODO: fetch the start day of the task
    // FIXME: quick and dirty

    return new Date();
}

const getTaskEndDate = (request) => {
    // TODO: fetch the end day of the task
    
    // FIXME: quick and dirty
    let daysToAdd = 10;
    let result = new Date();
    result.setDate(result.getDate() + daysToAdd);
    return result;
}

const isCurrDatePastEndDate = (currentDate, endDate) => {
    // TODO: implement!

    // FIXME: quick and dirty
    return false;
}

const getTimeEstimate = (request) => {
    // TODO: fetch the time estimate from the request
    // FIXME: Quick and Dirty 
    return 15;
}

const getAllConstraints = () => {
    // TODO: get all constraints
    // Need to address Database
    // Maybe this should be a more general function, not just for the algorithm?
    // The front-end for example will want to display all constraints on the constraints-page too so the server should offer this in general
}