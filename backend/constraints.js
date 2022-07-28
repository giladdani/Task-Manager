const express = require('express');
const StatusCodes = require('http-status-codes').StatusCodes;

const ConstraintEventModel = require('./models/constraintevent')
const dataObjects = require('./dataobjects');
const { DayConstraint } = require('./dataobjects');

const utils = require('./utils');
const router = express.Router();

// Routing
router.post('/', (req, res) => { addConstraint(req, res) });
router.put('/:id', (req, res) => { updateConstraint(req, res) });
router.delete('/:id', (req, res) => { deleteConstraint(req, res) });

router.get('/', (req, res) => { getConstraints(req, res) });


// Functions
const getConstraints = async (req, res) => {
    const userEmail = await utils.getEmailFromReq(req);
    const allConstraints = await ConstraintEventModel.find({ 'email': userEmail });
    res.status(StatusCodes.OK).send(allConstraints);
}

const addConstraint = async (req, res) => {
    let errorMsg = null;
    try {
        const constraint = await receiveConstraintFromReq(req);
        constraint.id = utils.generateId();

        const docs = await ConstraintEventModel.create(constraint, (a, b) => { });

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

        const docs = await ConstraintEventModel.updateOne({'id': constraintId}, constraint);
    } catch (err) {
        errorMsg = err;
    }

    if (errorMsg == null) {
        console.log(`Updated constraint ${constraintId}`);
        res.status(StatusCodes.OK).send('Constraint updated');
    } else {
        console.log("ERROR: Failed to update constraint");
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Unknown server error: ' + errorMsg);
    }
}

const deleteConstraint = async (req, res) => {
    let errorMsg = null;
    const constraintId = req.params.id;
    try {
        const docs = await ConstraintEventModel.deleteOne({ 'id': constraintId })
    } catch (err) {
        errorMsg = err;
    }

    if (errorMsg == null) {
        console.log("Deleted constraint " + constraintId);
        res.status(StatusCodes.OK).send('Constraint deleted');
    } else {
        console.log("ERROR: Failed to delete constraint " + constraintId);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Unknown server error: ' + errorMsg);
    }
}

const receiveConstraintFromReq = async (req) => {
    const userEmail = await utils.getEmailFromReq(req);

    if (userEmail == null) {
        throw "No user logged in. User must be logged in with their Google account to add constraints.";
    }

    const days = req.body.days;

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

    return constraintEvent;
}


const addZeroDigitIfNeeded = (numberStr) => {
    if (numberStr.length == "1") {
        numberStr = "0" + numberStr;
    }

    return numberStr;
}

module.exports = router;