import * as React from 'react';
import Button from '@mui/material/Button';
import Draggable from 'react-draggable';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { SuggestedEventsList as SuggestedEventsList } from './SuggestedEventsList';


export default function EventDialog(props) {
  const [title, setEventName] = React.useState("");
  const [start, setEventStart] = React.useState(new Date());
  const [end, setEventEnd] = React.useState(new Date());
  const [suggestedEvents, setSuggestedEvents] = React.useState(null);

  React.useEffect(() => {
    setEventName(props.event.title);
    setEventStart(props.event.start);
    setEventEnd(props.event.end);
  }, [props.event])


  const isProjectEvent = (fullCalendarEvent) => {
    if (!fullCalendarEvent) {
      return false;
    }

    if (fullCalendarEvent.projectId) {
      return fullCalendarEvent.projectId !== null;
    }

    if (!fullCalendarEvent.extendedProps) {
      return false;
    }

    if (!fullCalendarEvent.extendedProps.projectId) {
      return false;
    }

    let isProjectEvent = fullCalendarEvent.extendedProps.projectId !== null;

    return isProjectEvent;
  }

  const handleClose = () => {
    props.toggleOpen(false);
    setSuggestedEvents(null);
  }
  const handleDelete = () => {
    props.onEventDelete(props.event);
  }

  const handleReschedule = async () => {
    let rescheduledEventsRes = await props.onEventReschedule(props.event);
    // let rescheduledEvents = await fetchRescheduledEvents(props.event);
    setSuggestedEvents(rescheduledEventsRes.events);
  }

  const handleSave = () => {
    props.onEventEdit({ title, start, end });
  }

  const handleConfirmRescheduling = (suggestedEvents) => {
    props.handleConfirmRescheduling(props.event, suggestedEvents);
    setSuggestedEvents(null);
    // handleClose();
  }

  return (
    <>
      <Dialog open={props.isOpen} aria-labelledby="draggable-dialog-title" PaperComponent={PaperComponent} BackdropProps={{ style: { backgroundColor: "transparent" } }} disableScrollLock disableRestoreFocus>
        <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">Edit event</DialogTitle>
        <DialogContent>
          <table id="editEventTable">
            <tbody>
              <tr>
                <td>
                  <TextField label="Event name" value={title} onChange={(newValue) => setEventName(newValue.target.value)} autoFocus />
                </td>
              </tr>
              <tr>
                <td>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label="Start time"
                      inputFormat="dd/MM/yyyy HH:mm"
                      value={start}
                      onChange={(newValue) => { setEventStart(newValue) }}
                      renderInput={(params) => <TextField {...params} />}
                      ampm={false}
                    />
                  </LocalizationProvider>
                </td>
              </tr>
              <tr>
                <td>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label="End time"
                      inputFormat="dd/MM/yyyy HH:mm"
                      value={end}
                      onChange={(newValue) => { setEventEnd(newValue) }}
                      renderInput={(params) => <TextField {...params} />}
                      ampm={false}
                    />
                  </LocalizationProvider>
                </td>
              </tr>
            </tbody>
          </table>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="success">Save</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
          {isProjectEvent(props.event) &&
            <Button onClick={handleReschedule} variant="contained" color="error">Reschedule</Button>
          }
        </DialogActions>
        <SuggestedEventsList
          suggestedEvents={suggestedEvents}
          confirmRescheduling={handleConfirmRescheduling}
        ></SuggestedEventsList>
      </Dialog>
    </>
  );
}

// PaperComponent allows dragging the dialog
function PaperComponent(props) {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
}