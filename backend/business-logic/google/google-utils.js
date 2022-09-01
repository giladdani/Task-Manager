const utils = require("../../utils/utils");

/**
 * Returns all calendar events, without regard to sync tokens.
 * @param {*} accessToken 
 * @param {*} calendarId 
 */
 async function getCalendarEvents(accessToken, calendarId, syncToken) {
    let gapi = utils.getGAPIClientCalendar(accessToken);
    const currDate = new Date();
    const timeMinDate = new Date(currDate).setMonth(currDate.getMonth() - 12);
    const timeMaxDate = new Date(currDate).setMonth(currDate.getMonth() + 12);
    let pageToken = null;
    let events = [];

    do {
        let params = {
            calendarId: calendarId,
            pageToken: pageToken,
            singleEvents: true,
        }

        if (syncToken) {
            params.syncToken = syncToken;
        } else {
            params.timeMin = (new Date(timeMinDate)).toISOString();
            // params.timeMax = (new Date(timeMaxDate)).toISOString();
        }

        const response = await gapi.events.list(params);
        events = events.concat(response.data.items);
        pageToken = response.data.nextPageToken;
    } while (pageToken);

    return events;
}

module.exports = {
    getCalendarEvents: getCalendarEvents,
}