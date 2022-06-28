const express = require('express');
const StatusCodes = require('http-status-codes').StatusCodes;

const ConstraintEventModel = require('./models/constraintevent')
const dataObjects = require('./dataobjects');
const { DayConstraint } = require('./dataobjects');


const router = express.Router();

// Routing
router.post('/', (req, res) => { addConstraint(req, res) });
router.get('/', (req, res) => { getConstraints(req, res) });


// Functions
const getConstraints = async (req, res) => {
    const allConstraints = await ConstraintEventModel.find({});
    res.status(StatusCodes.OK).send(allConstraints);
}

/*
TODO:
    -   Add user ID
*/
const addConstraint = async (req, res) => {
    /* Parse from the request the following parameters:
        -   Day
        -   Start Hour
        -   End Hour

        -   Call database to fetch the user ID based on access token // TODO:

    Create this object and add a user ID to it

    Save in database
    */

    // TODO: loop for each day in the request
    const days = req.body.days;
    let errorMsg = null;
    try {
        // const day = getDayFromRequest(req); // TODO: delete? old

        /* TODO: delete? old code before we used simple Date object for the start and end
        const forbiddenHourStart = getStartHourFromRequest(req);
        const forbiddenMinuteStart = getStartMinuteFromRequest(req);
        const forbiddenHourEnd = getEndHourFromRequest(req);
        const forbiddenMinuteEnd = getEndMinuteFromRequest(req);
*/

        let forbiddenStartDate = req.body.forbiddenStartDate;
        let forbiddenEndDate = req.body.forbiddenEndDate;

        // const userAccessToken = getUserAccessTokenFromRequest(req); // TODO:
        // const userID = getUserIDFromAccessToken(userAccessToken); // TODO:


        /* TODO: delete? old code with our own data object
        // Create Constraint object
        const dayConstraint = new dataObjects.DayConstraint(day);
        const forbiddenStartTime = new dataObjects.Time(forbiddenHourStart, forbiddenMinuteStart);
        const forbiddenEndTime = new dataObjects.Time(forbiddenHourEnd, forbiddenMinuteEnd)
        const forbiddenTimeWindow = new dataObjects.TimeWindow(forbiddenStartTime, forbiddenEndTime);

        dayConstraint.forbiddenTimeWindows.push(forbiddenTimeWindow);
        */


        const forbiddenStartDurationDeleteLater = '12:00'; // TODO: this is just atest, delete later
        const forbiddenEndDurationDeleteLater = '13:00';


        // Create constraint event
        // TODO: add title
        const startRecur = new Date(); // TODO: add option for user to set start date?
        const endRecur = null; // TODO: add option for user to set end date?
        const constraintEvent = {
            daysOfWeek: days,
            startTime: forbiddenStartDurationDeleteLater,
            endTime: forbiddenEndDurationDeleteLater,
            startRecur: startRecur,
            endRecur: endRecur,
        }

        // TODO: push to Database
        // const docs = await DayConstraintModel.create(dayConstraint, (a, b) => {});
        const docs = await ConstraintEventModel.create(constraintEvent, (a, b) => { });

    } catch (err) {
        errorMsg = err;
    }

    if (errorMsg == null) {
        console.log("Added day constraints");
        res.status(StatusCodes.OK).send('Constraint added');
    } else {
        console.log("ERROR: Failed to add day constraints");
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Unknown server error: ' + errorMsg);
    }
}

// TODO: delete? old version where day was a single value and not an array of days
const getDayFromRequest = (req) => {
    if (req === null) {
        return null;
    }

    return req.body.day;
}


const getStartHourFromRequest = (req) => {
    if (req === null) {
        return null;
    }

    return req.body.startHour;
}

const getStartMinuteFromRequest = (req) => {
    if (req === null) {
        return null;
    }

    return req.body.startMinute;
}

const getEndHourFromRequest = (req) => {
    if (req === null) {
        return null;
    }

    return req.body.endHour;
}

const getEndMinuteFromRequest = (req) => {
    if (req === null) {
        return null;
    }

    return req.body.endMinute;
}

module.exports = router;