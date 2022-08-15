const express = require('express');
const StatusCodes = require('http-status-codes').StatusCodes;
const dbUnexportedEvents = require('./dal/dbUnexportedEvents');
const dbProjects = require('./dal/dbProjects');
const dbPendingProjects = require('./dal/dbPendingProjects');
const { google } = require('googleapis');
const algorithm = require('./algorithm');
const utils = require('./utils');
const googleSync = require('./google-sync');
const router = express.Router();

// Routing
router.get('/', (req, res) => { getProjects(req, res) });
router.post('/', (req, res) => { createProject(req, res) });
router.get('/events', (req, res) => { getAllProjectEvents(req, res) });
router.patch('/events/reschedule', (req, res) => { rescheduleProjectEvent(req, res) });
router.get('/pending', (req, res) => { getPendingProjects(req, res) });
router.post('/shared', (req, res) => { createSharedProject(req, res) });
router.post('/shared/approved', (req, res) => { approveSharedProject(req, res) });
router.post('/export/:id', (req, res) => { exportProject(req, res) });
router.delete('/:id', (req, res) => { deleteProject(req, res) });


// Functions
const rescheduleProjectEvent = async (req, res) => {
        try {
                const event = req.body.event;
                const allEvents = req.body.allEvents;
                const projectId = utils.getEventProjectId(event);
                const project = await dbProjects.findOne({ 'id': projectId });
                let [events, estimatedTimeLeft] = await algorithm.rescheduleEvent(event, allEvents, project);

                let resBody = {
                        events: events,
                        estimatedTimeLeft: estimatedTimeLeft,
                }

                res.status(StatusCodes.OK).send(resBody);
        } catch (err) {
                console.log(`[rescheduleProjectEvent] Error!\n${err}`);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
        }
}

const getProjects = async (req, res) => {
        try {
                const userEmail = utils.getEmailFromReq(req);
                const allProjects = await dbProjects.find({ 'email': userEmail });

                res.status(StatusCodes.OK).send(allProjects);
        } catch (err) {
                console.log(`[getProjects] Error!\n${err}`);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
        }
}

const getPendingProjects = async (req, res) => {
        try {
                const userEmail = utils.getEmailFromReq(req);
                const pendingProjects = await dbPendingProjects.find({ 'participatingEmails': userEmail });

                res.status(StatusCodes.OK).send(pendingProjects);
        } catch (err) {
                console.log(`[getPendingProjects] Error!\n${err}`);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
        }
}

const getAllProjectEvents = async (req, res) => {
        try {
                const userEmail = utils.getEmailFromReq(req);

                dbUnexportedEvents.find({ email: userEmail })
                        .then(events => {
                                res.status(StatusCodes.OK).send(events);
                        })
                        .catch(err => {
                                console.log(`[getAllProjectEvents] Error!\n${err}`);
                                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
                        })
        } catch (err) {
                console.log(`[getAllProjectEvents] Error!\n${err}`);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
        }
}

const addApprovingUserToSharedProject = async (approverEmail, project) => {
        return dbPendingProjects.addApprovingUser(project.sharedId, approverEmail);
}

const approveSharedProject = async (req, res) => {
        try {
                const approverEmail = utils.getEmailFromReq(req);
                const project = req.body.project;
                await addApprovingUserToSharedProject(approverEmail, project);

                /**
                 * TODO: should we sync the user's data here?
                 * If we rely on the client requesting all of the Google events upon entering the schedules page,
                 * then we could sync here, because no events are lost.
                 * However if we rely on the client not always requesting all the events, and we sync here, the client could miss some events.
                 */
                const accessToken = await utils.getAccessTokenFromRequest(req);
                googleSync.syncGoogleData(accessToken, approverEmail);
                const pendingProject = await dbPendingProjects.findOne({ 'sharedId': project.sharedId });
                console.log(`[approveSharedProject] User ${approverEmail} approved project '${project.title}'`)
                if (pendingProject.awaitingApproval.length === 0) {
                        let [events, estimatedTimeLeft] = await algorithm.generateSchedule(project);
                        await saveProjectAndEvents(project, events);
                        await dbPendingProjects.deleteOne({ 'sharedId': project.sharedId });
                        console.log(`[approveSharedProject] Deleted pending project ${project.title} from PendingProjects.`)
                        res.status(StatusCodes.OK).send('Project created!');
                } else {
                        res.status(StatusCodes.OK).send('Approved project. Awaiting further approval.');
                }
        } catch (err) {
                console.log(`[approveSharedProject] Error!\n${err}`);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
        }
}

