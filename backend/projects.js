const express = require('express');
const StatusCodes = require('http-status-codes').StatusCodes;
const EventModel = require('./models/projectevent')
const ProjectModel = require('./models/project')

const algorithm = require('./algorithm');
const utils = require('./utils');
const router = express.Router();

// Routing
router.get('/', (req, res) => { getProjects(req, res) });
router.get('/events', (req, res) => { getProjectEvents(req, res) });
router.post('/', (req, res) => { createProject(req, res) });

// Functions
const getProjects = async (req, res) => {
        const userEmail = await utils.getEmailFromReq(req);
        const allProjects = await ProjectModel.find({ 'email': userEmail });
        res.status(StatusCodes.OK).send(allProjects);
}

const getProjectEvents = async (req, res) => {
        const userEmail = await utils.getEmailFromReq(req);
        const allProjectEvents = await EventModel.find({ 'email': userEmail });
        res.status(StatusCodes.OK).send(allProjectEvents);
}

const createProject = async (req, res) => {
        try {
                let inputErrorMsg = checkInputValidity(req);
                if (inputErrorMsg != null) {
                        res.status(StatusCodes.BAD_REQUEST).send(inputErrorMsg);
                        return;
                }

                const project = await createNewProject(req);
                const [events, estimatedTimeLeft] = await algorithm.generateSchedule(req, project);
                let errorMsg = null;

                const docsEvents = await EventModel.insertMany(events, (err) => {
                        if (err != null) {
                                console.error(err);
                                errorMsg = err;
                        }
                });

                const docsProject = await ProjectModel.create(project, (err, b) => {
                        if (err != null) {
                                console.error(err);
                                errorMsg = err;
                        }
                });

                resBody = {
                        estimatedTimeLeft: estimatedTimeLeft,
                };

                if (errorMsg === null) {
                        res.status(StatusCodes.OK).send(resBody);
                } else {
                        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Database error: " + errorMsg);
                }
        } catch (err) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Unknown server error');
        }
}

/**
 * 
 * @param {*} req the user's request with the input parameters.
 * @returns the error message based on the faulty input parameters. Null if there are no errors.
 */
function checkInputValidity(req) {
        let errorMsg = "";

        if (!req.body.projectName || req.body.projectName.length === 0) {
                errorMsg += "   - Must enter project name.\n";
        }

        if (!isPositiveInteger(req.body.estimatedTime)) {
                errorMsg += "   - Estimated time for project must be a positive integer.\n";
        }

        if (!isPositiveInteger(req.body.sessionLengthMinutes)) {
                errorMsg += "   - Session length must be a positive integer.\n";
        }

        if (!isPositiveInteger(req.body.spacingLengthMinutes)) {
                errorMsg += "   - Break between sessions must be a positive integer.\n";
        }

        if (req.body.maxEventsPerDay !== null && req.body.maxEventsPerDay !== undefined) {
                if (!isPositiveInteger(req.body.maxEventsPerDay)) {
                        errorMsg += "   - Max sessions per day must be a positive integer, or left blank for unlimited (as much as possible).\n";
                }
        }

        if (!isPositiveInteger(req.body.dayRepetitionFrequency)) {
                errorMsg += "   - Day repetition frequency must be a positive integer.\n";
        }

        const currDate = new Date();

        if (req.body.endDate <= req.body.startDate) {
                errorMsg += "   - End date must be later than start date.\n";
        }

        if (req.body.endDate <= currDate) {
                errorMsg += "   - End date must be later than current date.\n";
        }

        if (errorMsg.length === 0) {
                errorMsg = null;
        }

        return errorMsg;
}

function isPositiveInteger(input) {
        const num = Number(input);

        if (Number.isInteger(num) && num > 0) {
                return true;
        }

        return false;
}

const createNewProject = async (req) => {
        const projectID = utils.generateId();
        const userEmail = await utils.getEmailFromReq(req);
        const backgroundColor = getRandomColor();

        const newProject = {
                title: req.body.projectName,
                id: projectID,
                eventsID: [],
                timeEstimate: req.body.estimatedTime,
                start: req.body.startDate,
                end: req.body.endDate,
                sessionLengthMinutes: req.body.sessionLengthMinutes,
                spacingLengthMinutes: req.body.spacingLengthMinutes,
                backgroundColor: backgroundColor,
                email: userEmail,
        }

        return newProject;
}

const getRandomColor = () => {
        let randomColor = Math.floor(Math.random() * 16777215).toString(16);
        randomColor = "#" + randomColor;

        return randomColor;
}

module.exports = router;