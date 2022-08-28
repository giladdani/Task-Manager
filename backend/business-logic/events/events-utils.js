const { google } = require('googleapis');
const { StatusCodes } = require('http-status-codes');
const dbGoogleEvents = require("../../dal/dbGoogleEvents");
const dbProjects = require("../../dal/dbProjects");
const dbUnexportedEvents = require('../../dal/dbUnexportedEvents');
const utils = require("../../utils/utils");


async function patchEventsFromProjectPatch(projectId, eventUpdates, req) {
    let project = await dbProjects.findOne({ id: projectId });
    if (project.exportedToGoogle) {
        return patchGoogleEventsFromProjectPatch(projectId, eventUpdates, req);
    } else {
        return patchUnexportedEventsFromProjectPatch(projectId, eventUpdates, req);
    }
}

async function patchUnexportedEventsFromProjectPatch(projectId, eventUpdates, req) {
    let email = utils.getEmailFromReq(req);
    let dbUnexEvents = await dbUnexportedEvents.findByProject(email, projectId);

    for (const unexEvent of dbUnexEvents) {
        // TODO: change this to batch
        let [statusCode, msg] = await patchUnexportedEvent(unexEvent, eventUpdates);
    }

    // return dbUnexportedEvents.patchEventsFromProjectPatch(projectId, eventUpdates); // ! OLD CODE, delete if new works
}

async function patchGoogleEventsFromProjectPatch(projectId, eventUpdates, req) {
    const accessToken = utils.getAccessTokenFromRequest(req);
    let email = utils.getEmailFromReq(req);
    let dbGEvents = await dbGoogleEvents.findByProject(email, projectId);
    for (const dbGEvent of dbGEvents) {
        // TODO: change this to batch
        let [statusCode, msg] = await patchGoogleEvent(accessToken, dbGEvent, eventUpdates);
    }
}

/**
 * @returns [statusCode, msg]
 */
async function patchUnexportedEvent(unexEvent, eventUpdates) {
    try {
        let update = getUnexEventUpdateObj(unexEvent, eventUpdates);

        const docs = await dbUnexportedEvents.updateOne({ id: unexEvent.id }, update)
        if (docs.matchedCount === 1 && docs.modifiedCount === 1) {
            console.log(`[updateUnexportedEvent] Successfully updated unexported event ${unexEvent.title} (${unexEvent.id})`);
            return [StatusCodes.OK, null]
        } else {
            console.log("ERROR: Failed to update unexported event.");
            return [StatusCodes.INTERNAL_SERVER_ERROR, null]
        }
    } catch (err) {
        return [StatusCodes.INTERNAL_SERVER_ERROR, err];
    }
}

/**
 * MongoDB documentation for updateOne(): 
 * https://www.mongodb.com/docs/manual/reference/method/db.collection.updateOne/
 * 
 * @param {*} req A client event patch request with fields to update.
 * @returns An update object for MongoDB with the relevant fields to update.
 */
function getUnexEventUpdateObj(unexEvent, updateFields) {
    let updateObj = {};

    if (updateFields.title) updateObj.title = updateFields.title;
    if (updateFields.start) updateObj.start = updateFields.start;
    if (updateFields.end) updateObj.end = updateFields.end;
    if (updateFields.backgroundColor) updateObj.backgroundColor = updateFields.backgroundColor;

    updateObj = unex_SortTags(updateObj, unexEvent, updateFields);

    updateObj = { $set: updateObj }

    return updateObj;
}

/**
 * @returns [status code, msg]
 */
const patchGoogleEvent = async (accessToken, dbGEvent, updateFields) => {
    /**
     * Google Calendar API documentation:
     * https://developers.google.com/calendar/api/v3/reference/events/patch
     */
    try {
        if (!dbGEvent) {
            return [StatusCodes.BAD_REQUEST, "No event"];
        }

        utils.oauth2Client.setCredentials({ access_token: accessToken });
        const googleCalendarApi = google.calendar({ version: 'v3', auth: utils.oauth2Client });
        if (!utils.accessRoleAllowsWriting_GoogleDBEvent(dbGEvent)) {
            return [StatusCodes.FORBIDDEN, "Access role does not allow updating."];
        }

        let resource = getGEventPatchResource(dbGEvent, updateFields);
        const params = {
            auth: utils.oauth2Client,
            calendarId: dbGEvent.calendarId,
            eventId: dbGEvent.id,
            resource: resource,
        }

        const gResponsePromise = await googleCalendarApi.events.patch(params);

        return [gResponsePromise.status, null];
    }
    catch (err) {
        console.error(err);
        return [StatusCodes.INTERNAL_SERVER_ERROR, err];
    }
}

/**
 * Google Calendar API documentation for Event Patch:
 * https://developers.google.com/calendar/api/v3/reference/events/patch
 * 
 * @returns A google event patch resource object, with all the relevant fields to update.
 */