async function saveProjectAndEvents(project, events) {
        for (const email of project.participatingEmails) {
                let dupProj = duplicateProject(project);
                dupProj._id = null; // To avoid conflict if it's a shared project and one version already exists
                dupProj.email = email;
                dupProj.id = utils.generateId();
                await dbProjects.create(dupProj);
                events.forEach(event => {
                        event.email = email
                        event.id = utils.generateId();
                        event.projectId = dupProj.id;
                });

                await dbUnexportedEvents.insertMany(events);
        }
}

/**
 * Does NOT create a new ID.
 * @param {*} project 
 * @returns 
 */
const duplicateProject = (project) => {
        let ignoredConstraints = []
        let participatingEmails = []

        for (const id of project.ignoredConstraintsIds) {
                ignoredConstraints.push(id);
        }

        for (const email of project.participatingEmails) {
                participatingEmails.push(email);
        }

        const newProject = {
                title: project.title,
                id: project.id,
                sharedId: project.sharedId,
                timeEstimate: project.timeEstimate,
                start: project.start,
                end: project.end,
                sessionLengthMinutes: project.sessionLengthMinutes,
                spacingLengthMinutes: project.spacingLengthMinutes,
                backgroundColor: project.backgroundColor,
                email: project.email,
                participatingEmails: participatingEmails,
                exportedToGoogle: project.exportedToGoogle,
                maxEventsPerDay: project.maxEventsPerDay,
                dayRepetitionFrequency: project.dayRepetitionFrequency,
                dailyStartHour: project.dailyStartHour,
                dailyEndHour: project.dailyEndHour,
                ignoredConstraintsIds: ignoredConstraints,
        }

        return newProject;
}

const createSharedProject = async (req, res) => {
        try {
                let inputErrorMsg = checkInputValidity(req);
                if (inputErrorMsg != null) {
                        res.status(StatusCodes.BAD_REQUEST).send(inputErrorMsg);
                        return;
                }

                let project = await createProjectObject(req, true);
                const userEmail = utils.getEmailFromReq(req);
                project.requestingUser = userEmail;
                let participatingEmails = await getParticipatingEmails(req);
                project.awaitingApproval = participatingEmails;
                await dbPendingProjects.create(project);
                await addApprovingUserToSharedProject(userEmail, project)
                console.log(`[requestCreateSharedProject] Created a request to share a project by ${userEmail} with ${project.participatingEmails}`);
                res.status(StatusCodes.OK).send();
        } catch (error) {
                console.log(`[createSharedProject] Unknown error:\n${error}`);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
        }
}

const createProject = async (req, res) => {
        try {
                let inputErrorMsg = checkInputValidity(req);
                if (inputErrorMsg != null) {
                        res.status(StatusCodes.BAD_REQUEST).send(inputErrorMsg);
                        return;
                }

                const project = await createProjectObject(req, false);
                let events = [];
                let estimatedTimeLeft = null;
                let errorMsg = null;

                try {
                        [events, estimatedTimeLeft] = await algorithm.generateSchedule(project);
                        await saveProjectAndEvents(project, events);
                } catch (error) {
                        console.log(`[createProject] Error!\n${error}`);
                        errorMsg = error;
                }

                resBody = {
                        estimatedTimeLeft: estimatedTimeLeft,
                };

                if (!errorMsg) {
                        res.status(StatusCodes.OK).send(resBody);
                } else {
                        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Error with generating a schedule:\n" + errorMsg);
                }
        } catch (err) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Unknown server error');
        }
}

