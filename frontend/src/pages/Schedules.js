import React from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { ThreeDots } from 'react-loader-spinner'
import EventDialog from '../components/EventDialog'
import Checkbox from '@mui/material/Checkbox'
const ConstraintsAPI = require('../apis/ConstraintsAPI.js')
const EventsAPI = require('../apis/EventsAPI.js')

export class Schedules extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentEvents: [],  // TODO: delete? do we use this?
            isLoading: false,
            isDialogOpen: false,
            selectedEvent: { title: "" },
        }
    }

    async componentDidMount() {
        this.setState({ isLoading: true });
        let calendarRef = React.createRef();    // we need this to be able to add events
        this.setState({ calendarRef: calendarRef });

        let googlePromise = EventsAPI.fetchGoogleEvents()
            .then(([events, errGoogle]) => {
                this.addEventsToScheduleGoogle(events);
            })

        let constraintsPromise = ConstraintsAPI.fetchConstraints()
            .then(constraintEvents => {
                constraintEvents.forEach(constraint => { constraint.editable = false })
                this.addEventsToScheduleFullCalendar(constraintEvents);
            })

        let projectPromise = EventsAPI.fetchAllProjectEvents()
            .then(([projectEvents, errProject]) => {
                this.addEventsToScheduleFullCalendar(projectEvents);
            })

        Promise.all([googlePromise, constraintsPromise, projectPromise])
            .then(responses => {
                this.setState({ isLoading: false })

                /** 
                 * TODO:
                 * I want to remove this so that each page can independently request all events from the server,
                 * and not rely on passing through the Schedules page.
                 */
                let calendarApi = this.state.calendarRef.current.getApi();
                const allEvents = calendarApi.getEvents();
                this.props.setEvents(allEvents);
            })

        this.setState({ fetchedInitialEvents: true });
        let intervalInfo = window.setInterval(this.updateUnsyncedEvents, 5000);
        this.setState({ interval: intervalInfo });
        console.log(`[componentDidMount: Schedules] Set up interval ${this.state.interval}`)
    }

    async componentWillUnmount() {
        console.log(`[componentWillUnmount: Schedules] Clearing interval ${this.state.interval}`)
        clearInterval(this.state.interval);
    }

    updateUnsyncedEvents = async () => {
        // TODO: add check if unmounted like in ProjectsAccordion. Problem: this is class, accordion is function. Can't use same code.

        try {
            EventsAPI.fetchUnsyncedGoogleEvents()
                .then(([unsyncedEvents, error]) => {
                    try {
                        console.log(`Fetched ${unsyncedEvents.length} unsynced events.`)
                        let calendarApi = this.state.calendarRef.current.getApi();
                        for (const unsyncedEvent of unsyncedEvents) {
                            let fullCalendarEvent = calendarApi.getEventById(unsyncedEvent.id);
                            if (!fullCalendarEvent) {
                                if (unsyncedEvent.status !== "cancelled") {
                                    let fcEvent = this.createFCEventFromGoogleEvent(unsyncedEvent);
                                    if (fcEvent) {
                                        calendarApi.addEvent(fcEvent);
                                    }
                                }
                            } else if (unsyncedEvent.status === "cancelled") {
                                fullCalendarEvent.remove();
                            } else {
                                this.updateGoogleEvent(unsyncedEvent, fullCalendarEvent);
                            }
                        }
                    } catch (err) {
                        console.log(`[updateUnsyncedEvents] Error in THEN part:\n${err}`)
                    }
                })
        }
        catch (err) {
            console.log(`[updateUnsyncedEvents] Error:\n${err}`);
        }
    }

    updateGoogleEvent = (googleEvent, fullCalendarEvent) => {
        let start = googleEvent.start.dateTime;
        let end = googleEvent.end.dateTime;

        /**
         * TODO:
         * If a Google event is all day, I think the fields aren't "dateTime" but rather "date".
         * In which case our code so far doesn't detect it.
         * Our app in general doesn't handle full day events.
         */
        if (!start || !end) {
            return;
        }

        fullCalendarEvent.setDates(start, end);
        fullCalendarEvent.setProp("title", googleEvent.summary);
        fullCalendarEvent.setProp("backgroundColor", googleEvent.backgroundColor);
        fullCalendarEvent.setProp("borderColor", googleEvent.foregroundColor);
    }

    handleEventDragged = (eventInfo) => {
        const fieldsToUpdate = {
            start: eventInfo.event.start,
            end: eventInfo.event.end
        }
        this.updateEvent(eventInfo.event, fieldsToUpdate);
    }

    updateEvent = async (event, fieldsToUpdate) => {
        const body = {
            event: event,
            fieldsToUpdate: fieldsToUpdate
        }
        try {
            const response = await fetch(`http://localhost:3001/api/calendar/events`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token')
                },
                method: 'PATCH',
                body: JSON.stringify(body)
            });

            if (response.status !== 200) throw new Error('Error while updating events');
            return response;
        }
        catch (err) {
            console.error(err);
        }
    }

    handleEventEditOnDialog = async (fieldsToUpdate) => {
        await this.updateEvent(this.state.selectedEvent, fieldsToUpdate);
        this.toggleDialog(false);
        let event = this.state.selectedEvent;
        event.setProp("title", fieldsToUpdate.title);
        event.setStart(fieldsToUpdate.start);
        event.setEnd(fieldsToUpdate.end);
    }

    addEventsToScheduleFullCalendar = (events) => {
        try {
            let calendarApi = this.state.calendarRef.current.getApi();

            events.forEach(event => {
                event.borderColor = 'black';
                calendarApi.addEvent(event)
            });
        } catch (err) {
            console.log(`[addEventsToScheduleFullCalendar] Error:\n${err}`);
        }
    }

    addEventsToScheduleGoogle = (events) => {
        try {
            let calendarApi = this.state.calendarRef.current.getApi();
            let eventsSource = [];
            for (const event of events) {
                let fcEvent = this.createFCEventFromGoogleEvent(event);
                if (fcEvent) {
                    eventsSource.push(fcEvent)
                }
            }

            calendarApi.addEventSource(eventsSource);
        } catch (err) {
            console.log(`[addEventsToScheduleGoogle] Error:\n${err}`);
        }
    }

    createFCEventFromGoogleEvent = (event) => {
        let fcEvent = null;

        // TODO: some google events are full days, so they don't have hours. The code doesn't yet consider full-day events
        if (!event || !event.start || !event.end) {
            return fcEvent;
        }

        const fullCalendarProjectId = this.fetchProjectIdFromGoogleEvent(event);
        const localEventId = this.fetchAppEventIdFromGoogleEvent(event);
        const googleEventId = event.id;

        fcEvent = {
            id: localEventId,
            googleEventId: googleEventId,
            googleCalendarId: event.calendarId,
            editable: true,
            title: event.summary,
            start: event.start.dateTime,
            end: event.end.dateTime,
            allDay: false, // TODO: change based on Google?
            projectId: fullCalendarProjectId,
            borderColor: event.foregroundColor,
            backgroundColor: event.backgroundColor,
        }

        return fcEvent;
    }

    fetchProjectIdFromGoogleEvent = (googleEvent) => {
        if (!googleEvent.extendedProperties) {
            return null;
        }

        if (!googleEvent.extendedProperties.private) {
            return null;
        }

        return googleEvent.extendedProperties.private.fullCalendarProjectId;
    }

    /**
     * TODO:
     * Perhaps we need to give up the local IDs, and stay only with Google IDs?
     */
    /**
     * 
     * @param {*} googleEvent 
     * @returns the local ID given to the event by the application. 
     * If no such ID exists (e.g. if it's solely a Google event), the Google ID is returned.
     */
    fetchAppEventIdFromGoogleEvent = (googleEvent) => {
        if (!googleEvent) {
            return null;
        }

        let id = googleEvent.id;
        if (!googleEvent.extendedProperties) {
            return id;
        }

        if (!googleEvent.extendedProperties.private) {
            return id;
        }

        return googleEvent.extendedProperties.private.fullCalendarEventID;
    }

    handleDateSelect = (selectInfo) => {
        let title = prompt('Please enter a new title for your event')
        let calendarApi = selectInfo.view.calendar;
        calendarApi.unselect() // clear date selection
        if (title) {
            calendarApi.addEvent({
                // id: ?,
                title,
                start: selectInfo.startStr,
                end: selectInfo.endStr,
                allDay: selectInfo.allDay
            })
        }
    }

    toggleDialog = (isOpen) => {
        this.setState({ isDialogOpen: isOpen });
    }

    isConstraintEvent = (event) => {
        if (!event) {
            return false;
        }
        if (!event.extendedProps || !event.extendedProps.isConstraint) {
            return false;
        }

        return event.extendedProps.isConstraint;
    }

    isUnexportedProjectEvent = (event) => {
        if (!event) {
            return false;
        }

        if (!event.extendedProps || !event.extendedProps.unexportedEvent) {
            return false;
        }

        return event.extendedProps.unexportedEvent;
    }

    updateUnexportedProjectEvent(event) {
        console.log(`Updating unexported project event: ${event.title}`);
    }

    handleEvents = (events) => {
        this.setState({ currentEvents: events });
    }

    renderEventContent = (eventInfo) => {
        return (
            <div>
                <b>{eventInfo.timeText}</b>
                <i>{eventInfo.event.title}</i>
            </div>
        )
    }

    updateConstraintDisplayValue = (displayType) => {
        const calendarApi = this.state.calendarRef.current.getApi();
        const allEvents = calendarApi.getEvents();

        allEvents.forEach(event => {
            if (event.extendedProps.isConstraint !== undefined && event.extendedProps.isConstraint === true) {
                event.setProp("display", displayType);
            }
        })
    }

    setShowConstraintsValue = (newValue) => {
        let displayType = null;

        if (newValue === true) {
            displayType = "auto";
        } else {
            displayType = "none";
        }

        this.updateConstraintDisplayValue(displayType);
    }

    insertGeneratedEventsToGoogleCalendar = async (events, googleCalendarID) => {
        try {
            const body = {
                events: events,
                googleCalendarId: googleCalendarID,
            };

            const response = await fetch(`http://localhost:3001/api/calendar/events/generated`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token')
                },
                method: 'POST',
                body: JSON.stringify(body)
            });

            if (response.status !== 200) throw new Error('Error while inserting events to Google calendar');
            const resJson = await response.json();
            return resJson;
        }
        catch (err) {
            console.error(err);
        }
    }

    handleEventClick = (clickInfo) => {
        this.setState({ selectedEvent: clickInfo.event });
        this.toggleDialog(true);
    }

    handleEventDeleteOnDialog = async (event) => {
        // We want to edit constraints only from the constraints page 
        // because at the moment we're unsure how to handle editing it with recurring events.
        if (this.isConstraintEvent(event)) {
            return;
        }

        try {
            const body = {
                event: event
            };

            const response = await fetch(`http://localhost:3001/api/calendar/events`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token')
                },
                method: 'DELETE',
                body: JSON.stringify(body)
            });

            if (response.status !== 200) {
                throw new Error('Error while fetching events');
            }

            console.log(`Success in deleting event ${event.title}`);
            event.remove();
            this.toggleDialog(false);
        }
        catch (err) {
            console.error(err);
        }
    }

    handleEventReschedule = async (event) => {
        let rescheduledEvents = await this.fetchRescheduledEvents(event);

        return rescheduledEvents;
    }

    fetchRescheduledEvents = async (event) => {
        let res = null;
        try {
            let calendarApi = this.state.calendarRef.current.getApi();
            const allEvents = calendarApi.getEvents();

            const body = {
                event: event,
                allEvents: allEvents,
            };

            const response = await fetch(`http://localhost:3001/api/projects/events/reschedule`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token')
                },
                method: 'PATCH',
                body: JSON.stringify(body)
            });

            if (response.status !== 200) {
                throw new Error('Error while fetching events');
            }

            const data = await response.json();
            res = data;
        }
        catch (err) {
            console.error(err);
        }

        return res;
    }

    handleConfirmRescheduling = async (eventToReschedule, rescheduledEventsArr) => {
        if (rescheduledEventsArr.length === 1) {
            const newEvent = rescheduledEventsArr[0];

            const fieldsToUpdate = {
                title: newEvent.title,
                start: newEvent.start,
                end: newEvent.end,
            }

            this.handleEventEditOnDialog(fieldsToUpdate);
        } else {
            // TODO:
            // Delete event to reschedule
            // Insert rescheduled events
        }
    }

    setShowSharedCalendars = async () => {

    }

    shareScheduleWithUser = async () => {

    }

    render() {
        return (
            <div>
                <div hidden={!this.state.isLoading}>
                    <h3>Loading your schedule</h3>
                    <ThreeDots color="#00BFFF" height={80} width={80} />
                </div>
                <div
                    id="schedule-container"
                >
                    <div>
                        <label>Show Constraints</label>
                        <Checkbox onChange={(newValue) => { this.setShowConstraintsValue(newValue.target.checked); }}></Checkbox>
                    </div>
                    <div>
                        <label>Show Shared Calendars</label>
                        <Checkbox onChange={(newValue) => { this.setShowSharedCalendars(newValue.target.checked); }}></Checkbox>
                    </div>
                    <div>
                        <label>Share schedule with user (uneditable!): </label>
                        <input type="text" onChange={(newValue) => { this.shareScheduleWithUser(newValue.target.value) }}></input>
                    </div>
                    <FullCalendar
                        plugins={[timeGridPlugin, interactionPlugin]}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'timeGridWeek,timeGridDay'
                        }}
                        initialView='timeGridWeek'
                        allDaySlot={false}
                        height="auto"
                        // height="100%"
                        selectable={true}
                        editable={true}
                        eventContent={this.renderEventContent}
                        select={this.handleDateSelect}
                        eventClick={this.handleEventClick}
                        eventsSet={this.handleEvents} // called after events are initialized/added/changed/removed
                        eventDrop={this.handleEventDragged}
                        ref={this.state.calendarRef}
                        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                        slotLabelFormat={[{ hour: "2-digit", minute: "2-digit", meridiem: false, hour12: false }]}
                        locale='en-GB'
                    />

                    <EventDialog
                        event={this.state.selectedEvent}
                        isOpen={this.state.isDialogOpen}
                        toggleOpen={this.toggleDialog}
                        onEventEdit={this.handleEventEditOnDialog}
                        onEventDelete={this.handleEventDeleteOnDialog}
                        onEventReschedule={this.handleEventReschedule}
                        handleConfirmRescheduling={this.handleConfirmRescheduling}
                    />
                </div>
            </div>
        )
    }
}