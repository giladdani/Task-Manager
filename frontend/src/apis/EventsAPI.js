const consts = require('./consts.js')
const apiUtils = require('./APIUtils.js');
const APIUtils = require('./APIUtils.js');

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
    const responsePromise = fetch(`${consts.fullRouteEvents}/google`, {
        headers: consts.standardHeaders,
        method: 'GET'
    });

    return responsePromise
}

async function fetchUnsyncedGoogleEventsData() {
    let dataPromise = fetchUnsyncedGoogleEventsRes()
        .then(response => {
            APIUtils.verifyAuthorized(response);
            console.log('I made it through authorization! :D');
            if (APIUtils.isValidStatus(response, validStatusArr_fetchUnsyncedGoogleEvents)) {
                return apiUtils.getResData(response);
            } else {
                return null;
            }
        })

    return dataPromise;
}

async function fetchUnsyncedGoogleEventsRes() {
    const responsePromise = fetch(`${consts.fullRouteEvents}/google/unsynced`, {
        headers: consts.standardHeaders,
        method: 'GET',
    });

    return responsePromise;
}

async function fetchAllUnexportedEventsData() {
    let dataPromise = fetchAllUnexportedEventsRes()
        .then(response => {
            return apiUtils.getResData(response);
        })

    return dataPromise;
}

async function fetchAllUnexportedEventsRes() {
    const responsePromise = fetch(`${consts.fullRouteEvents}/unexported`, {
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
    const responsePromise = fetch(`${consts.fullRouteEvents}/project/${projectId}`, {
        headers: consts.standardHeaders,
        method: 'GET'
    });

    return responsePromise;
}

async function updateEvent(event, fieldsToUpdate) {
    const body = fieldsToUpdate;

    const responsePromise = fetch(`${consts.fullRouteEvents}/${event.id}`, {
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

    const responsePromise = fetch(`${consts.fullRouteEvents}`, {
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
    fetchAllProjectEventsData: fetchAllUnexportedEventsData,
    fetchUnsyncedGoogleEventsData: fetchUnsyncedGoogleEventsData,
    fetchProjectEventsData: fetchProjectEventsData,
    updateEvent: updateEvent,
    deleteEvent: deleteEvent,
}