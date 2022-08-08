
async function fetchPendingProjects() {
    let res = null;
    let error = null;

    try {
        const response = await fetch('http://localhost:3001/api/projects/pending', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'access_token': sessionStorage.getItem('access_token'),
            },
            method: 'GET',
        });

        if (response.status !== 200) {
            let errorMsg = await response.text();
            throw new Error('Invalid parameters for the project:\n\n' + errorMsg)
        }

        const data = await response.json();

        res = data;
    } catch (err) {
        console.error(err);
        error = err;
    }

    return [res, error];
}

async function approvePendingProject(project, allEvents) {
    let res = null;
    let error = null;

    try {
        const body = {
            project: project,
            allEvents: allEvents,
        };

        const response = await fetch('http://localhost:3001/api/projects/shared/approved', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'access_token': sessionStorage.getItem('access_token'),
            },
            method: 'POST',
            body: JSON.stringify(body),
        });

        if (response.status !== 200) {
            let errorMsg = await response.text();
            throw errorMsg;
        }
    }
    catch (err) {
        console.error(err);
        error = err;
    }

    return [res, error];
}


module.exports = {
    fetchPendingProjects: fetchPendingProjects,
    approvePendingProject: approvePendingProject,
}