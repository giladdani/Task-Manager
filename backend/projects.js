const express = require('express');
const StatusCodes = require('http-status-codes').StatusCodes;
const EventModel = require('./models/projectevent')

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
                const project = createNewProject(req);

                const events = await algorithm.generateSchedule(req, project);
                let errorMsg = null;

                const docs = await EventModel.insertMany(events, (err) => {
                        if (err != null) {
                                console.error(err);
                                errorMsg = err;
                        }
                });
                // addEventsToDB(allEventsGeneratedBySchedule); // TODO:

                if (errorMsg === null) {
                        res.status(StatusCodes.OK).send();
                } else {
                        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Database error: " + errorMsg);
                }
        } catch (err) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Unknown server error');
        }
}

const createNewProject = (req) => {
        const projectID = "666"; // TODO: get project ID
        const userEmail = utils.getEmailFromReq(req);
        // TODO: get random background color?
        
        const newProject = {
                title: req.body.projectName,
                id: projectID,
                eventsID: [],
                timeEstimate: req.body.estimatedTime,
                start: req.body.startDate,
                end: req.body.endDate,
                sessionLengthMinutes: req.body.sessionLengthMinutes,
                spacingLengthMinutes: req.body.spacingLengthMinutes,
                backgroundColor: "green",
                email: userEmail,
        }

        return newProject;
}

module.exports = router;