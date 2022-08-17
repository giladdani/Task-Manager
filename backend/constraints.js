const express = require('express');
const StatusCodes = require('http-status-codes').StatusCodes;
const ConstraintEventModel = require('./models/constraint')
const dbConstraints = require('./dal/dbConstraints');
const utils = require('./utils');
const router = express.Router();

// Routing
router.post('/', (req, res) => { createConstraint(req, res) });
router.put('/:id', (req, res) => { updateConstraint(req, res) });
router.delete('/:id', (req, res) => { deleteConstraint(req, res) });
router.get('/', (req, res) => { getConstraints(req, res) });


// Functions
const getConstraints = async (req, res) => {
    try {
        const userEmail = utils.getEmailFromReq(req);
        const allConstraints = await dbConstraints.find({ 'email': userEmail });

        res.status(StatusCodes.OK).send(allConstraints);
    } catch (err) {
        console.log(`[getConstraints] Error!\n${err}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
    }
}

const createConstraint = async (req, res) => {
    let errorMsg = null;
    try {
        const constraint = await receiveConstraintFromReq(req);
        constraint.id = utils.generateId();

        // ! Delete if all works well with insert
        const docs = await dbConstraints.create(constraint);
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

const updateConstraint = async (req, res) => {
    let errorMsg = null;
    const constraintId = req.params.id;
    try {
        const constraint = await receiveConstraintFromReq(req);
        constraint.id = constraintId;

        // ! Delete if all works well with updateOne
        // // const docs = await ConstraintEventModel.updateOne({ 'id': constraintId }, constraint);
        const docs = await dbConstraints.replaceOne({ 'id': constraintId }, constraint);

    } catch (err) {
        errorMsg = err;
    }

    if (errorMsg == null) {
        console.log(`[updateConstraint] Updated constraint ${constraintId}`);
        res.status(StatusCodes.OK).send('Constraint updated');
    } else {
        console.log("[updateConstraint] ERROR: Failed to update constraint");
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Unknown server error: ' + errorMsg);
    }
}

const deleteConstraint = async (req, res) => {
    let statusCode = null;
    let resMsg = null;
    let errorMsg = null;
    const constraintId = req.params.id;
    let docs;
    try {
        docs = await dbConstraints.deleteOne({ 'id': constraintId })
    } catch (err) {
        errorMsg = err;
    }

    if (errorMsg == null) {
        if (docs.deletedCount === 0) {
            resMsg = "Error: Found no constraint matching that ID.";
            statusCode = StatusCodes.BAD_REQUEST;
        } else {
            resMsg = "Deleted constraint " + constraintId;
            statusCode = StatusCodes.OK;
        }
    } else {
        resMsg = errorMsg;
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR
    }
    
    console.log(resMsg);
    res.status(statusCode).send(resMsg);
}

const receiveConstraintFromReq = async (req) => {
    const userEmail = utils.getEmailFromReq(req);

    if (userEmail == null) {
        throw "No user logged in. User must be logged in with their Google account to add constraints.";
    }

    const days = req.body.days;


    // ! DELETE if getDurationFromDate function works well.
    // // let forbiddenStartDateStr = req.body.forbiddenStartDate;
    // // let forbiddenStartDate = new Date(forbiddenStartDateStr);
    // // let startHourStr = forbiddenStartDate.getHours().toString();
    // // startHourStr = addZeroDigitIfNeeded(startHourStr);

    // // let startMinuteStr = forbiddenStartDate.getMinutes().toString();
    // // startMinuteStr = addZeroDigitIfNeeded(startMinuteStr);
    // // const forbiddenStartDuration = `${startHourStr}:${startMinuteStr}`;


    // // let forbiddenEndDateStr = req.body.forbiddenEndDate;
    // // const forbiddenEndDate = new Date(forbiddenEndDateStr);
    // // let endHourStr = forbiddenEndDate.getHours();
    // // endHourStr = addZeroDigitIfNeeded(endHourStr);

    // // let endMinuteStr = forbiddenEndDate.getMinutes().toString();
    // // endMinuteStr = addZeroDigitIfNeeded(endMinuteStr);
    // // const forbiddenEndDuration = `${endHourStr}:${endMinuteStr}`;

    const forbiddenStartDuration = getDurationFromDate(req.body.forbiddenStartDate);
    const forbiddenEndDuration = getDurationFromDate(req.body.forbiddenEndDate);
    const title = req.body.title;

    // Create constraint event
    // // const startRecur = new Date(); // TODO: add option for user to set start date?
    const startRecur = req.body.startRecur;

    // // const endRecur = null; // TODO: add option for user to set end date?
    const endRecur = req.body.endRecur; 

    // TODO: check validity

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

    return constraintEvent;
}

const getDurationFromDate = (date) => {
    let d = new Date(date); // In case the argument is in form of a string.
    let hours = d.getHours().toString();
    hours = addZeroDigitIfNeeded(hours);

    let minutes = d.getMinutes().toString();
    minutes = addZeroDigitIfNeeded(minutes);
    const duration = `${hours}:${minutes}`;

    return duration;
}


const addZeroDigitIfNeeded = (numberStr) => {
    if (numberStr.length == "1") {
        numberStr = "0" + numberStr;
    }

    return numberStr;
}

module.exports = router;