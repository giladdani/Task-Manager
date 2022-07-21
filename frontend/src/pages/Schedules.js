import React from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { ThreeDots } from  'react-loader-spinner'

export class Schedules extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentEvents: [],
            isLoading: false
        }
    }

    calendarRef = React.createRef();    // we need this to be able to add events
    // calendarApi = this.calendarRef.current.getApi();

    async componentDidMount() {
        this.setState({isLoading: true});
        // fetch and add google events to FullCalendar
        const events = await this.fetchEventsGoogle();
        this.addEventsToScheduleGoogle(events);
        // add events to shared events object in App.js
        let calendarApi = this.calendarRef.current.getApi();

        // fetch and add constraints to FullCalenndar
        let constraintEvents = await this.fetchConstraints();
        this.addEventsToScheduleFullCalendar(constraintEvents);
        this.setState({isLoading: false});
        
        let projectEvents = await this.fetchProjectEvents();
        this.addEventsToScheduleFullCalendar(projectEvents);
        
        const allEvents = calendarApi.getEvents();
        this.props.setEvents(allEvents);
    }

    fetchConstraints = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/constraints', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token')
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

    fetchProjectEvents = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/projects', {
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

    updateEventGoogle = async (event) => {
        try {
            const body = {
                event: event,
                googleCalendarId: event.extendedProps.googleCalendarId
            };

            const response = await fetch(`http://localhost:3001/api/calendar/events`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token')
                },
                method: 'PUT',
                body: JSON.stringify(body)
            });

            if (response.status !== 200) throw new Error('Error while fetching events');
            const data = await response.json();
            return data;
        }
        catch (err) {
            console.error(err);
        }
    }

    addEventsToScheduleFullCalendar = (events) => {
        let calendarApi = this.calendarRef.current.getApi();
        
        events.forEach(event => {
            calendarApi.addEvent(event)
        });
        // this.props.setEvents(events)

        /* TODO: Just a test, delete later
        events.forEach(event => {
            calendarApi.addEvent(
                {
                    start: event.start,
                    end: event.end,
                }
                )
        });
        */

        // TODO: delete
        // const startDate = new Date();
        // const endDate = new Date();
        // endDate.setHours(23);
        // calendarApi.addEvent(
        //     {
        //         start: startDate,
        //         end: endDate,
        //     }
        // )
    }

    addEventsToScheduleGoogle = (events) => {
        let calendarApi = this.calendarRef.current.getApi();

        events.forEach(event => {
            let fullCalendarProjectId = this.fetchProjectIdFromGoogleEvent(event);

            calendarApi.addEvent(
                {
                    id: event.id,
                    googleCalendarId: event.calendarId,
                    editable: false,
                    title: event.summary,
                    start: event.start.dateTime,
                    end: event.end.dateTime,
                    allDay: false,
                    fullCalendarProjectId: fullCalendarProjectId,
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

        return googleEvent.extendedProperties.private.fullCalendarProjectID;
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

    // TODO: open a dialog with the ability to edit/delete the event
    handleEventClick = (clickInfo) => {
        let event = clickInfo.event;
        let msg = `You have chosen the event ${event.title}
        \nStart date: ${event.start}
        \nEnd date: ${event.end}
        \nLater on we will allow the user to edit the event here`;
        alert(msg);
        // if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
        //   clickInfo.event.remove()
        // }
    }

    handleEventDragged = (eventInfo) => {
        this.updateEventGoogle(eventInfo.event);
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
        }
        )
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

        if (generatedEvents.length == 0) {
            return;
        }

        let newCalendarName = generatedEvents[0].title; 

        const googleResJson = await this.createGoogleCalendar(newCalendarName);

        const googleCalendarID = googleResJson.data.id;

        const resJson = this.insertGeneratedEventsToGoogleCalendar(generatedEvents, googleCalendarID);
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

    render() {
        return (
            <div className='demo-app'>
            <div hidden={!this.state.isLoading}>
                <h3>Loading your schedule</h3>
                <ThreeDots color="#00BFFF" height={80} width={80} />
            </div>
            <div hidden={this.state.isLoading}>
                <label>Show Constraints</label><input id="showConstraintsCheckbox" type="checkbox" onChange={(newValue) => { this.setShowConstraintsValue(newValue.target.checked); }}></input>
                <button onClick={this.exportProjectEventsToGoogleCalendar}>Export generated events to Google Calendar</button>
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
                // editable={true}
                // selectMirror={true}
                // dayMaxEvents={true}
                eventContent={this.renderEventContent}
                select={this.handleDateSelect}
                eventClick={this.handleEventClick}
                eventsSet={this.handleEvents} // called after events are initialized/added/changed/removed
                eventDrop={this.handleEventDragged}
                ref={this.calendarRef}
                />
            </div>
        </div>
        )
    }
}