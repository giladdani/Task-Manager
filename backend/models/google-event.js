const mongoose = require("mongoose");
const consts = require("../utils/consts");
const Schema = mongoose.Schema;

/**
 * The purpose of this schema is to capture Google event properties, as described by the Google Event resource.
 * https://developers.google.com/calendar/api/v3/reference/events
 * Some fields are added for our sake, such as backgroundColor and foregroundColor, as saved by Google.
 */
const googleEventSchema = new Schema({
    // Google fields - fields that exist in the event resource, unchanged to match Google.
    summary: String,
    start: {
        date: String,
        dateTime: String,
    },
    end: {
        date: String,
        dateTime: String,
    },

    id: String,
    status: String,
    extendedProperties: {
        private: {
            fullCalendarEventId: String,
            [consts.gFieldName_SharedEventId]: String,
            fullCalendarProjectId: String,

            tags: {
                
            },

            // // // While these are meant to be arrays, Google accepts only Strings in these fields.
            // // // So we stringify the arrays, and then must parse them.
            // // independentTagIdsString: String,
            // // projectTagIdsString: String,
            // // ignoredProjectTagIdsString: String,


            // ! ALT - saving as arrays
            /** The Google event resource demands that all fields in extendedProperties will be String only, and does not allow arrays.
             * We differ here from the resource representation for our convenience.
             * Instead of constantly splitting the strings back into arrays or searching them via regex, 
             * we perform a one-time modification when first fetching and inserting the events.
             * We differ from the representation here for comfort and ease of use everywhere else in the application.
             */
            independentTagIds: [String],
            projectTagIds: [String],
            ignoredProjectTagIds: [String],
        }
    },

    // Private fields - fields we add for our purposes when fetching events, before saving them in our DB.
    calendarId: String,
    backgroundColor: String,
    foregroundColor: String,
    email: String,
    fetchedByUser: Boolean,
    isGoogleEvent: Boolean,
    accessRole: String,
})


/**
 * For reference, when we export our events to Google, we do so in this manner.
 * This will help keep track in one place of how we choose to save the fields.
 */
const exportedEventToGoogle = {
    extendedProperties: {
        private: {
            fullCalendarEventId: String,
            fullCalendarProjectId: String,

            // While these are meant to be arrays, Google accepts only Strings in these fields.
            // So we stringify the arrays, and then must parse them.
            [consts.gFieldName_ProjTagIds]: String,
            [consts.gFieldName_IgnoredProjectTagIds]: String,
            [consts.gFieldName_IndTagIds]: String,
        }
    },
}

const GoogleEvent = mongoose.model('GoogleEvent', googleEventSchema);
module.exports = GoogleEvent;