const exportProject = async (req, res) => {
        let errorMsg = null;
        const projectId = req.params.id;
        let project = null;
        let email = utils.getEmailFromReq(req);

        console.log(`[exportProject] Exporting project for ${email}.`);
        try {
                project = await dbProjects.findOne({ 'id': projectId });
                if (!project) {
                        res.status(StatusCodes.BAD_REQUEST).send(`Could not find project matching ID ${projectId}`);
                        return;
                }

                if (project.exportedToGoogle) {
                        res.status(StatusCodes.BAD_REQUEST).send(`Project ${projectId} is already exported to Google.`);
                        return;
                }

                let allProjectEvents = await dbUnexportedEvents.find({ email: email, projectId: projectId })
                if (allProjectEvents.length == 0) {
                        res.status(StatusCodes.BAD_REQUEST).send(`Project ${projectId} has no events connected to it..`);
                        return;
                }

                const googleResJson = await createGoogleCalendar(req, project);
                const googleCalendarId = googleResJson.data.id;
                const errMsg = await insertEventsToGoogleCalendar(req, allProjectEvents, project, googleCalendarId);

                await dbUnexportedEvents.deleteMany({ email: email, 'projectId': projectId });
                await dbProjects.updateExportProject(projectId, googleCalendarId);
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

const insertEventsToGoogleCalendar = async (req, events, project, calendarId) => {
        const accessToken = utils.getAccessTokenFromRequest(req);
        utils.oauth2Client.setCredentials({ access_token: accessToken });
        const calendar = google.calendar('v3');
        let errMsg = null;

        try {
                // TODO: change this to batch
                for (const event of events) {
                        const eventId = event.id;
                        const projectId = project.id

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
                project = await dbProjects.findOne({ 'id': projectId });

                if (!project) {
                        return;
                }

                if (project.exportedToGoogle) {
                        const accessToken = utils.getAccessTokenFromRequest(req);
                        utils.oauth2Client.setCredentials({ access_token: accessToken });
                        const googleCalendarApi = google.calendar({ version: 'v3', auth: utils.oauth2Client });
                        let googleCalendarId = project.googleCalendarId;

                        if (!googleCalendarId) {
                                throw (`Project is not associated with any Google calendar ID.`);
                        }

                        const googleRes = googleCalendarApi.calendars.delete({
                                auth: utils.oauth2Client,
                                calendarId: googleCalendarId,
                        })
                } else {
                        await dbUnexportedEvents.deleteMany({ 'projectId': projectId });
                }

                await dbProjects.deleteOne({ 'id': projectId });
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

        if (req.body.participatingEmails.length === 0) {
                res.status(StatusCodes.BAD_REQUEST).send("Cannot create a project no emails attached.");
                return;
        }

        for (const email of req.body.participatingEmails) {
                if (email.length > 0) {
                        if (!isValidEmail(email)) {
                                errorMsg += `   - email '${email}' is not valid.\n`;
                        }
                }
        }

        if (!req.body.projectTitle || req.body.projectTitle.length === 0) {
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

        {
                // TODO: add check between method of day advancement - every X days or specific days?
                if (!isPositiveInteger(req.body.dayRepetitionFrequency)) {
                        errorMsg += "   - Day repetition frequency must be a positive integer.\n";
                }

                if (req.body.daysOfWeek.length === 0) {
                        errorMsg += "   - No days selected. Must choose at least one day.\n";

                }
        }

        const currDate = new Date();

        if (req.body.endDate <= req.body.startDate) {
                errorMsg += "   - End date must be later than start date.\n";
        }

        if (req.body.endDate <= currDate) {
                errorMsg += "   - End date must be later than current date.\n";
        }

        if (new Date(req.body.dailyStartHour) >= new Date(req.body.dailyEndHour)) {
                errorMsg += "   - Daily start hour must be earlier than daily end hour."
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


const createProjectObject = async (req) => {
        const projectId = utils.generateId();
        const userEmail = utils.getEmailFromReq(req);
        const backgroundColor = getRandomColor();
        let sharedProjectId = null;
        let participatingEmails = await getParticipatingEmails(req);

        if (participatingEmails.length > 1) {
                sharedProjectId = utils.generateId();
        }

        const newProject = {
                title: req.body.projectTitle,
                id: projectId,
                sharedId: sharedProjectId,
                timeEstimate: req.body.estimatedTime,
                start: req.body.startDate,
                end: req.body.endDate,
                sessionLengthMinutes: req.body.sessionLengthMinutes,
                spacingLengthMinutes: req.body.spacingLengthMinutes,
                backgroundColor: backgroundColor,
                email: userEmail,
                participatingEmails: participatingEmails,
                exportedToGoogle: false,
                maxEventsPerDay: req.body.maxEventsPerDay,
                dayRepetitionFrequency: req.body.dayRepetitionFrequency,
                daysOfWeek: req.body.daysOfWeek,
                dailyStartHour: req.body.dailyStartHour,
                dailyEndHour: req.body.dailyEndHour,
                ignoredConstraintsIds: req.body.ignoredConstraintsIds,
        }

        return newProject;
}

async function getParticipatingEmails(req) {
        let userEmail = utils.getEmailFromReq(req);
        let participatingEmails = [];
        for (const email of req.body.participatingEmails) {
                participatingEmails.push(email);
        }

        // We add this check in case the client didn't add the requesting user's email to the list of emails to share with.
        if (!participatingEmails.includes(userEmail)) {
                participatingEmails.push(userEmail);
        }

        return participatingEmails;
}

function isValidEmail(email) {
        const re =
                /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        return re.test(String(email).toLowerCase());
}

const getRandomColor = () => {
        let randomColor = Math.floor(Math.random() * 16777215).toString(16);
        randomColor = "#" + randomColor;

        return randomColor;
}

module.exports = router;