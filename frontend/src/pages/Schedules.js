import * as React from 'react';
// Dialog
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
// DateTimePicker
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import DialogTitle from '@mui/material/DialogTitle';
// Calendar
import FullCalendar from '@fullcalendar/react' // must go before plugins
import interactionPlugin from "@fullcalendar/interaction" // needed for dayClick
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import timeGridPlugin from '@fullcalendar/timegrid';

export const Schedules = () => {
    const [eventStartValue, setEventStartValue] = React.useState(new Date());
    const [eventEndValue, setEventEndValue] = React.useState(new Date());
    const [dialogOpen, setDialogOpen] = React.useState(false);
    
    const eventsSources = [{
        googleCalendarId: 'iw.jewish#holiday@group.v.calendar.google.com'   // TODO: set as variable of current google user
    },
    {
      events:[
        {
          title: 'event',
          start: '2022-04-20',
          end: '2022-04-21',
          id: '1'
        }
      ]
    }];

    const handleEventClick = (info) =>{
        info.jsEvent.preventDefault();
        alert(`event id: ${info.event.id}`);
    }


    const handleDateClick = () => {
        setDialogOpen(true);
        // TODO: set textbox initial values to datetime clicked on (use arg.dateStr)
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    return (
        <div>
            <FullCalendar
                plugins={[timeGridPlugin, interactionPlugin, googleCalendarPlugin]}
                allDaySlot={false}
                initialView="timeGridWeek"
                editable="true"
                height="auto"
                slotDuration='00:05:00'
                googleCalendarApiKey='AIzaSyDU2RAPfkCgbfLSIrJ_R_feaTQEGzhUnuk'
                eventSources={eventsSources}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
            />

            <Dialog open={dialogOpen} onClose={handleDialogClose}>
                <DialogTitle>Create Event</DialogTitle>
                <DialogContent>
                    <TextField label="Title" margin="dense" autoFocus />
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DateTimePicker
                        label="Start"
                        value={eventStartValue}
                        onChange={(newValue) => {setEventStartValue(newValue);}}
                        renderInput={(props) => <TextField margin='dense' {...props} />}
                        />
                        <DateTimePicker
                        label="End"
                        value={eventEndValue}
                        onChange={(newValue) => {setEventEndValue(newValue);}}
                        renderInput={(props) => <TextField margin='dense' {...props} />}
                        />
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button onClick={handleDialogClose}>Create</Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}