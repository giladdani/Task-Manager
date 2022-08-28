const host = 'http://localhost:3001/api';

const routeEvents = '/events';
const fullRouteEvents = `${host}${routeEvents}`

const routeTags = '/tags';
const fullRouteTags = `${host}${routeTags}`

const routeProjects = '/projects';
const fullRouteProjects = `${host}${routeProjects}`


const emailHeader = 'user_email';

const standardHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'access_token': sessionStorage.getItem('access_token'),
    [emailHeader]: sessionStorage.getItem('user_email'),
}

module.exports = {
    host: host,
    routeEvents: routeEvents,
    fullRouteEvents: fullRouteEvents,
    routeTags: routeTags,
    fullRouteTags: fullRouteTags,
    routeProjects: routeProjects,
    fullRouteProjects: fullRouteProjects,
    emailHeader: emailHeader,
    standardHeaders: standardHeaders,
}