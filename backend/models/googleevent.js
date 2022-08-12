const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

/**
 * The purpose of this schema is to capture Google event properties, as described by the Google Event resource.
 * https://developers.google.com/calendar/api/v3/reference/events
 * Some fields are added for our sake, such as backgroundColor and foregroundColor, as saved by Google.
 */
const googleEventSchema = new Schema({
    summary: String,
    start: {
        date: String,
        dateTime: String,
    },
    end: {
        date: String,
        dateTime: String,
    },
    backgroundColor: String,
    foregroundColor: String,
    id: String,
    calendarId: String,
    email: String,
    fetchedByUser: Boolean,
    isGoogleEvent: Boolean,
    extendedProperties: {
        private: {
            fullCalendarEventId: String,
            fullCalendarProjectId: String,
        }
    },
})

const GoogleEvent = mongoose.model('GoogleEvent', googleEventSchema);
module.exports = GoogleEvent;