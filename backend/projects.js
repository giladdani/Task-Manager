const express = require('express');
const StatusCodes = require('http-status-codes').StatusCodes;
const EventModel = require('./models/projectevent')
const ProjectModel = require('./models/project')


const algorithm = require('./algorithm');
const utils = require('./utils');
const router = express.Router();

// Routing
router.get('/', (req, res) => { getProjectEvents(req, res) });
router.post('/', (req, res) => { createProject(req, res) });


// Functions
const getProjectEvents = async (req, res) => {
        const userEmail = await utils.getEmailFromReq(req);
        const allProjectEvents = await EventModel.find({ 'email': userEmail });
        res.status(StatusCodes.OK).send(allProjectEvents);
}

const createProject = async (req, res) => {
        try {
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