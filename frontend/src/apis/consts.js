const host = 'http://localhost:3001/api';
const routeEvents = '/events';
const fullRouteEvents = `${host}${routeEvents}`
const routeProjects = '/projects';
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
    routeProjects: routeProjects,
    emailHeader: emailHeader,
    standardHeaders: standardHeaders,
}