function getGEventPatchResource(dbGEvent, updateFields) {
    let resource = {};

    if (updateFields.title) resource.summary = updateFields.title;
    if (updateFields.start) resource.start = { dateTime: new Date(updateFields.start) };
    if (updateFields.end) resource.end = { dateTime: new Date(updateFields.end) };

    resource = g_SortTags(resource, dbGEvent, updateFields);

    return resource;
}

/**
 * @returns The update object with the relevant tag fields, if necessary, after sorting them and filtering per the sortTags function.
 */
function unex_SortTags(updateObj, unexEvent, updateFields) {
    if (updateFields.independentTagIds || updateFields.projectTagIds || updateFields.ignoredProjectTagIds) {

        // Prepare fields to call the sortTags function.
        let independentTagIds = updateFields.independentTagIds ? updateFields.independentTagIds : unexEvent.independentTagIds;
        let projectTagIds = updateFields.projectTagIds ? updateFields.projectTagIds : unexEvent.projectTagIds;
        let ignoredProjectTagIds = updateFields.ignoredProjectTagIds ? updateFields.ignoredProjectTagIds : unexEvent.ignoredProjectTagIds;

        [independentTagIds, ignoredProjectTagIds] = sortTags(independentTagIds, projectTagIds, ignoredProjectTagIds);

        updateObj.independentTagIds = independentTagIds;
        if (updateFields.projectTagIds) updateObj.projectTagIds = projectTagIds;
        updateObj.ignoredProjectTagIds = ignoredProjectTagIds;
    }

    return resource;
}

/**
 * Returns the update resource with all the tag fields filtered accordingly.
 * @returns The resource with the relevant tag fields added.
 */
function g_SortTags(resource, dbGEvent, updateFields) {
    if (updateFields.independentTagIds || updateFields.projectTagIds || updateFields.ignoredProjectTagIds) {
        resource.extendedProperties = { private: {} }

        // Prepare fields to call the sortTags function.
        let independentTagIds = updateFields.independentTagIds ? updateFields.independentTagIds : dbGEvent.extendedProperties.private.independentTagIdsString.split(',');
        let projectTagIds = updateFields.projectTagIds ? updateFields.projectTagIds : dbGEvent.extendedProperties.private.projectTagIdsString.split(',');
        let ignoredProjectTagIds = updateFields.ignoredProjectTagIds ? updateFields.ignoredProjectTagIds : dbGEvent.extendedProperties.private.ignoredProjectTagIdsString.split(',');

        [independentTagIds, ignoredProjectTagIds] = sortTags(independentTagIds, projectTagIds, ignoredProjectTagIds);

        resource.extendedProperties.private.independentTagIdsString = independentTagIds.toString();
        if (updateFields.projectTagIds) resource.extendedProperties.private.projectTagIdsString = projectTagIds.toString();
        resource.extendedProperties.private.ignoredProjectTagIdsString = ignoredProjectTagIds.toString();
    }

    return resource;
}

/**
 * When updating tags, some checks need to be performed.
 * If a client tries to update an independent tag that is already a project tag, it shouldn't be in the 'independent' field.
 * If a client tries to update project tags such that they also include an independent tag, said tag needs to be removed from independent.
 * 
 * @param {*} independentTagIds An array of all the indepndent tag IDs.
 * @param {*} projectTagIds An array of all the project tag IDs.
 * @param {*} ignoredProjectTagIds An array of all the ignored project tag IDs.
 * @returns [updateIndependentTagIds, updatedIgnoredProjectTagIds]
 */
function sortTags(independentTagIds, projectTagIds, ignoredProjectTagIds) {
    let updatedProjectTagIds = projectTagIds;

    // Remove independent tags that are now project tags
    let updateIndependentTagIds = independentTagIds.filter(tagId => !projectTagIds.includes(tagId));

    // Pull deleted project tags from the ignored list
    let updatedIgnoredProjectTagIds = ignoredProjectTagIds.filter(tagId => projectTagIds.includes(tagId));

    // Filter out from the independent tags all those that are in the ignored tags.
    // This is a strange conflict case that we cover just for safety, 
    // but it shouldn't occur if the rest of the server works well with updates.
    updateIndependentTagIds = updateIndependentTagIds.filter(tagId => !updatedIgnoredProjectTagIds.includes(tagId));

    return [updateIndependentTagIds, updatedIgnoredProjectTagIds];
}

/**
 * When a tag is deleted it needs to be removed from all events.
 */
async function deleteTag(tagId, email) {
    if (!tagId) {
        return null;
    }

    dbUnexportedEvents.deleteTag(tagId);
    deleteTagFromGoogle(tagId);
}

async function deleteTagFromGoogle(tagId) {
    // Fetch all Google events with this tag
    // let gEvents = dbGoogleEvents.findWithTag(tagId);

    
    // for each google event with this tag:
    // remove tag from the appropriate arrays
    // patch events to Google with new tag fields
}


module.exports = {
    patchEventsFromProjectPatch: patchEventsFromProjectPatch,
    patchGoogleEvent: patchGoogleEvent,
    patchUnexportedEvent: patchUnexportedEvent,
    deleteTag: deleteTag,
}