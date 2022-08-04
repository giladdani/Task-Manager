import React from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { ThreeDots } from 'react-loader-spinner'
import EventDialog from '../components/EventDialog'
import Checkbox from '@mui/material/Checkbox';
const api = require('../api');


export class Schedules extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentEvents: [],  // TODO: delete? do we use this?
            isLoading: false,
            isDialogOpen: false,
            selectedEvent: { title: "" }
        }
    }

    calendarRef = React.createRef();    // we need this to be able to add events
    // calendarApi = this.calendarRef.current.getApi();

    async componentDidMount() {
        this.setState({ isLoading: true });
        const events = await this.fetchEventsGoogle();
        this.addEventsToScheduleGoogle(events);
        // add events to shared events object in App.js
        let calendarApi = this.calendarRef.current.getApi();

        // let constraintEvents = await this.fetchConstraints();
        let constraintEvents = await api.fetchConstraints();

        constraintEvents.forEach(constraint => { constraint.editable = false })
        this.addEventsToScheduleFullCalendar(constraintEvents);

        let projectEvents = await this.fetchProjectEvents();
        this.addEventsToScheduleFullCalendar(projectEvents);

        this.setState({ isLoading: false });

        const allEvents = calendarApi.getEvents();
        this.props.setEvents(allEvents);
    }

    /*

Moved to API file!
TODO: delete if all works well

    */
    // fetchConstraints = async () => {
    //     try {
    //         const response = await fetch('http://localhost:3001/api/constraints', {
    //             headers: {
    //                 'Accept': 'application/json',
    //                 'Content-Type': 'application/json',
    //                 'access_token': sessionStorage.getItem('access_token')
    //             },
    //             method: 'GET'
    //         });
    //         if (response.status !== 200) throw new Error('Error while fetching events');
    //         const data = await response.json();
    //         return data;
    //     }
    //     catch (err) {
    //         console.error(err);
    //     }
    // }

    fetchProjectEvents = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/projects/events', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token'),
                },
                method: 'GET'
            });

            if (response.status !== 200) throw new Error('Error while fetching events');
            const data = await response.json();
            return data;
        }
        catch (err) {
            console.error(err);
        }
    }

    fetchEventsGoogle = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/calendar/events/google', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token'),
                },
                method: 'GET'
            });

            if (response.status !== 200) throw new Error('Error while fetching events');
            const data = await response.json();
            return data;
        }
        catch (err) {
            console.error(err);
        }
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
        const res = await this.updateEvent(this.state.selectedEvent, fieldsToUpdate);
        this.toggleDialog(false);
        let event = this.state.selectedEvent;
        event.setProp("title", fieldsToUpdate.title);
        event.setStart(fieldsToUpdate.start);
        event.setEnd(fieldsToUpdate.end);
    }

    addEventsToScheduleFullCalendar = (events) => {
        let calendarApi = this.calendarRef.current.getApi();

        events.forEach(event => {
            calendarApi.addEvent(event)
        });
    }

    addEventsToScheduleGoogle = (events) => {
        let calendarApi = this.calendarRef.current.getApi();

        events.forEach(event => {
            const fullCalendarProjectId = this.fetchProjectIdFromGoogleEvent(event);
            const backgroundColor = this.fetchBackgroundColorFromGoogleEvent(event);
            const localEventId = this.fetchAppEventIdFromGoogleEvent(event);
            const googleEventId = event.id;

            calendarApi.addEvent(
                {
                    id: localEventId,
                    googleEventId: googleEventId,
                    googleCalendarId: event.calendarId,
                    editable: true,
                    title: event.summary,
                    start: event.start.dateTime,
                    end: event.end.dateTime,
                    allDay: false, // TODO: change based on Google?
                    projectId: fullCalendarProjectId,
                    backgroundColor: backgroundColor,
                    borderColor: event.borderColor
                }
            )
        });
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

    fetchBackgroundColorFromGoogleEvent = (googleEvent) => {
        // if (!googleEvent.extendedProperties) {
        //     return googleEvent.backgroundColor;
        // }

        // if (!googleEvent.extendedProperties.private) {
        //     return googleEvent.backgroundColor;
        // }

        // return googleEvent.extendedProperties.private.fullCalendarBackgroundColor;


        return googleEvent.backgroundColor;
    }

    fetchAppEventIdFromGoogleEvent = (googleEvent) => {
        if (!googleEvent.extendedProperties) {
            return null;
        }

        if (!googleEvent.extendedProperties.private) {
            return null;
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
        const calendarApi = this.calendarRef.current.getApi();
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

    // TODO:
    exportProjectEventsToGoogleCalendar = async () => {
        /*
        1. Get all generated events:
            get all events
            Alternatively: save all generated events in a special field
            get all events of the project (by id?)
        
        2. Create calendar in Google
            Base on event name

        3. Send to google calendar API, insert to the newly created calendar
            Add extended properties for our project ID

        4. Delete from database all exported events

        5. Refresh page
        */


        // Get all generated events
        let calendarApi = this.calendarRef.current.getApi();
        const allEvents = calendarApi.getEvents();

        let generatedEvents = allEvents.filter(event => event.extendedProps.unexportedEvent === true);

        if (generatedEvents.length === 0) {
            return;
        }

        let newCalendarName = generatedEvents[0].title;

        const googleResJson = await this.createGoogleCalendar(newCalendarName);

        const googleCalendarID = googleResJson.data.id;

        const resJson = this.insertGeneratedEventsToGoogleCalendar(generatedEvents, googleCalendarID);
        alert("Events added to Google Calendar!");
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

    createGoogleCalendar = async (newCalendarName) => {
        try {
            const body = {
                calendarName: newCalendarName,
            };

            const response = await fetch(`http://localhost:3001/api/calendar/`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token')
                },
                method: 'POST',
                body: JSON.stringify(body)
            });

            if (response.status !== 200) throw new Error('Error while creating new calendar');
            const googleResJson = await response.json();
            return googleResJson;
        }
        catch (err) {
            console.error(err);
            return null;
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
            let calendarApi = this.calendarRef.current.getApi();
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
            <>
                <div hidden={!this.state.isLoading}>
                    <h3>Loading your schedule</h3>
                    <ThreeDots color="#00BFFF" height={80} width={80} />
                </div>
                <div hidden={this.state.isLoading}>
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
                        selectable={true}
                        editable={true}
                        eventContent={this.renderEventContent}
                        select={this.handleDateSelect}
                        eventClick={this.handleEventClick}
                        eventsSet={this.handleEvents} // called after events are initialized/added/changed/removed
                        eventDrop={this.handleEventDragged}
                        ref={this.calendarRef}
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
            </>
        )
    }
}