const express = require('express');
const StatusCodes = require('http-status-codes').StatusCodes;

const dataObjects = require('./dataobjects');
const DayConstraintModel = require('./models/dayconstraint')
const { DayConstraint } = require('./dataobjects');


const router = express.Router();

// Routing
router.post('/', (req, res) => { addConstraint(req, res) });


// Functions


/*
TODO:
    -   Add user ID
*/
const addConstraint = async(req, res) => {
    /* Parse from the request the following parameters:
        -   Day
        -   Start Hour
        -   End Hour

        -   Call database to fetch the user ID based on access token // TODO:

    Create this object and add a user ID to it

    Save in database
    */

    try {
        const day = getDayFromRequest(req);
        const forbiddenHourStart = getStartHourFromRequest(req);
        const forbiddenMinuteStart = getStartMinuteFromRequest(req);
        const forbiddenHourEnd = getEndHourFromRequest(req);
        const forbiddenMinuteEnd = getEndMinuteFromRequest(req);
        // const userAccessToken = getUserAccessTokenFromRequest(req); // TODO:
        // const userID = getUserIDFromAccessToken(userAccessToken); // TODO:


        // Create Constraint object
        const dayConstraint = new dataObjects.DayConstraint(day);
        const forbiddenStartTime = new dataObjects.Time(forbiddenHourStart, forbiddenMinuteStart);
        const forbiddenEndTime = new dataObjects.Time(forbiddenHourEnd, forbiddenMinuteEnd)
        const forbiddenTimeWindow = new dataObjects.TimeWindow(forbiddenStartTime, forbiddenEndTime);

        dayConstraint.forbiddenTimeWindows.push(forbiddenTimeWindow);

        // TODO: push to Database
        // const docs = await DayConstraintModel.create(dayConstraint, (a, b) => {});
        const docs = await DayConstraintModel.DayConstraint.create(dayConstraint, (a, b) => {});

        // Send OK
        res.status(StatusCodes.OK).send('Constraint added');
	} catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Unknown server error');
	}
}

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