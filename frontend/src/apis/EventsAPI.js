const consts = require('./consts.js')
const apiUtils = require('./APIUtils.js');

const basicValidStatus = [200];
const validStatusArr_fetchGoogleEvents = basicValidStatus;
const validStatusArr_fetchUnsyncedGoogleEvents = basicValidStatus;
const validStatusArr_fetchAllProjectEvents = basicValidStatus;
const validStatusArr_fetchProjectEvents = basicValidStatus;
const validStatusArr_fetchAllEvents = basicValidStatus;
const validStatusArr_updateEvent = [200]; // Google uses 200
const validStatusArr_deleteEvent = [200, 204]; // Google uses 204


async function fetchGoogleEventsData() {
    let dataPromise = fetchGoogleEventsRes()
        .then(response => {
            return apiUtils.getResData(response);
        })

    return dataPromise;
}

async function fetchGoogleEventsRes() {
    const responsePromise = fetch(`${consts.host}/calendar/events/google`, {
        headers: consts.standardHeaders,
        method: 'GET'
    });

    return responsePromise
}

async function fetchUnsyncedGoogleEventsData() {
    let dataPromise = fetchUnsyncedGoogleEventsRes()
        .then(response => {
            return apiUtils.getResData(response);
        })

    return dataPromise;
}

async function fetchUnsyncedGoogleEventsRes() {
    const responsePromise = fetch(`${consts.host}/calendar/events/google/unsynced`, {
        headers: consts.standardHeaders,
        method: 'GET',
    });

    return responsePromise;

}

async function fetchAllProjectEventsData() {
    let dataPromise = fetchAllProjectEventsRes()
        .then(response => {
            return apiUtils.getResData(response);
        })

    return dataPromise;
}

async function fetchAllProjectEventsRes() {
    const responsePromise = fetch(`${consts.host}/projects/events`, {
        headers: consts.standardHeaders,
        method: 'GET'
    });

    return responsePromise;
}

/**
 * Fetches the events of a specific project, identified by its ID field.
 * @param {*} projectId 
 * @returns 
 */
async function fetchProjectEventsData(projectId) {
    let dataPromise = fetchProjectEventsRes(projectId)
        .then(response => {
            return apiUtils.getResData(response);
        })

    return dataPromise;
}

async function fetchProjectEventsRes(projectId) {
    const responsePromise = fetch(`${consts.host}/calendar/${projectId}/events`, {
        headers: consts.standardHeaders,
        method: 'GET'
    });

    return responsePromise;
}

/**
 * This function retrieves all the user's events: Google events and unexported events of all projects.
 * @param {*} projectId 
 * @returns 
 */
async function fetchAllEventsData() {
    let dataPromise = fetchAllEventsRes()
        .then(response => {
            return apiUtils.getResData(response);
        })

    return dataPromise;
}

async function fetchAllEventsRes() {
    const responsePromise = fetch(`${consts.host}/calendar/events`, {
        headers: consts.standardHeaders,
        method: 'GET'
    });

    return responsePromise;
}

async function updateEvent(event, fieldsToUpdate) {
    const body = {
        event: event,
        fieldsToUpdate: fieldsToUpdate
    }

    const responsePromise = await fetch(`http://localhost:3001/api/calendar/events`, {
        headers: consts.standardHeaders,
        method: 'PATCH',
        body: JSON.stringify(body)
    });

    return responsePromise;
}

async function deleteEvent(event) {
    const body = {
        event: event
    };

    const responsePromise = fetch(`${consts.host}/calendar/events`, {
        headers: consts.standardHeaders,
        method: 'DELETE',
        body: JSON.stringify(body)
    });

    return responsePromise;
}

module.exports = {
    validStatusArr_fetchGoogleEvents: validStatusArr_fetchGoogleEvents,
    validStatusArr_fetchUnsyncedGoogleEvents: validStatusArr_fetchUnsyncedGoogleEvents,
    validStatusArr_fetchAllProjectEvents: validStatusArr_fetchAllProjectEvents,
    validStatusArr_fetchProjectEvents: validStatusArr_fetchProjectEvents,
    validStatusArr_fetchAllEvents: validStatusArr_fetchAllEvents,
    validStatusArr_updateEvent: validStatusArr_updateEvent,
    validStatusArr_deleteEvent: validStatusArr_deleteEvent,

    fetchGoogleEventsData: fetchGoogleEventsData,
    fetchAllEventsData: fetchAllEventsData,
    fetchAllProjectEventsData: fetchAllProjectEventsData,
    fetchUnsyncedGoogleEventsData: fetchUnsyncedGoogleEventsData,
    fetchProjectEventsData: fetchProjectEventsData,
    updateEvent: updateEvent,
    deleteEvent: deleteEvent,
}