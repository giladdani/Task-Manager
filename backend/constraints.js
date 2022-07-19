const express = require('express');
const StatusCodes = require('http-status-codes').StatusCodes;

const ConstraintEventModel = require('./models/constraintevent')
const dataObjects = require('./dataobjects');
const { DayConstraint } = require('./dataobjects');

const utils = require('./utils');
const router = express.Router();

// Routing
router.post('/', (req, res) => { addConstraint(req, res) });
router.get('/', (req, res) => { getConstraints(req, res) });


// Functions
const getConstraints = async (req, res) => {
    const userEmail = await utils.getEmailFromReq(req);
    const allConstraints = await ConstraintEventModel.find({ 'email': userEmail });
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

        const userEmail = await utils.getEmailFromReq(req);

        if (userEmail == null) {
            throw "No user logged in. User must be logged in with their Google account to add constraints.";
        }

        // const day = getDayFromRequest(req); // TODO: delete? old

        /* TODO: delete? old code before we used simple Date object for the start and end
        const forbiddenHourStart = getStartHourFromRequest(req);
        const forbiddenMinuteStart = getStartMinuteFromRequest(req);
        const forbiddenHourEnd = getEndHourFromRequest(req);
        const forbiddenMinuteEnd = getEndMinuteFromRequest(req);
*/



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

        let forbiddenStartDateStr = req.body.forbiddenStartDate;
        let forbiddenStartDate = new Date(forbiddenStartDateStr);
        let startHourStr = forbiddenStartDate.getHours().toString();
        startHourStr = addZeroDigitIfNeeded(startHourStr);

        let startMinuteStr = forbiddenStartDate.getMinutes().toString();
        startMinuteStr = addZeroDigitIfNeeded(startMinuteStr);
        const forbiddenStartDuration = `${startHourStr}:${startMinuteStr}`;
        
        let forbiddenEndDateStr = req.body.forbiddenEndDate;
        const forbiddenEndDate = new Date(forbiddenEndDateStr);
        let endHourStr = forbiddenEndDate.getHours();
        endHourStr = addZeroDigitIfNeeded(endHourStr);

        let endMinuteStr = forbiddenEndDate.getMinutes().toString();
        endMinuteStr = addZeroDigitIfNeeded(endMinuteStr);

        const forbiddenEndDuration = `${endHourStr}:${endMinuteStr}`;

        const title = req.body.title;

        // Create constraint event
        // TODO: add title
        const startRecur = new Date(); // TODO: add option for user to set start date?
        const endRecur = null; // TODO: add option for user to set end date?
        const constraintEvent = {
            daysOfWeek: days,
            startTime: forbiddenStartDuration,
            endTime: forbiddenEndDuration,
            startRecur: startRecur,
            endRecur: endRecur,
            display: "none",
            isConstraint: true,
            backgroundColor: "black",
            title: title,
            email: userEmail,
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

const addZeroDigitIfNeeded = (numberStr) => {
    if (numberStr.length == "1") {
        numberStr = "0" + numberStr;
    }

    return numberStr;
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