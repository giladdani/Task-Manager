import React from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { ThreeDots } from  'react-loader-spinner'
import EventDialog from '../components/EventDialog'
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';

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

        let constraintEvents = await this.fetchConstraints();
        constraintEvents.forEach(constraint => { constraint.editable = false })
        this.addEventsToScheduleFullCalendar(constraintEvents);

        let projectEvents = await this.fetchProjectEvents();
        this.addEventsToScheduleFullCalendar(projectEvents);

        this.setState({ isLoading: false });

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

            if (response.status !== 200) {
                throw new Error('Error while fetching events');
            }

            const data = await response.json();

            return data;
        } catch (err) {
            console.error(err);
        }
    }

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

            if (response.status !== 200) {
                throw new Error('Error while fetching events');
            }

            const data = await response.json();

            return data;
        } catch (err) {
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

            if (response.status !== 200) {
                throw new Error('Error while fetching events');
            }

            const data = await response.json();

            return data;
        } catch (err) {
            console.error(err);
        }
    }

    updateEventGoogle = async (event) => {
        try {
            const body = {
                event: event,
                googleCalendarId: event.extendedProps.googleCalendarId
            };

            const response = await fetch(`http://localhost:3001/api/calendar/events/google`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token')
                },
                method: 'PUT',
                body: JSON.stringify(body)
            });

            if (response.status !== 200) {
                throw new Error('Error while fetching events');
            }

            const data = await response.json();

            return data;
        } catch (err) {
            console.error(err);
        }
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
            // const backgroundColor = this.fetchBackgroundColorFromGoogleEvent(event);
            const backgroundColor = event.backgroundColor;

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
        if (!googleEvent.extendedProperties) {
            return googleEvent.colorId;
        }

        if (!googleEvent.extendedProperties.private) {
            return googleEvent.colorId;
        }

        return googleEvent.extendedProperties.private.fullCalendarBackgroundColor;
    }

    fetchAppEventIdFromGoogleEvent = (googleEvent) => {
        if (!googleEvent.extendedProperties) {
            return null;
        }

        if (!googleEvent.extendedProperties.private) {
            return null;
        }

        return googleEvent.extendedProperties.private.fullCalendarEventId;
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

    toggleDialog = (isOpen) =>{
        this.setState({isDialogOpen: isOpen});
    }
    
    handleEventClick = (clickInfo) => {
        this.setState({selectedEvent: clickInfo.event});
        this.toggleDialog(true);
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

    handleEventDragged = (eventInfo) => {
        if (this.isConstraintEvent(eventInfo.event)) {
            return;
        } else if (this.isUnexportedProjectEvent(eventInfo.event)) {
            this.updateUnexportedProjectEvent(eventInfo.event);
        } else {
            this.updateEventGoogle(eventInfo.event);
        }
    }

    async updateUnexportedProjectEvent(event) {
        try {
            const body = {
                event: event,
            };

            const response = await fetch(`http://localhost:3001/api/calendar/events/unexported`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token')
                },
                method: 'PUT',
                body: JSON.stringify(body)
            });

            if (response.status !== 200) {
                throw new Error('Error while fetching events');
            }

        } catch (err) {
            console.error(err);
            alert(err);
        }
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

    handleEventEdit = (updatedEvent) => {
        //TODO:
    }

    handleEventDelete = (event) => {
        // TODO:
    }

    render() {
        return (
            <div>
                <div hidden={!this.state.isLoading}>
                    <h3>Loading your schedule</h3>
                    <ThreeDots color="#00BFFF" height={80} width={80} />
                </div>
                <div hidden={this.state.isLoading}>
                    <div>
                        <label>Show Constraints</label>
                        <Checkbox onChange={(newValue) => { this.setShowConstraintsValue(newValue.target.checked); }}></Checkbox>
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
                        // selectMirror={true}
                        // dayMaxEvents={true}
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
                        onEventEdit={this.handleEventEdit}
                        onEventDelete={this.handleEventDelete}
                    />
                </div>
            </div>
        )
    }
}