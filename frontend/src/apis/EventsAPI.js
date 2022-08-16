const consts = require('./consts.js')

async function fetchGoogleEvents() {
    let res = null;
    let error = null;

    try {
        const response = await fetch(`${consts.host}/calendar/events/google`, {
            headers: consts.standardHeaders,
            method: 'GET'
        });

        if (response.status !== 200) throw new Error('Error while fetching events');
        const data = await response.json();
        res = data;
    }
    catch (err) {
        console.error(err);
        error = err;
    }

    return [res, error];
}

async function fetchUnsyncedGoogleEvents() {
    let res = null;
    let error = null;

    try {
        const response = await fetch(`${consts.host}/calendar/events/google/unsynced`, {
            headers: consts.standardHeaders,
            method: 'GET',
        });

        if (response.status !== 200) throw new Error('Error while fetching unsynced events');
        const data = await response.json();
        res = data;
    }
    catch (err) {
        console.error(err);
        error = err;
    }

    return [res, error];
}

async function fetchAllProjectEvents() {
    let res = null;
    let error = null;

    try {
        const response = await fetch(`${consts.host}/projects/events`, {
            headers: consts.standardHeaders,
            method: 'GET'
        });

        if (response.status !== 200) throw new Error('Error while fetching events');
        const data = await response.json();
        res = data;
    }
    catch (err) {
        console.error(err);
        error = err;
    }

    return [res, error];
}

/**
 * Fetches the events of a specific project, identified by its ID field.
 * @param {*} projectId 
 * @returns 
 */
async function fetchProjectEvents(projectId) {
    let res = null;
    let error = null;

    try {
        const response = await fetch(`${consts.host}/calendar/${projectId}/events`, {
            headers: consts.standardHeaders,
            method: 'GET'
        });

        if (response.status !== 200) {
            throw new Error('Error while fetching specific project events');
        }

        const data = await response.json();
        res = data;
    }
    catch (err) {
        console.error(err);
        error = err;
    }

    return [res, error];
}

/**
 * This function retrieves all the user's events: Google events and unexported events of all projects.
 * @param {*} projectId 
 * @returns 
 */
async function fetchAllEvents() {
    let res = null;
    let error = null;

    try {
        const response = await fetch(`${consts.host}/calendar/events`, {
            headers: consts.standardHeaders,
            method: 'GET'
        });

        if (response.status !== 200) {
            throw new Error('Error while fetching specific project events');
        }

        const data = await response.json();
        res = data;
    }
    catch (err) {
        console.error(err);
        error = err;
    }

    return [res, error];
}

module.exports = {
    fetchGoogleEvents: fetchGoogleEvents,
	fetchAllEvents: fetchAllEvents,
    fetchAllProjectEvents: fetchAllProjectEvents,
    fetchUnsyncedGoogleEvents: fetchUnsyncedGoogleEvents,
    fetchProjectEvents: fetchProjectEvents,
}