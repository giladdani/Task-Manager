import React, { useState, useEffect } from 'react';
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
import eventUtils from '../../utils/event-utils';
import Tags from '../general/tags/Tags';

export default function EventDialog(props) {
  const [title, setEventName] = useState("");
  const [start, setEventStart] = useState(new Date());
  const [end, setEventEnd] = useState(new Date());
  const [suggestedEvents, setSuggestedEvents] = useState(null);
  const [selectedTagIds, setSelectedTagIds] = useState();

  useEffect(() => {
    setEventName(props.event.title);
    setEventStart(props.event.start);
    setEventEnd(props.event.end);
    manageTags();

  }, [props.event])

  const manageTags = async () => {
    const [independentTagIds, projectTagIds, ignoredProjectTagIds] = eventUtils.fc_GetAllTagIds(props.event);
    let activeTagIds = [];

    if (independentTagIds) {
      activeTagIds = activeTagIds.concat(independentTagIds);
    }

    if (projectTagIds) {
      activeTagIds = activeTagIds.concat(projectTagIds);
    }

    if (ignoredProjectTagIds) {
      for (const ignoredId of ignoredProjectTagIds) {
        activeTagIds.pop(ignoredId);
      }
    }

    setSelectedTagIds(activeTagIds);
  }

  const handleClose = () => {
    props.toggleOpen(false);
    setSuggestedEvents(null);
  }
  const handleDelete = () => {
    props.onEventDelete(props.event);
  }

  const handleReschedule = async () => {
    let rescheduledEventsResponse = await props.onEventReschedule(props.event);
    if (rescheduledEventsResponse && rescheduledEventsResponse.events) {
      setSuggestedEvents(rescheduledEventsResponse.events);
    }
  }

  const handleSave = () => {
    let [independentTagIds, ignoredProjectTagIds] = getTagsForUpdate();

    props.onEventEdit({ title, start, end, independentTagIds, ignoredProjectTagIds });
  }

  const getTagsForUpdate = () => {
    /**
     * The server expects the following in the patch fields:
     * * independentTagIds
     * * ignoredProjectTagIds
     */

    let projectTagIds = eventUtils.fc_GetProjectTagIds(props.event);

    let ignoredProjectTagIds = [];
    for (const projectTagId of projectTagIds) {
      if (!selectedTagIds.includes(projectTagId)) {
        ignoredProjectTagIds.push(projectTagId);
      }
    }

    let independentTagIds = []
    for (const selectedTagId of selectedTagIds) {
      if (!projectTagIds.includes(selectedTagId)) {
        independentTagIds.push(selectedTagId);
      }
    }

    return [independentTagIds, ignoredProjectTagIds];
  }

  const handleConfirmRescheduling = (suggestedEvents) => {
    props.handleConfirmRescheduling(props.event, suggestedEvents);
    setSuggestedEvents(null);
    // handleClose();
  }

  const handleTagsUpdated = (selectedTagIds) => {
    setSelectedTagIds(selectedTagIds);
  }

  return (
    <>
      <Dialog
        open={props.isOpen}
        onClose={handleClose}
        aria-labelledby="draggable-dialog-title"
        PaperComponent={PaperComponent}
        BackdropProps={{ style: { backgroundColor: "transparent" } }}
        disableScrollLock
        disableRestoreFocus
      >
        <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">Edit event</DialogTitle>
        <DialogContent>
          <table id="editEventTable">
            <tbody>
              <tr>
                <td>
                  <TextField
                    label="Event name"
                    value={title}
                    onChange={(newValue) => setEventName(newValue.target.value)}
                    autoFocus
                  />
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
              <tr>
                <td>
                  <Tags
                    setNotificationMsg={props.setNotificationMsg}
                    selectedTagIds={selectedTagIds}
                    onTagsUpdate={handleTagsUpdated}
                  ></Tags>
                </td>
              </tr>
            </tbody>
          </table>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained" color="secondary">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="success">Save</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
          {eventUtils.fc_isProjectEvent(props.event) &&
            <Button onClick={handleReschedule} variant="contained" color="primary">Reschedule</Button>
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