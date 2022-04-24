import React from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { GoogleLoginButton } from "../components/GoogleLoginButton"

export class Schedules extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            currentEvents: []
        }
    }

    calendarRef = React.createRef();    // we need this to be able to add events

    onGoogleLogin = async () => {
        const events = await this.fetchEvents();
        this.addEventsToSchedule(events);
    }

    fetchEvents = async() => {
        try{
            const response = await fetch('http://localhost:3001/api/calendar/events', {
                headers: {
                	'Accept': 'application/json',
                	'Content-Type': 'application/json',
                    'access_token': document.cookie
                },
                method: 'GET'
            });

            if (response.status !== 200) throw new Error('Error while fetching events');
            const data = await response.json();
            return data;
        }
        catch(err){
            console.error(err);
        }
    }

    addEventsToSchedule = (events) => {
        let calendarApi = this.calendarRef.current.getApi();
        events.forEach(event => {
            calendarApi.addEvent({
                // id ?,
                title: event.summary,
                start: event.start.dateTime,
                end: event.end.dateTime,
                allDay: false
            })
        });
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

    handleEventClick = (clickInfo) => {
        // if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
        //   clickInfo.event.remove()
        // }
    }

    handleEvents = (events) => {
        this.setState({currentEvents: events});
    }

    renderEventContent = (eventInfo) => {
        return (
            <div>
                <b>{eventInfo.timeText}</b>
                <i>{eventInfo.event.title}</i>
            </div>
    )}

    render() {
        return (
            <div className='demo-app'>
                <GoogleLoginButton onLogin={this.onGoogleLogin}/>
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
                    // selectMirror={true}
                    // dayMaxEvents={true}
                    eventContent={this.renderEventContent}
                    select={this.handleDateSelect}
                    eventClick={this.handleEventClick}
                    eventsSet={this.handleEvents} // called after events are initialized/added/changed/removed
                    ref={this.calendarRef}
                />
            </div>
        )
    }
}


// import * as React from 'react';
// import { GoogleLoginButton } from "../components/GoogleLoginButton"
// // Dialog
// import Button from '@mui/material/Button';
// import TextField from '@mui/material/TextField';
// import Dialog from '@mui/material/Dialog';
// import DialogActions from '@mui/material/DialogActions';
// import DialogContent from '@mui/material/DialogContent';
// // DateTimePicker
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import DialogTitle from '@mui/material/DialogTitle';
// // Calendar
// import FullCalendar from '@fullcalendar/react' // must go before plugins
// import interactionPlugin from "@fullcalendar/interaction" // needed for dayClick
// import googleCalendarPlugin from '@fullcalendar/google-calendar';
// import timeGridPlugin from '@fullcalendar/timegrid';

// export const Schedules = () => {
//     const [eventStartValue, setEventStartValue] = React.useState(new Date());
//     const [eventEndValue, setEventEndValue] = React.useState(new Date());
//     const [dialogOpen, setDialogOpen] = React.useState(false);

//     const onGoogleLogin = async () => {
//         const events = await fetchEvents();
//         addEventsToSchedule(events);
//     }

//     const addEventsToSchedule = (events) => {
//         events.forEach(event => {
//             eventsSources[1].events.push({
//                 title: event.summary,
//                 start: event.start.dateTime,
//                 end: event.end.dateTime,
//                 allDay: false
//             })
//         });
//     }

//     const fetchEvents = async () => {
//         try{
//             const response = await fetch('http://localhost:3001/api/calendar/events', {
//                 headers: {
//                 	'Accept': 'application/json',
//                 	'Content-Type': 'application/json',
//                     'access_token': document.cookie
//                 },
//                 method: 'GET'
//             });

//             if (response.status !== 200) throw new Error('Error while fetching events');
//             const data = await response.json();
//             return data;
//         }
//         catch(err){
//             console.error(err);
//         }
//     }
//     const eventsSources = [{
//         googleCalendarId: 'iw.jewish#holiday@group.v.calendar.google.com'   // TODO: set as variable of current google user
//     },
//     {
//       events:[]
//     }];

//     const handleEventClick = (info) =>{
//         info.jsEvent.preventDefault();
//         alert(`event id: ${info.event.id}`);
//     }


//     const handleDateClick = () => {
//         setDialogOpen(true);
//         // TODO: set textbox initial values to datetime clicked on (use arg.dateStr)
//     };

//     const handleDialogClose = () => {
//         setDialogOpen(false);
//     };

//     return (
//         <div>
//             <GoogleLoginButton onLogin={onGoogleLogin}></GoogleLoginButton>
//             <FullCalendar
//                 plugins={[timeGridPlugin, interactionPlugin, googleCalendarPlugin]}
//                 allDaySlot={false}
//                 initialView="timeGridWeek"
//                 editable="true"
//                 height="auto"
//                 googleCalendarApiKey='AIzaSyDU2RAPfkCgbfLSIrJ_R_feaTQEGzhUnuk'
//                 eventSources={eventsSources}
//                 dateClick={handleDateClick}
//                 eventClick={handleEventClick}
//             />

//             <Dialog open={dialogOpen} onClose={handleDialogClose}>
//                 <DialogTitle>Create Event</DialogTitle>
//                 <DialogContent>
//                     <TextField label="Title" margin="dense" autoFocus />
//                     <LocalizationProvider dateAdapter={AdapterDateFns}>
//                         <DateTimePicker
//                         label="Start"
//                         value={eventStartValue}
//                         onChange={(newValue) => {setEventStartValue(newValue);}}
//                         renderInput={(props) => <TextField margin='dense' {...props} />}
//                         />
//                         <DateTimePicker
//                         label="End"
//                         value={eventEndValue}
//                         onChange={(newValue) => {setEventEndValue(newValue);}}
//                         renderInput={(props) => <TextField margin='dense' {...props} />}
//                         />
//                     </LocalizationProvider>
//                 </DialogContent>
//                 <DialogActions>
//                     <Button onClick={handleDialogClose}>Cancel</Button>
//                     <Button onClick={handleDialogClose}>Create</Button>
//                 </DialogActions>
//             </Dialog>
//         </div>
//     )
// }