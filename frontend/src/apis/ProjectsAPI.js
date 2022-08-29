const consts = require('./consts.js')
const apiUtils = require('./APIUtils.js')

const basicValidStatus = [200];
const validStatusArr_fetchPendingProjects = basicValidStatus;
const validStatusArr_approvePending = basicValidStatus;
const validStatusArr_fetchProjects = basicValidStatus;
const validStatusArr_patchProject = basicValidStatus;
const validStatusArr_deleteProject = basicValidStatus;
const validStatusArr_exportProject = basicValidStatus;
const validStatusArr_createSharedProject = basicValidStatus;
const validStatusArr_createIndividualProject = basicValidStatus;
const validStatusArr_rescheduleProjectEvent = basicValidStatus;


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

const patchProject = async (patchFields, projectId) => {
    const body = patchFields;

    const responsePromise = fetch(`${consts.fullRouteProjects}/${projectId}`, {
        headers: consts.standardHeaders,
        method: 'PATCH',
        body: JSON.stringify(body)
    });

    return responsePromise;
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

async function getRescheduledProjectEventsData(event) {
    let dataPromise = getRescheduledProjectEventsRes(event)
        .then(response => {
            return apiUtils.getResData(response);
        })

    return dataPromise;
}

async function getRescheduledProjectEventsRes(event) {
    const body = {
        event: event,
    };

    const responsePromise = fetch(`${consts.host}/projects/events/reschedule`, {
        headers: consts.standardHeaders,
        method: 'PATCH',
        body: JSON.stringify(body)
    });

    return responsePromise;
}

module.exports = {
    fetchPendingProjectsValidStatusArr: validStatusArr_fetchPendingProjects,
    approvePendingValidStatusArr: validStatusArr_approvePending,
    fetchProjectsValidStatusArr: validStatusArr_fetchProjects,
    validStatusArr_patchProject: validStatusArr_patchProject,
    deleteProjectValidStatusArr: validStatusArr_deleteProject,
    exportProjectValidStatusArr: validStatusArr_exportProject,
    createSharedProjectValidStatusArr: validStatusArr_createSharedProject,
    createIndividualProjectValidStatusArr: validStatusArr_createIndividualProject,
    validStatusArr_rescheduleProjectEvent: validStatusArr_rescheduleProjectEvent,

    fetchPendingProjectsData: fetchPendingProjectsData,
    fetchPendingProjectsRes: fetchPendingProjectsRes,
    approvePendingProject: approvePendingProject,
    fetchProjectsData: fetchProjectsData,
    fetchProjectsRes: fetchProjectsRes,
    patchProject: patchProject,
    deleteProject: deleteProject,
    exportProject: exportProject,
    createSharedProject: createSharedProject,
    createIndividualProject: createIndividualProject,
    getRescheduledProjectEventsData: getRescheduledProjectEventsData,
    getRescheduledProjectEventsRes: getRescheduledProjectEventsRes,
}