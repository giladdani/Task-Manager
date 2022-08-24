import React from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { ThreeDots } from 'react-loader-spinner'
import EventDialog from '../components/EventDialog'
import Checkbox from '@mui/material/Checkbox'
import { isValidStatus } from '../apis/APIUtils'
import ProjectsAPI from '../apis/ProjectsAPI'
const eventUtils = require('../event-utils.js')
const ConstraintsAPI = require('../apis/ConstraintsAPI.js')
const EventsAPI = require('../apis/EventsAPI.js')


export class Schedules extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: false,
            isDialogOpen: false,
            selectedEvent: { title: "" },
            requestingUnsyncedEvents: false,
        }
    }

    async componentDidMount() {
        this.setState({ isLoading: true });
        let calendarRef = React.createRef();    // we need this to be able to add events
        this.setState({ calendarRef: calendarRef });

        let googlePromise = EventsAPI.fetchGoogleEventsData()
            .then(events => {
                this.addEventsToScheduleGoogle(events);
            })
            .catch(err => console.error(err));

        let constraintsPromise = ConstraintsAPI.fetchConstraintsData()
            .then(constraintEvents => {
                constraintEvents.forEach(constraint => { constraint.editable = false })
                this.addEventsToScheduleFullCalendar(constraintEvents);
            })
            .catch(err => console.error(err));

        let projectPromise = EventsAPI.fetchAllProjectEventsData()
            .then(projectEvents => {
                this.addEventsToScheduleFullCalendar(projectEvents);
            })
            .catch(err => console.error(err));

        Promise.all([googlePromise, constraintsPromise, projectPromise])
            .then(responses => {
                this.setState({ isLoading: false })

                this.setState({ fetchedInitialEvents: true });
                let intervalInfo = window.setInterval(this.updateUnsyncedEvents, 5000);
                this.setState({ interval: intervalInfo });
                console.log(`[componentDidMount: Schedules] Set up interval ${this.state.interval}`)
            })

        // ! DELETE if all works well since moving these lines to to the Promise.all().then() part, above.
        // // this.setState({ fetchedInitialEvents: true });
        // // let intervalInfo = window.setInterval(this.updateUnsyncedEvents, 5000);
        // // this.setState({ interval: intervalInfo });
        // // console.log(`[componentDidMount: Schedules] Set up interval ${this.state.interval}`)
    }

    async componentWillUnmount() {
        console.log(`[componentWillUnmount: Schedules] Clearing interval ${this.state.interval}`)
        clearInterval(this.state.interval);
    }

    updateUnsyncedEvents = async () => {
        // TODO: add check if unmounted like in ProjectsAccordion. Problem: this is class, accordion is function. Can't use same code.
        if (this.state.requestingUnsyncedEvents === false) {
            this.setState({ requestingUnsyncedEvents: true }, () => {
                console.log(`[updateUnsyncedEvents] Requesting from the server unsynced events.`)
                EventsAPI.fetchUnsyncedGoogleEventsData()
                    .then((unsyncedEvents) => {
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
                                    if (unsyncedEvent.calendarId === fullCalendarEvent.extendedProperties.googleCalendarId) {
                                        fullCalendarEvent.remove();
                                    }
                                } else {
                                    this.updateGoogleEvent(unsyncedEvent, fullCalendarEvent);
                                }
                            }
                        } catch (err) {
                            console.log(`[updateUnsyncedEvents] Error in THEN part:\n${err}`)
                        }
                    })
                    .catch(err => {
                        console.error(`[updateUnsyncedEvents] Error:\n${err}`);
                    })
                    .finally(() => {
                        this.setState({ requestingUnsyncedEvents: false });
                    })
            })
        }
    }

    updateGoogleEvent = (googleEvent, fullCalendarEvent) => {
        let start = googleEvent.start.dateTime;
        let end = googleEvent.end.dateTime;
        let originalEditableSetting = fullCalendarEvent.editable;

        /**
         * TODO:
         * If a Google event is all day, I think the fields aren't "dateTime" but rather "date".
         * In which case our code so far doesn't detect it.
         * Our app in general doesn't handle full day events.
         */
        if (!start || !end) {
            return;
        }

        fullCalendarEvent.setProp("editable", true);
        fullCalendarEvent.setDates(start, end);
        fullCalendarEvent.setProp("title", googleEvent.summary);
        fullCalendarEvent.setProp("backgroundColor", googleEvent.backgroundColor);
        fullCalendarEvent.setProp("borderColor", googleEvent.foregroundColor);
        fullCalendarEvent.setProp("editable", originalEditableSetting);
    }

    handleEventDragged = async (eventInfo) => {
        if (eventUtils.accessRoleAllowsWritingFCEvent(eventInfo.event) === false) {
            this.props.setNotificationMsg(eventUtils.noPermissionMsg);
            return;
        }

        const fieldsToUpdate = {
            start: eventInfo.event.start,
            end: eventInfo.event.end
        }

        let updated = await this.updateEvent(eventInfo.event, fieldsToUpdate)
        if (!updated) {
            let event = eventInfo.event;
            event.setStart(eventInfo.oldEvent.start);
            event.setEnd(eventInfo.oldEvent.end);
        }
    }

    /**
     * @returns Boolean with the update result - true if updated, false if not.
     */
    updateEvent = async (event, fieldsToUpdate) => {
        if (!eventUtils.accessRoleAllowsWritingFCEvent(event)) {
            this.props.setNotificationMsg(eventUtils.noPermissionMsg);
            return false;
        }

        let updated = false;
        return EventsAPI.updateEvent(event, fieldsToUpdate)
            .then(response => {
                if (isValidStatus(response, EventsAPI.validStatusArr_updateEvent)) {
                    console.log(`Success in updating event ${event.title}`);
                    this.props.setNotificationMsg("Event updated");
                    updated = true;

                    return true;
                } else {
                    this.props.setNotificationMsg("Something went wrong! Event not updated.");
                    updated = false;

                    return false;
                }
            })
            .catch(err => {
                console.error(err)
                this.props.setNotificationMsg("Something went wrong! Event not updated.");
                updated = false;

                return false;
            })
            // .finally(() => {
                // return updated;
            // })

        // return resPromise;
    }

    handleEventEditOnDialog = async (fieldsToUpdate) => {
        let updated = await this.updateEvent(this.state.selectedEvent, fieldsToUpdate);
        this.toggleDialog(false);
        let event = this.state.selectedEvent;

        if (updated) {
            if (fieldsToUpdate.title) event.setProp("title", fieldsToUpdate.title);
            if (fieldsToUpdate.start) event.setStart(fieldsToUpdate.start);
            if (fieldsToUpdate.end) event.setEnd(fieldsToUpdate.end);
        }
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
        const editable = eventUtils.accessRoleAllowsWritingGEvent(event);

        fcEvent = {
            id: localEventId,
            googleEventId: googleEventId,
            googleCalendarId: event.calendarId,
            editable: editable,
            title: event.summary,
            start: event.start.dateTime,
            end: event.end.dateTime,
            allDay: false, // TODO: change based on Google?
            projectId: fullCalendarProjectId,
            borderColor: event.foregroundColor,
            backgroundColor: event.backgroundColor,
            accessRole: event.accessRole,
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

        if (!googleEvent.extendedProperties.private.fullCalendarEventID) {
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

    handleEventClick = (clickInfo) => {
        if (eventUtils.accessRoleAllowsWritingFCEvent(clickInfo.event) === false) {
            this.props.setNotificationMsg(eventUtils.noPermissionMsg);
            return;
        }

        this.setState({ selectedEvent: clickInfo.event });
        this.toggleDialog(true);
    }

    handleEventDeleteOnDialog = async (event) => {
        // We want to edit constraints only from the constraints page 
        // because at the moment of writing 
        // we're unsure how to handle editing it with recurring events.
        if (eventUtils.isConstraintEvent(event)) {
            return;
        }

        EventsAPI.deleteEvent(event)
            .then(response => {
                if (isValidStatus(response, EventsAPI.validStatusArr_deleteEvent)) {
                    console.log(`Success in deleting event ${event.title}`);
                    event.remove();
                    this.toggleDialog(false);
                    this.props.setNotificationMsg("Event deleted");
                } else {
                    this.props.setNotificationMsg("Something went wrong! Event not deleted.");
                }
            })
            .catch(err => {
                console.error(err)
                this.props.setNotificationMsg("Something went wrong! Event not deleted.");
            });
    }

    handleEventReschedule = async (event) => {
        // ! DELETE after checking that promise code works well with returning the data
        // // let rescheduledEvents = await ProjectsAPI.getRescheduledProjectEventsData(event);

        // // return rescheduledEvents;

        ProjectsAPI.getRescheduledProjectEventsData(event)
            .then(data => {
                return data;
            })
            .catch(err => {
                console.error(err);
                this.props.setNotificationMsg("Failed to get rescheduling suggestions.");
                return null;
            })
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

    render() {
        return (
            <div>
                <div hidden={!this.state.isLoading} className="center_text">
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