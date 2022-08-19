function isValidStatus(response, validStatusArr) {
    if (!response) {
        return false;
    }

    if (!validStatusArr || validStatusArr.length == 0) {
        return response.status === 200;
    }

    return validStatusArr.includes(response.status);
}

async function getResData(response) {
    const dataPromise = response.json();

    return dataPromise;
}

module.exports = {
    isValidStatus: isValidStatus,
    getResData: getResData,
}