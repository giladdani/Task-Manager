const host = 'http://localhost:3001/api';
const emailHeader = 'user_email';

const standardHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'access_token': sessionStorage.getItem('access_token'),
    [emailHeader]: sessionStorage.getItem('user_email'),
}

module.exports = {
    host: host,
    emailHeader: emailHeader,
    standardHeaders: standardHeaders,
}