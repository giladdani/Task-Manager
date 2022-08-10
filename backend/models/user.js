const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * Calendars list and events list are separated sync token. 
 * All the calendars have their own sync token.
 * Then the events collection of each calendar has its own sync token.
 * So we maintain two objects:
 *  *   One is the sync token for the calendars.
 *  *   One is an array that maps each calendar ID to its sync token.
 * Take an example calendar called "Calendar 1".
 * If you change events in Calendar 1 without changing anything about the calendar itself, 
 * the sync token of the events collection of that calendar is updated, but the calendars sync token isn't.
 * If you change something about the calendar itself (such as its name), then the sync token for the calendars is updated, 
 * but not the sync token for the events collection of that calendar.
 */

const userSchema = new Schema({
    email: String,
    calendarsSyncToken: String,
    eventListCalendarId2SyncToken: [{
        key: String,
        value: String,
    }],
})

const User = mongoose.model('User', userSchema);
module.exports = User;