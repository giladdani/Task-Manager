const express = require('express');
const StatusCodes = require('http-status-codes').StatusCodes;
const EventModel = require('./models/projectevent')
const ProjectModel = require('./models/project')
const { google } = require('googleapis');

const algorithm = require('./algorithm');
const utils = require('./utils');
const router = express.Router();

// Routing
router.get('/', (req, res) => { getProjects(req, res) });
router.get('/events', (req, res) => { getProjectEvents(req, res) });
router.post('/', (req, res) => { createProject(req, res) });
router.post('/export/:id', (req, res) => { exportProject(req, res) });
router.delete('/:id', (req, res) => { deleteProject(req, res) });


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

const exportProject = async (req, res) => {
        let errorMsg = null;
        const projectId = req.params.id;
        let project = null;

        try {
                project = await ProjectModel.findOne({ 'id': projectId });

                if (!project) {
                        res.status(StatusCodes.BAD_REQUEST).send(`Could not find project matching ID ${projectId}`);
                        return;
                }

                if (project.exportedToGoogle) {
                        res.status(StatusCodes.BAD_REQUEST).send(`Project ${projectId} is already exported to Google.`);
                        return;
                }

                const allEvents = req.body.events;
                const allProjectEvents = allEvents.filter(event => {
                        return event.extendedProps.unexportedEvent === true &&
                                event.extendedProps.projectId === project.id
                });

                if (allProjectEvents.length == 0) {
                        res.status(StatusCodes.BAD_REQUEST).send(`Project ${projectId} has no events connected to it..`);
                        return;
                }

                const googleResJson = await createGoogleCalendar(req, project);
                const googleCalendarId = googleResJson.data.id;
                const errMsg = await insertEventsToGoogleCalendar(req, allProjectEvents, project, googleCalendarId);

                let docs = await EventModel.deleteMany({ 'projectId': projectId });
                docs = await ProjectModel.updateOne({ 'id': projectId },
                        {
                                $set: {
                                        exportedToGoogle: true,
                                        googleCalendarId: googleCalendarId,
                                }
                        });
        } catch (err) {
                errorMsg = err;
        }

        if (errorMsg == null) {
                console.log(`Exported project ${project.title} (ID: ${projectId}) to Google.`);
                res.status(StatusCodes.OK).send(`Exported project ${project.title} (ID: ${projectId}) to Google.`);
        } else {
                console.log(`ERROR: Failed to export project ${project.title} (ID: ${projectId})`);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Unknown server error: ' + errorMsg);
        }
}

const createGoogleCalendar = async (req, project) => {
        const accessToken = utils.getAccessTokenFromRequest(req);
        utils.oauth2Client.setCredentials({ access_token: accessToken });
        const googleCalendarApi = google.calendar({ version: 'v3', auth: utils.oauth2Client });
        let res = null;

        try {
                const googleRes = await googleCalendarApi.calendars.insert({
                        auth: utils.oauth2Client,
                        resource: {
                                summary: project.title,
                        }
                })

                res = googleRes;
        }
        catch (err) {
                console.log(err);
                res = err;
        }

        return res;
}

const insertEventsToGoogleCalendar = async (req, events, projet, calendarId) => {
        const accessToken = utils.getAccessTokenFromRequest(req);
        utils.oauth2Client.setCredentials({ access_token: accessToken });
        const calendar = google.calendar('v3');
        let errMsg = null;

        try {
                // TODO: change this to batch
                for (const event of events) {
                        const eventId = event.id;
                        const projectId = event.extendedProps.projectId;
                        const backgroundColor = event.backgroundColor;

                        const response = await calendar.events.insert({
                                auth: utils.oauth2Client,
                                calendarId: calendarId,
                                requestBody: {
                                        summary: event.title,
                                        start: {
                                                dateTime: new Date(event.start)
                                        },
                                        end: {
                                                dateTime: new Date(event.end)
                                        },
                                        extendedProperties: {
                                                private: {
                                                        fullCalendarEventId: eventId,
                                                        fullCalendarProjectId: projectId,
                                                        fullCalendarBackgroundColor: backgroundColor,
                                                },
                                        }
                                }
                        })
                }
        } catch (error) {
                console.log(`[insertGeneratedEventsToGoogleCalendar] ${error}`);
                errMsg = error;
        }

        return errMsg;
}











const deleteProject = async (req, res) => {
        let errorMsg = null;
        const projectId = req.params.id;
        let project = null;

        try {
                project = await ProjectModel.findOne({ 'id': projectId });

                if (!project) {
                        return;
                }

                if (project.exportedToGoogle) {
                        const accessToken = utils.getAccessTokenFromRequest(req);
                        utils.oauth2Client.setCredentials({ access_token: accessToken });
                        const googleCalendarApi = google.calendar({ version: 'v3', auth: utils.oauth2Client });
                        let res = null;
                        let googleCalendarId = project.googleCalendarId;

                        if (!googleCalendarId) {
                                throw (`Project is not associated with any Google calendar ID.`);
                        }

                        const googleRes = await googleCalendarApi.calendars.delete({
                                auth: utils.oauth2Client,
                                calendarId: googleCalendarId,
                        })

                        res = googleRes;
                }

                let docs = await EventModel.deleteMany({ 'projectId': projectId });
                docs = await ProjectModel.deleteOne({ 'id': projectId });
        } catch (err) {
                errorMsg = err;
                console.error(err);
        }

        if (errorMsg == null) {
                console.log(`Deleted project ${project.title} (ID: ${projectId})`);
                res.status(StatusCodes.OK).send(`Deleted project ${project.title} (ID: ${projectId})`);
        } else {
                console.log(`ERROR: Failed to delete project ${project.title} (ID: ${projectId})`);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Unknown server error: ' + errorMsg);
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
        const projectId = utils.generateId();
        const userEmail = await utils.getEmailFromReq(req);
        const backgroundColor = getRandomColor();

        const newProject = {
                title: req.body.projectName,
                id: projectId,
                eventsID: [],
                timeEstimate: req.body.estimatedTime,
                start: req.body.startDate,
                end: req.body.endDate,
                sessionLengthMinutes: req.body.sessionLengthMinutes,
                spacingLengthMinutes: req.body.spacingLengthMinutes,
                backgroundColor: backgroundColor,
                email: userEmail,
                exportedToGoogle: false,
        }

        return newProject;
}

const getRandomColor = () => {
        let randomColor = Math.floor(Math.random() * 16777215).toString(16);
        randomColor = "#" + randomColor;

        return randomColor;
}

module.exports = router;