import React from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { ThreeDots } from 'react-loader-spinner'
import EventDialog from '../components/events/EventDialog'
import Checkbox from '@mui/material/Checkbox'
import { isValidStatus } from '../apis/APIUtils'
import ProjectsAPI from '../apis/ProjectsAPI'
import MultipleSelectChip from '../components/general/MultipleSelectChip'
import { useTabsList } from '@mui/base'
const eventUtils = require('../utils/event-utils.js')
const ConstraintsAPI = require('../apis/ConstraintsAPI.js')
const EventsAPI = require('../apis/EventsAPI.js')
const TagsAPI = require('../apis/TagsAPI.js')

export class Schedules extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: false,
            isDialogOpen: false,
            selectedEvent: { title: "" },
            requestingUnsyncedEvents: false,
            rerenderFlag: false,
            latestUnexportedTimestamp: null,
            allUserTags: []
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
                this.updateUnexportedTimestamp(projectEvents);
                this.addEventsToScheduleFullCalendar(projectEvents);
            })
            .catch(err => console.error(err));

        let tagsPromise = TagsAPI.fetchTagsData()
            .then(allTags => {
                this.setState({allUserTags: allTags});
            })

        Promise.all([googlePromise, constraintsPromise, projectPromise, tagsPromise])
            .then(responses => {
                this.setState({ isLoading: false })

                this.setState({ fetchedInitialEvents: true });
                let intervalInfo = window.setInterval(this.updateUnsyncedEvents, 5000);
                this.setState({ interval: intervalInfo });
                console.log(`[componentDidMount: Schedules] Set up interval ${this.state.interval}`)
            })
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
                let googlePromise = this.handleGoogleSync();
                let unexportedPromise = this.handleUnexportedSync();

                Promise.all([googlePromise, unexportedPromise])
                    .then(responses => {
                        this.setState({ requestingUnsyncedEvents: false });
                    })
            })
        }
    }

    handleGoogleSync = async () => {
        EventsAPI.fetchUnsyncedGoogleEventsData()
            .then((unsyncedEvents) => {
                if (!unsyncedEvents) return;
                try {
                    console.log(`Fetched ${unsyncedEvents.length} unsynced Google events.`)
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
                            if (unsyncedEvent.calendarId === fullCalendarEvent.extendedProps.googleCalendarId) {
                                fullCalendarEvent.remove();
                            }
                        } else {
                            this.updateGoogleEvent(unsyncedEvent, fullCalendarEvent);

                            let event = this.state.selectedEvent;
                            if (event && event.id && event.id === unsyncedEvent.id) {
                                this.setState({ rerenderFlag: !this.state.rerenderFlag });
                            }
                        }
                    }
                } catch (err) {
                    console.error(`[handleGoogleSync] Error in THEN part:\n${err}`)
                }
            })
            .catch(err => {
                console.error(`[handleGoogleSync] Error:\n${err}`);
            })
    }

    handleUnexportedSync = async () => {
        EventsAPI.fetchUnsyncedUnexportedEventsData(this.state.latestUnexportedTimestamp)
            .then((unsyncedEvents) => {
                if (!unsyncedEvents) return;
                try {
                    console.log(`Fetched ${unsyncedEvents.length} unsynced unexported events.`)
                    if (unsyncedEvents.length === 0) return;
                    let calendarApi = this.state.calendarRef.current.getApi();
                    let eventsToAdd = [];
                    for (const unsyncedEvent of unsyncedEvents) {
                        let fullCalendarEvent = calendarApi.getEventById(unsyncedEvent.id);
                        if (!fullCalendarEvent) {
                            eventsToAdd.push(unsyncedEvent);
                        } else if (unsyncedEvent.status === "cancelled") {
                            fullCalendarEvent.remove();
                        } else {
                            this.updateUnsyncedUnexportedEvent(unsyncedEvent, fullCalendarEvent);

                            let event = this.state.selectedEvent;
                            if (event && event.id && event.id === unsyncedEvent.id) {
                                this.setState({ rerenderFlag: !this.state.rerenderFlag });
                            }
                        }
                    }

                    this.addEventsToScheduleFullCalendar(eventsToAdd);
                    this.updateUnexportedTimestamp(unsyncedEvents);
                } catch (err) {
                    console.log(`[handleUnexportedSync] Error in THEN part:\n${err}`)
                }
            })
            .catch(err => {
                console.error(`[handleUnexportedSync] Error:\n${err}`);
            })
    }

    /**
     * 
     * @param {*} fcEvent A Full Calendar event to update.
     * @param {*} start Optional: start date.
     * @param {*} end Optional: end date.
     * @param {*} regularProps Optional: an objet mapping a prop name to a new value. For example: { title: "New title" }.
     */
    updateEventFields = (fcEvent, start, end, regularProps, extendedProps) => {
        let originalEditableSetting = fcEvent.editable;
        fcEvent.setProp("editable", true);

        if (start) fcEvent.setStart(start);
        if (end) fcEvent.setEnd(end);

        if (regularProps) {
            for (const [key, value] of Object.entries(regularProps)) {
                fcEvent.setProp(key, value);
            }
        }

        if (extendedProps) {
            for (const [key, value] of Object.entries(extendedProps)) {
                fcEvent.setExtendedProp(key, value);
            }
        }

        fcEvent.setProp("editable", originalEditableSetting);
    }

    updateUnsyncedUnexportedEvent = (unexEvent, fcEvent) => {
        let start = unexEvent.start;
        let end = unexEvent.end;
        let regularProps = {
            title: unexEvent.title,
            backgroundColor: unexEvent.backgroundColor,
        }

        let [independentTagsIds, projectTagIds, ignoredProjectTagIds] = eventUtils.unex_GetAllTagIds(unexEvent);
        let extendedProps = {
            tags: {
                independentTagsIds: independentTagsIds,
                projectTagIds: projectTagIds,
                ignoredProjectTagIds: ignoredProjectTagIds,
            }
        }

        this.updateEventFields(fcEvent, start, end, regularProps, extendedProps);
    }

    updateGoogleEvent = (gEvent, fcEvent) => {
        let start = gEvent.start.dateTime;
        let end = gEvent.end.dateTime;

        /**
         * TODO:
         * If a Google event is all day, I think the fields aren't "dateTime" but rather "date".
         * In which case our code so far doesn't detect it.
         * Our app in general doesn't handle full day events.
         */
        if (!start || !end) {
            return;
        }
        
        let regularProps = {
            title: gEvent.summary,
            backgroundColor: gEvent.backgroundColor,
            borderColor: gEvent.foregroundColor,
        }

        let [independentTagsIds, projectTagIds, ignoredProjectTagIds] = eventUtils.g_GetAllTagsIds(gEvent);
        let extendedProps = {
            tags: {
                independentTagsIds: independentTagsIds,
                projectTagIds: projectTagIds,
                ignoredProjectTagIds: ignoredProjectTagIds,
            }
        }

        this.updateEventFields(fcEvent, start, end, regularProps, extendedProps);

        // ! DELETE old code: before there was a dedicated function
        // // let start = gEvent.start.dateTime;
        // // let end = gEvent.end.dateTime;
        // // let originalEditableSetting = fullCalendarEvent.editable;

        // // /**
        // //  * TODO:
        // //  * If a Google event is all day, I think the fields aren't "dateTime" but rather "date".
        // //  * In which case our code so far doesn't detect it.
        // //  * Our app in general doesn't handle full day events.
        // //  */
        // // if (!start || !end) {
        // //     return;
        // // }

        // // fullCalendarEvent.setProp("editable", true);
        // // fullCalendarEvent.setDates(start, end);
        // // fullCalendarEvent.setProp("title", gEvent.summary);
        // // fullCalendarEvent.setProp("backgroundColor", gEvent.backgroundColor);
        // // fullCalendarEvent.setProp("borderColor", gEvent.foregroundColor);

        // // let [independentTagsIds, projectTagIds, ignoredProjectTagIds] = eventUtils.g_GetAllTagsIds(gEvent);
        // // fullCalendarEvent.setProp("extendedProps.independentTagsIds", independentTagsIds);
        // // fullCalendarEvent.setProp("extendedProps.projectTagIds", projectTagIds);
        // // fullCalendarEvent.setProp("extendedProps.ignoredProjectTagIds", ignoredProjectTagIds);

        // // fullCalendarEvent.setProp("editable", originalEditableSetting);
    }

    handleEventDragged = async (eventInfo) => {
        if (eventUtils.fc_accessRoleAllowsWriting(eventInfo.event) === false) {
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
        if (!eventUtils.fc_accessRoleAllowsWriting(event)) {
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

    /**
     * This function receives an array of unexported events, checks their highest updatedAt field,
     * and updates the state's latest timestamp if it's bigger.
     * @param {*} unexportedEvents 
     */
    updateUnexportedTimestamp = (unexportedEvents) => {
        if (!unexportedEvents || unexportedEvents.length === 0) {
            return;
        }

        let latestTimestamp = new Date(unexportedEvents[0].updatedAt);

        unexportedEvents.forEach(unexEvent => {
            if (new Date(unexEvent.updatedAt) > latestTimestamp) latestTimestamp = new Date(unexEvent.updatedAt);
        })

        if (this.state.latestUnexportedTimestamp === null || latestTimestamp > this.state.latestUnexportedTimestamp) {
            this.setState({ latestUnexportedTimestamp: latestTimestamp });
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

        const fullCalendarProjectId = eventUtils.g_getProjectId(event);
        const localEventId = eventUtils.g_getAppEventId(event);
        const googleEventId = event.id;
        const editable = eventUtils.g_accessRoleAllowsWriting(event);
        const [independentTagIds, projectTagIds, ignoredProjectTagIds] = eventUtils.g_GetAllTagsIds(event);

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
            independentTagIds: independentTagIds,
            projectTagIds: projectTagIds,
            ignoredProjectTagIds: ignoredProjectTagIds,
        }

        return fcEvent;
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
                <div><b>{eventInfo.event.title}</b></div>
                <div>{eventInfo.timeText}</div>
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
        if (eventUtils.fc_accessRoleAllowsWriting(clickInfo.event) === false) {
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

        return ProjectsAPI.getRescheduledProjectEventsData(event)
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

    handleFilterTagsChange = (selectedTags) => {
        const calendarApi = this.state.calendarRef.current.getApi();
        const allEvents = calendarApi.getEvents();
        const nonConstraintEvents = allEvents.filter(event => event.extendedProps.isConstraint == undefined || event.extendedProps.isConstraint != true);
        let filteredEvents = [];
        let eventTagIds = [];

        // if no tag was selected- show all events
        if(selectedTags.length == 0) {
            nonConstraintEvents.forEach(event => {
                event.setProp("display", "auto");
            })
        } else {
            // hide all events
            nonConstraintEvents.forEach(event => {
                event.setProp("display", "none");
            })
            // filter events according to selectedTags
            filteredEvents = nonConstraintEvents.filter(event => {
                eventTagIds = eventUtils.fc_GetActiveTagIds(event);
                if(eventTagIds.length > 0) {
                    return selectedTags.some(tag => {
                        return eventTagIds.includes(tag.id); 
                    })
                }
            })
            // show filtered events
            filteredEvents.forEach(event => {
                event.setProp("display", "auto");
            })
        }
    }

    render() {
        return (
            <div>
                <div hidden={!this.state.isLoading} className="center_text">
                    <h3>Loading your schedule</h3>
                    <ThreeDots color="#00BFFF" height={80} width={80} />
                </div>
                <div id="schedule-container">
                    <div>
                        <label>Show Constraints</label>
                        <Checkbox onChange={(newValue) => { this.setShowConstraintsValue(newValue.target.checked); }}></Checkbox>
                    </div>
                    <div>
                        <label>Filter by tag:</label>
                        <MultipleSelectChip items={this.state.allUserTags} onSelectChange={this.handleFilterTagsChange}></MultipleSelectChip>
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
                        setNotificationMsg={this.props.setNotificationMsg}
                        key={this.state.rerenderFlag}
                    />
                </div>
            </div>
        )
    }
}