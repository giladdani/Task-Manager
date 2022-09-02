const express = require('express');
const StatusCodes = require('http-status-codes').StatusCodes;
const { google } = require('googleapis');
const dbUnexportedEvents = require('../../dal/dbUnexportedEvents');
const dbProjects = require('../../dal/dbProjects');
const dbPendingProjects = require('../../dal/dbPendingProjects');
const algorithm = require('../algorithm');
const utils = require('../../utils/utils.js');
const consts = require('../../utils/consts.js');
const googleSync = require('../../utils/google-sync');
const eventsUtils = require('../events/events-utils');
const projectsUtils = require('./projects-utils');
const googleUtils = require('../google/google-utils.js');

const router = express.Router();

// Routing
router.get('/', (req, res) => { getProjects(req, res) });
router.post('/', (req, res) => { createProject(req, res) });
router.patch('/events/reschedule', (req, res) => { rescheduleProjectEvent(req, res) });
router.get('/pending', (req, res) => { getPendingProjects(req, res) });
router.post('/shared', (req, res) => { createSharedProject(req, res) });
router.post('/shared/approved', (req, res) => { approveSharedProject(req, res) });
router.post('/export/:id', (req, res) => { exportProject(req, res) });
router.delete('/:id', (req, res) => { deleteProject(req, res) });
router.patch('/:id', (req, res) => { patchProject(req, res) })


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

                if (project.exportedToGoogle && !project.googleCalendarId) {
                        res.status(StatusCodes.BAD_REQUEST).send(`Project ${projectId} is already exported to Google.`);
                        return;
                }

                let googleCalendarId = null;
                let accessToken = utils.getAccessTokenFromRequest(req);
                if (project.googleCalendarId) {
                        /**
                         * If the project already has a google calendar ID, it means it has been exported by one of the users already.
                         * In that case we don't need to create a new calendar and insert our events,
                         * but rather just add the existing calendar to the user's calendar list.
                         */
                        const googleResJson = await insertGoogleCalendar(accessToken, project.googleCalendarId);
                        googleCalendarId = googleResJson.data.id;
                } else {
                        let unexportedProjEvents = await dbUnexportedEvents.find({ email: email, projectId: projectId })
                        if (unexportedProjEvents.length == 0) {
                                res.status(StatusCodes.BAD_REQUEST).send(`Project ${projectId} has no events connected to it.`);
                                return;
                        }

                        const googleResJson = await createGoogleCalendar(req, project);
                        googleCalendarId = googleResJson.data.id;
                        const errMsg = await insertEventsToGoogleCalendar(req, unexportedProjEvents, project, googleCalendarId);
                        if (projectsUtils.isSharedProject(project)) {
                                await dbProjects.updateSharedCalendarId(project, googleCalendarId);
                                addACLToSharedCalendar(accessToken, googleCalendarId, project, email);
                                await updateAllLocalProjectEvents(accessToken, googleCalendarId);
                        }
                }
                await dbUnexportedEvents.deleteMany({ email: email, 'projectId': projectId });
                await dbProjects.updateExportProject(projectId, googleCalendarId);
        } catch (err) {
                errorMsg = err;
        }

        if (!errorMsg) {
                console.log(`Exported project ${project.title} (ID: ${projectId}) to Google.`);
                res.status(StatusCodes.OK).send(`Exported project ${project.title} (ID: ${projectId}) to Google.`);
        } else {
                console.error(`ERROR: Failed to export project ${project.title} (ID: ${projectId}). Error:\n${errorMsg}`);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Unknown server error: ' + errorMsg);
        }
}

