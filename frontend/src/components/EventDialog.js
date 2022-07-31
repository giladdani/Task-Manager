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
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

export default function EventDialog(props) {
  const handleClose = () => {
    props.toggleOpen(false);
  }
  const handleDelete = () => {
    props.onEventDelete(props.event);
  }

  const handleReschedule = () => {
    props.onEventReschedule(props.event);
  }

  const handleSave = () => {
    props.onEventEdit(props.event);  //TODO: send all form fields
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
                  <TextField label="Event name" defaultValue={props.event.title} autoFocus />
                </td>
              </tr>
              <tr>
                <td>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                      label="Start time"
                      defaultValue={props.event.start}
                      value={props.event.start}
                      onChange={(newValue) => { /*setConstraintStartTime(newValue)*/ }}
                      renderInput={(params) => <TextField {...params} />}
                    />
                  </LocalizationProvider>
                </td>
              </tr>
              <tr>
                <td>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                      label="End time"
                      value={props.event.end}
                      onChange={(newValue) => { /*setConstraintStartTime(newValue)*/ }}
                      renderInput={(params) => <TextField {...params} />}
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
          <Button onClick={handleReschedule} variant="contained" color="error">Reschedule</Button>
        </DialogActions>
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