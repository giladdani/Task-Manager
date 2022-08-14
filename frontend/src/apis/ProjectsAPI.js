const consts = require('./consts.js')

async function fetchPendingProjects() {
    let res = null;
    let error = null;

    try {
        const response = await fetch(`${consts.host}/projects/pending`, {
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

async function approvePendingProject(project) {
    let res = null;
    let error = null;

    try {
        const body = {
            project: project,
        };

        const response = await fetch(`${consts.host}/projects/shared/approved`, {
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

const fetchProjects = async () => {
    let res = null;
    let error = null;

    try {

        const response = await fetch(`${consts.host}/projects`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'access_token': sessionStorage.getItem("access_token")
            },
            method: 'GET'
        });

        if (response.status !== 200) throw new Error('Error while fetching projects')
        const data = await response.json();
        res = data;
    }
    catch (err) {
        console.error(err);
        error = err;
    }

    return [res, error];
}

const deleteProject = async (project) => {
    console.log(`Deleting project ${project.title}. Project ID: ${project.id}`);
    let res = null;
    let error = null;

    try {
        const response = await fetch(`${consts.host}/projects/${project.id}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'access_token': sessionStorage.getItem('access_token'),
            },
            method: 'DELETE',
        });

        if (response.status !== 200) {
            throw new Error(`Failed to delete project ${project.title} (ID: ${project.id})`);
        }

        console.log(`Project ${project.title} (ID: ${project.id}) deleted`);

        res = response;
    }
    catch (err) {
        console.error(err);
        error = err
    }

    return [res, error];
}

const exportProject = async (project) => {
    let res = null;
    let error = null;
    console.log(`Exporting project ${project.title}. Project ID: ${project.id}`);

    try {
        const response = await fetch(`${consts.host}/projects/export/${project.id}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'access_token': sessionStorage.getItem('access_token'),
            },
            method: 'POST',
        });

        if (response.status !== 200) {
            throw new Error(`Failed to export project ${project.title} (ID: ${project.id})`);
        }

        console.log(`Project ${project.title} (ID: ${project.id}) exported to Google.`);
        res = response;
    }
    catch (err) {
        console.error(err);
        error = err;
    }

    return [res, error];
}


const createSharedProject = async (body) => {
    let res = null;
    let error = null;
    console.log(`[ProjectsAPI - createSharedProject] Creating shared project ${body.projectTitle}.`);

    try {
        const response = await fetch('http://localhost:3001/api/projects/shared', {
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
            throw new Error('[ProjectsAPI - createSharedProject] Invalid parameters for the project:\n\n' + errorMsg)
        }

        res = response;
    }
    catch (err) {
        console.error(err);
        error = err;
    }

    return [res, error];
}

const createIndividualProject = async (body) => {
    let res = null;
    let error = null;
    console.log(`[ProjectsAPI - createSharedProject] Creating shared project ${body.projectTitle}.`);

    try {
        const response = await fetch('http://localhost:3001/api/projects', {
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
            throw new Error('Invalid parameters for the project:\n\n' + errorMsg)
        }

        res = response;
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
    fetchProjects: fetchProjects,
    deleteProject: deleteProject,
    exportProject: exportProject,
    createSharedProject: createSharedProject,
    createIndividualProject: createIndividualProject,
}