async function insertGoogleCalendar(accessToken, calendarId) {
        const googleCalendarApi = utils.getGAPIClientCalendar(accessToken);
        let res;

        try {
                const googleRes = await googleCalendarApi.calendarList.insert({
                        resource: {
                                id: calendarId,
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

const createGoogleCalendar = async (req, project) => {
        const accessToken = utils.getAccessTokenFromRequest(req);
        utils.oauth2Client.setCredentials({ access_token: accessToken });
        const googleCalendarApi = google.calendar({ version: 'v3', auth: utils.oauth2Client });
        let res;

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

async function addACLToSharedCalendar(accessToken, calendarId, project, exportingUser) {
        let gapi = utils.getGAPIClientCalendar(accessToken);

        for (const email of project.participatingEmails) {
                if (email === exportingUser) {
                        continue;
                }

                try {
                        const googleRes = await gapi.acl.insert({
                                calendarId: calendarId,
                                resource: {
                                        role: "owner",
                                        scope: {
                                                type: "user",
                                                value: email,
                                        }
                                }
                        })
                        console.log(`[addACLToSharedCalendar] Added ${email} as owner to project '${project.title}'`);
                }
                catch (err) {
                        console.log(err);
                }
        }
}

/**
 * When a shared project is exported for the first time, the project is represented both by Google events as well as local, unexported ones.
 * To maintain sync, we need to form a connection between the local events and their Google counterparts.
 * This function changes the ID of all the unexported events to match the Google event representation,
 * so that when one user of the shared project updates one of the unexported events,
 * the server knows which Google event to update.
 * And vice versa - when a Google event is changed that also has representation here,
 * we must change the local event accordingly.
 */
async function updateAllLocalProjectEvents(accessToken, calendarId) {
        let calendarEvents = await googleUtils.getCalendarEvents(accessToken, calendarId, null);

        for (const gEvent of calendarEvents) {
                let sharedId = eventsUtils.g_GetSharedEventId(gEvent);
                if (!sharedId) continue;
                let newId = gEvent.id;
                dbUnexportedEvents.updateMany({ sharedId: sharedId }, { $set: { gEventId: newId, calendarId: calendarId } })
        }
}

// // const insertEventsToGoogleCalendar = async (req, unexportedEvents, project, calendarId) => {
// //         /**
// //          * Google Calendar API docuemntation for Event resource.
// //          * https://developers.google.com/calendar/api/v3/reference/events
// //          */

// //         const accessToken = utils.getAccessTokenFromRequest(req);
// //         utils.oauth2Client.setCredentials({ access_token: accessToken });
// //         const calendar = google.calendar('v3');
// //         let errMsg = null;

// //         try {
// //                 let gapi = utils.getGAPIClientCalendar(accessToken);
// //                 // TODO: change this to batch
// //                 for (const event of unexportedEvents) {
// //                         const eventId = event.id;
// //                         const eventSharedId = event.sharedId;
// //                         const projectId = project.id


// //                         // extendedProperties only accepts Strings as the value, not arrays.
// //                         let independentTagIdsString = event.tags.independentTagIds.toString();
// //                         let projectTagIdsString = event.tags.projectTagIds.toString();
// //                         let ignoredProjectTagIdsString = event.tags.ignoredProjectTagIds.toString();

// //                         // extendedProperties only accepts Strings as the value, not arrays.
// //                         // let independentTagIdsString = event.independentTagIds.toString();
// //                         // let projectTagIdsString = event.projectTagIds.toString();
// //                         // let ignoredProjectTagIdsString = event.ignoredProjectTagIds.toString();

// //                         const response = await gapi.events.insert({
// //                                 // const response = await calendar.events.insert({
// //                                 // auth: utils.oauth2Client,
// //                                 calendarId: calendarId,
// //                                 requestBody: {
// //                                         summary: event.title,
// //                                         start: {
// //                                                 dateTime: new Date(event.start)
// //                                         },
// //                                         end: {
// //                                                 dateTime: new Date(event.end)
// //                                         },
// //                                         extendedProperties: {
// //                                                 private: {
// //                                                         fullCalendarEventId: eventId,
// //                                                         fullCalendarEventSharedId: eventSharedId,
// //                                                         fullCalendarProjectId: projectId,

// //                                                         // [consts.gFieldName_IndTagIds]: independentTagIdsString,
// //                                                         // [consts.gFieldName_ProjTagIds]: projectTagIdsString,
// //                                                         // [consts.gFieldName_IgnoredProjectTagIds]: ignoredProjectTagIdsString,
// //                                                         // // independentTagIdsString: independentTagIdsString,
// //                                                         // // projectTagIdsString: projectTagIdsString,
// //                                                         // // ignoredProjectTagIdsString: ignoredProjectTagIdsString,
// //                                                 },
// //                                         }
// //                                 }
// //                         })
// //                 }
// //         } catch (error) {
// //                 console.log(`[insertGeneratedEventsToGoogleCalendar] ${error}`);
// //                 errMsg = error;
// //         }

// //         return errMsg;
// // }

const insertEventsToGoogleCalendar = async (req, unexportedEvents, project, calendarId) => {
        /**
         * Google Calendar API docuemntation for Event resource.
         * https://developers.google.com/calendar/api/v3/reference/events
         */

        let errMsg = null;

        try {
                const accessToken = utils.getAccessTokenFromRequest(req);
                const gapi = utils.getGAPIClientCalendar(accessToken);

                // TODO: change this to batch
                for (const event of unexportedEvents) {
                        let resource = {
                                summary: event.title,
                                start: {
                                        dateTime: new Date(event.start)
                                },
                                end: {
                                        dateTime: new Date(event.end)
                                },
                                extendedProperties: {
                                        private: {
                                                fullCalendarEventId: event.id,
                                                fullCalendarProjectId: project.id,

                                                // extendedProperties only accepts Strings as the value, not arrays.
                                                [consts.gFieldName_IndTagIds]: event.tags.independentTagIds.toString(),
                                                [consts.gFieldName_ProjTagIds]: event.tags.projectTagIds.toString(),
                                                [consts.gFieldName_IgnoredProjectTagIds]: event.tags.ignoredProjectTagIds.toString(),
                                        },
                                }
                        }

                        // Google does not accept null values in the fields of extended properties, so we first check
                        if (event.sharedId) resource.extendedProperties.private.fullCalendarEventSharedId = event.sharedId;

                        const response = await gapi.events.insert({
                                calendarId: calendarId,
                                resource: resource,
                        })
                }
        } catch (error) {
                console.error(`[insertGeneratedEventsToGoogleCalendar] ${error}`);
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
 * The field values you specify replace the existing values. 
 * Fields that you don’t specify in the request remain unchanged. 
 * Array fields, if specified, overwrite the existing arrays; this discards any previous array elements.
 * Project Patch could have side-effects. Some changes could affect the project's events.
 * @param {*} req Potential fields for the body are the model fields of the project object (not all!):
 *                projectSchema {
                        title: String,
                        timeEstimate: Number,
                        start: Date,
                        end: Date,
                        sessionLengthMinutes: Number,
                        spacingLengthMinutes: Number,
                        backgroundColor: String,
                        maxEventsPerDay: Number,
                        dayRepetitionFrequency: Number,
                        dailyStartHour: Date,
                        dailyEndHour: Date,
                        ignoredConstraintsIds: [String],
                        tagIds: [String],
                }
 * @param {*} res 
 * @returns 
 */
const patchProject = async (req, res) => {
        try {
                let projectId = req.params.id;
                let [projectUpdates, eventUpdates] = getPatchFields(req);
                let objForUpdate = { $set: projectUpdates }

                await eventsUtils.patchEventsFromProjectPatch(projectId, eventUpdates, req);
                dbProjects.updateOne({ id: projectId }, objForUpdate)
                        .then(doc => {
                                if (doc.modifiedCount === 1) {
                                        res.status(StatusCodes.OK).send();
                                } else {
                                        res.status(StatusCodes.BAD_REQUEST).send("Could not find document.");
                                }
                        })
        }
        catch (err) {
                console.error(`[patchProject] Error:\n${err}`);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
        }
}

/**
 * Some fields (not all) affect events as well, so this function returns the project fields to update and event fields to update as a result.
 * @returns [projectUpdates, eventUpdates] - two objects, each one holding the relevant fields to update in each type of object (project and project event).
 */
function getPatchFields(req) {
        let projectUpdates = {};
        let eventUpdates = {};

        if (req.body.title) {
                projectUpdates.title = req.body.title;
                eventUpdates.title = req.body.title;
        }

        if (req.body.timeEstimate) projectUpdates.timeEstimate = req.body.timeEstimate;
        if (req.body.start) projectUpdates.start = req.body.start;
        if (req.body.end) projectUpdates.end = req.body.end;
        if (req.body.sessionLengthMinutes) projectUpdates.sessionLengthMinutes = req.body.sessionLengthMinutes;
        if (req.body.spacingLengthMinutes) projectUpdates.spacingLengthMinutes = req.body.spacingLengthMinutes;
        if (req.body.backgroundColor) {
                projectUpdates.backgroundColor = req.body.backgroundColor;
                eventUpdates.backgroundColor = req.body.backgroundColor;
        }

        if (req.body.maxEventsPerDay) projectUpdates.maxEventsPerDay = req.body.maxEventsPerDay;
        if (req.body.dayRepetitionFrequency) projectUpdates.dayRepetitionFrequency = req.body.dayRepetitionFrequency;
        if (req.body.dailyStartHour) projectUpdates.dailyStartHour = req.body.dailyStartHour;
        if (req.body.dailyEndHour) projectUpdates.dailyEndHour = req.body.dailyEndHour;
        if (req.body.ignoredConstraintsIds) projectUpdates.ignoredConstraintsIds = req.body.ignoredConstraintsIds;
        if (req.body.tagIds) {
                projectUpdates.tagIds = req.body.tagIds;
                eventUpdates.projectTagIds = req.body.tagIds;
        }

        return [projectUpdates, eventUpdates];
}

// // async function patchEventsFromProjectPatch(projectId, eventUpdates, req) {
// //         let project = await dbProjects.findOne({ id: projectId });
// //         if (project.exportedToGoogle) {
// //                 // TODO: Update Google events
// //                 return patchGoogleEventsFromProjectPatch(projectId, eventUpdates, req);
// //         } else {
// //                 return dbUnexportedEvents.patchEventsFromProjectPatch(projectId, eventUpdates);
// //         }
// // }

// // async function patchGoogleEventsFromProjectPatch(projectId, eventUpdates, req) {
// //         /** 
// //          * ! This code has a lot of code duplication with the patch event code from events.js. 
// //          * ! Is there any way to combine the two? 
// //          * ! In general this code, since dealing with events, feels like it should be in events.js.
// //          */
// //         const accessToken = utils.getAccessTokenFromRequest(req);
// //         utils.oauth2Client.setCredentials({ access_token: accessToken });
// //         const googleCalendarApi = google.calendar({ version: 'v3', auth: utils.oauth2Client });
// //         let email = utils.getEmailFromReq(req);
// //         let dbGEvents = await dbGoogleEvents.findByProject(email, projectId);
// //         for (const dbGEvent of dbGEvents) {
// //                 // TODO: change this to batch
// //                 if (!utils.accessRoleAllowsWriting_GoogleDBEvent(dbGEvent)) {
// //                         continue;
// //                 }

// //                 const googleEventId = dbGEvent.id;
// //                 const googleCalendarId = dbGEvent.calendarId;
// //                 const resource = getEventPatchFieldsGoogle(eventUpdates);
// //                 resource = utils.pullDeletedTagsFromIgnoredGEvent(dbGEvent, resource);
// //                 const params = {
// //                         auth: utils.oauth2Client,
// //                         calendarId: googleCalendarId,
// //                         eventId: googleEventId,
// //                         resource: resource,
// //                 }

// //                 const response = await googleCalendarApi.events.patch(params);
// //         }
// // }

// // function getEventPatchFieldsGoogle(updateFields) {
// //         // ! Almost identical to code in events.js! Figure how to either call the code in events.js, or move this to somewhere shared (like utils).
// //         // ! Note that the code in events.js makes use of req, not an updateFields object. 
// //         // ! Though it can just send req.body as the updateFields object.
// //         let resource = {};

// //         if (updateFields.title) resource.summary = updateFields.title;
// //         if (updateFields.start) resource.start = { dateTime: new Date(updateFields.start) };
// //         if (updateFields.end) resource.end = { dateTime: new Date(updateFields.end) };
// //         // // if (updateFields.independentTagIds) resource.extendedProperties = { private: { independentTagIds: updateFields.independentTagIds } };
// //         // // if (updateFields.projectTagIds) resource.extendedProperties = { private: { projectTagIds: updateFields.projectTagIds } };
// //         // // if (updateFields.ignoredProjectTagIds) resource.extendedProperties = { private: { ignoredProjectTagIds: updateFields.ignoredProjectTagIds } };

// //         resource.extendedProperties = { private: {} }

// //         if (req.body.independentTagIds) resource.extendedProperties.private.independentTagIdsString = req.body.independentTagIds.toString();
// //         if (req.body.projectTagIds) resource.extendedProperties.private.projectTagIdsString = req.body.projectTagIds.toString();
// //         if (req.body.ignoredProjectTagIds) resource.extendedProperties.private.ignoredProjectTagIdsString = req.body.ignoredProjectTagIds.toString();

// //         return resource;
// // }

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
        const backgroundColor = utils.getRandomColor();
        let participatingEmails = await getParticipatingEmails(req);
        let sharedProjectId = participatingEmails.length > 1 ? utils.generateId() : null;

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


module.exports = router;