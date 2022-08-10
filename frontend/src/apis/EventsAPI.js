async function fetchGoogleEvents() {
    let res = null;
    let error = null;

    try {
        const response = await fetch('http://localhost:3001/api/calendar/events/google', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'access_token': sessionStorage.getItem('access_token'),
            },
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
        const response = await fetch('http://localhost:3001/api/calendar/events/google/unsynced', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'access_token': sessionStorage.getItem('access_token'),
            },
            method: 'GET'
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

async function fetchProjectEvents() {
    let res = null;
    let error = null;

    try {
        const response = await fetch('http://localhost:3001/api/projects/events', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'access_token': sessionStorage.getItem('access_token'),
            },
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

module.exports = {
    fetchGoogleEvents: fetchGoogleEvents,
    fetchProjectEvents: fetchProjectEvents,
    fetchUnsyncedGoogleEvents: fetchUnsyncedGoogleEvents,
}