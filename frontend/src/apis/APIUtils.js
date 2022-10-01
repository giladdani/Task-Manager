const generalUtils = require("../utils/general-utils");

function isValidStatus(response, validStatusArr) {
    if (!response) {
        return false;
    }

    if (!validStatusArr || validStatusArr.length == 0) {
        return response.status === 200;
    }

    return validStatusArr.includes(response.status);
}

function verifyAuthorized(response) {
    if (response.status === 401) {
        alert("Must login again!")
        generalUtils.handleLogout();
    }
}

async function getResData(response) {
    if (!response) {
        return null;
    }
    
    const dataPromise = response.json();

    return dataPromise;
}

module.exports = {
    isValidStatus: isValidStatus,
    getResData: getResData,
    verifyAuthorized: verifyAuthorized,
}