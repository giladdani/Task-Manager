const consts = require('./consts.js')
const apiUtils = require('./APIUtils.js')

const basicValidStatus = [200];
const fetchPendingProjectsValidStatusArr = basicValidStatus;
const approvePendingValidStatusArr = basicValidStatus;
const fetchProjectsValidStatusArr = basicValidStatus;
const deleteProjectValidStatusArr = basicValidStatus;
const exportProjectValidStatusArr = basicValidStatus;
const createSharedProjectValidStatusArr = basicValidStatus;
const createIndividualProjectValidStatusArr = basicValidStatus;

async function fetchPendingProjectsData() {
    console.log(`[ProjectsAPI - fetchPendingProjectsData] Fetching pending projects data`);

    let dataPromise = fetchPendingProjectsRes()
        .then(response => {
            return apiUtils.getResData(response);
        })

    console.log(`[ProjectsAPI - fetchPendingProjectsData] Returning promise.`);

    return dataPromise;
}

async function fetchPendingProjectsRes() {
    const response = fetch(`${consts.host}/projects/pending`, {
        headers: consts.standardHeaders,
        method: 'GET',
    });

    return response;
}

async function approvePendingProject(project) {
    const body = {
        project: project,
    };

    const responsePromise = fetch(`${consts.host}/projects/shared/approved`, {
        headers: consts.standardHeaders,
        method: 'POST',
        body: JSON.stringify(body),
    });

    return responsePromise;
}

const fetchProjectsData = async () => {
    console.log(`[ProjectsAPI - fetchProjectsData] Fetching projects data`);

    let dataPromise = fetchProjectsRes()
        .then(response => {
            return apiUtils.getResData(response);
        })

    console.log(`[ProjectsAPI - fetchProjectsData] Returning promise.`);

    return dataPromise;
}

const fetchProjectsRes = async () => {
    console.log(`[ProjectsAPI - fetchProjectsRes] Fetching projects response.`);

    const response = fetch(`${consts.host}/projects`, {
        headers: consts.standardHeaders,
        method: 'GET'
    });

    console.log(`[ProjectsAPI - fetchProjectsRes] Returning promise.`);

    return response;
}

const deleteProject = async (project) => {
    console.log(`[ProjectsAPI - deleteProject] Deleting project ${project.title}. Project ID: ${project.id}`);

    const response = fetch(`${consts.host}/projects/${project.id}`, {
        headers: consts.standardHeaders,
        method: 'DELETE',
    });

    console.log(`[ProjectsAPI - deleteProject] Request sent, returning promise.`);

    return response;
}

const exportProject = async (project) => {
    console.log(`[ProjectsAPI - exportProject] Exporting project ${project.title}. Project ID: ${project.id}`);

    const responsePromise = fetch(`${consts.host}/projects/export/${project.id}`, {
        headers: consts.standardHeaders,
        method: 'POST',
    });

    console.log(`[ProjectsAPI - exportProject] Sent request, returning promise.`);

    return responsePromise;
}

const createSharedProject = async (body) => {
    console.log(`[ProjectsAPI - createSharedProject] Creating shared project ${body.projectTitle}.`);

    const responsePromise = fetch('http://localhost:3001/api/projects/shared', {
        headers: consts.standardHeaders,
        method: 'POST',
        body: JSON.stringify(body),
    });

    return responsePromise;
}

const createIndividualProject = async (body) => {
    console.log(`[ProjectsAPI - createSharedProject] Creating shared project ${body.projectTitle}.`);

    const response = fetch('http://localhost:3001/api/projects', {
        headers: consts.standardHeaders,
        method: 'POST',
        body: JSON.stringify(body),
    });

    return response;
}

module.exports = {
    fetchPendingProjectsValidStatusArr: fetchPendingProjectsValidStatusArr,
    approvePendingValidStatusArr: approvePendingValidStatusArr,
    fetchProjectsValidStatusArr: fetchProjectsValidStatusArr,
    deleteProjectValidStatusArr: deleteProjectValidStatusArr,
    exportProjectValidStatusArr: exportProjectValidStatusArr,
    createSharedProjectValidStatusArr: createSharedProjectValidStatusArr,
    createIndividualProjectValidStatusArr: createIndividualProjectValidStatusArr,

    fetchPendingProjectsData: fetchPendingProjectsData,
    fetchPendingProjectsRes: fetchPendingProjectsRes,
    approvePendingProject: approvePendingProject,
    fetchProjectsData: fetchProjectsData,
    fetchProjectsRes: fetchProjectsRes,
    deleteProject: deleteProject,
    exportProject: exportProject,
    createSharedProject: createSharedProject,
    createIndividualProject: createIndividualProject,
}