import React, { useState, useEffect, useRef } from 'react';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import Button from "@material-ui/core/Button";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Tooltip from "@material-ui/core/Tooltip";
const EventsAPI = require('../apis/EventsAPI.js')

export const Project = (props) => {
    const [projectTitle, setProjectName] = useState(props.project.title);
    const [startDate, setStartDate] = useState(new Date(props.project.start));
    const [endDate, setEndDate] = useState(new Date(props.project.end));
    const [isBeingEdited, setIsBeingEdited] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [projectEvents, setProjectEvents] = useState([]);
    const [oldEvents, setOldEvents] = useState([]);
    const [futureEvents, setFutureEvents] = useState([]);
    const [totalHoursPast, setTotalHoursPast] = useState();
    const [totalHoursFuture, setTotalHoursFuture] = useState();
    const [totalHoursExpected, setTotalHoursExpected] = useState();
    const componentMounted = useRef(true);

    useEffect(() => {
        const fetchData = async () => {
            await fetchAndUpdateProjectEvents();
        }

        fetchData();

        return () => {
            componentMounted.current = false;
        }
    }, []);

    // TODO: add abort controller!


    
    // Old events
    useEffect(() => {
        const oldEvents = projectEvents.filter(event => {
            const currDate = new Date();
            const eventEndDate = getEventEndDate(event);

            return eventEndDate <= currDate;
        })

        if (componentMounted.current) {
            setOldEvents(oldEvents);
        }

    }, [projectEvents])

    // Future events
    useEffect(() => {
        const futureEvents = projectEvents.filter(event => {
            const currDate = new Date();
            const eventStartDate = getEventStartDate(event);

            return eventStartDate >= currDate;
        })

        if (componentMounted.current) {
            setFutureEvents(futureEvents);
        }
    }, [projectEvents])


    useEffect(() => {
        calculateHoursPast();
    }, [oldEvents]);

    useEffect(() => {
        calculateHoursLeft();
    }, [futureEvents]);

    useEffect(() => {
        calculateHoursExpected();
    }, [totalHoursPast, totalHoursFuture]);

    const fetchAndUpdateProjectEvents = async () => {
        const [projectEvents, error] = await EventsAPI.fetchProjectEvents(props.project.id);

        if (componentMounted.current && !error) {
            setProjectEvents(projectEvents);
        } else {
            console.log(`[Project - fetchAndUpdateProjectEvents] component is unmounted, not setting project events!`)
        }
    }

    const calculateHoursPast = () => {
        let totalHoursPast = getAllHoursInEvents(oldEvents);
        totalHoursPast = totalHoursPast.toFixed(2);
        totalHoursPast = parseFloat(totalHoursPast);

        if (componentMounted.current) {
            setTotalHoursPast(totalHoursPast);
        }
    }

    const calculateHoursLeft = () => {
        let totalHoursFuture = getAllHoursInEvents(futureEvents);
        totalHoursFuture = totalHoursFuture.toFixed(2);
        totalHoursFuture = parseFloat(totalHoursFuture);

        if (componentMounted.current) {
            setTotalHoursFuture(totalHoursFuture);
        }
    }

    const calculateHoursExpected = () => {
        let totalHoursExpected = totalHoursPast + totalHoursFuture;
        totalHoursExpected = totalHoursExpected.toFixed(2);
        totalHoursExpected = parseFloat(totalHoursExpected);

        if (componentMounted.current) {
            setTotalHoursExpected(totalHoursExpected);
        }
    }

    const getAllHoursInEvents = (events) => {
        let diffMs = 0;

        for (const event of events) {
            let startDate = getEventStartDate(event);
            let endDate = getEventEndDate(event);

            let diffM = endDate - startDate;
            diffMs += diffM;
        }

        const diffDays = Math.floor(diffMs / 86400000); // days
        const diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
        const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

        let diffHrsTotal = (diffDays * 24) + diffHrs;

        if (diffMins > 0) {
            diffHrsTotal = diffHrsTotal + (diffMins / 60);
        }

        return diffHrsTotal;
    }

    /**
     * We need to perform this check because Google's event resource is different than FullCalendar's when it comes to saving the time.
     * Google saves under "end" and "start" two fields "date" and "dateTime".
     * FullCalendar just uses "end" and "start".
     * @param {*} event 
     */
    const getEventEndDate = (event) => {
        let date = null;

        if (props.project.exportedToGoogle) {
            date = new Date(event.end.dateTime)
        } else {
            date = new Date(event.end);
        }

        return date;
    }

    const getEventStartDate = (event) => {
        let date = null;

        if (props.project.exportedToGoogle) {
            date = new Date(event.start.dateTime)
        } else {
            date = new Date(event.start);
        }

        return date;
    }

    const handleOnEditClick = () => {
        setIsBeingEdited(true);
    }

    const handleOnCancel = () => {
        setIsBeingEdited(false);
    }

    const handleOnSave = () => {
        setIsBeingEdited(false);
    }

    const handleOnDeleteClick = () => {
        setOpenDeleteDialog(true);
    }

    const handleCancelDelete = () => {
        setOpenDeleteDialog(false);
    }

    const handleConfirmDelete = () => {
        setOpenDeleteDialog(false);
        props.deleteProject(props.project);
    }

    const handleOnExportClick = () => {
        props.exportProject(props.project);
    }

    return (
        <>
            <table>
                <tbody>
                    <tr>
                        <td><label>Name:</label></td>
                        <td>
                            <input
                                type="text"
                                value={projectTitle}
                                disabled={!isBeingEdited}
                                onChange={(newValue) => { setProjectName(newValue.target.value) }}>
                            </input>
                        </td>
                    </tr>
                    <tr>
                        <td><label>Time Estimate:</label></td>
                        <td>{props.project.timeEstimate}</td>
                    </tr>
                    <tr>
                        <td><label>Events finished: </label></td>
                        <td>{oldEvents.length}</td>
                    </tr>
                    <tr>
                        <td><label>Hours done: </label></td>
                        <td>{totalHoursPast}</td>
                    </tr>
                    <tr>
                        <td><label>Events left: </label></td>
                        <td>{futureEvents.length}</td>
                    </tr>
                    <tr>
                        <td><label>Hours left: </label></td>
                        <td>{totalHoursFuture}</td>
                    </tr>
                    <tr>
                        <td>On track to perform {totalHoursExpected} out of estimated {props.project.timeEstimate} hours.</td>
                    </tr>
                    <tr>
                        <td><label>Start date: </label></td>
                        <td className="whiteTimeFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    value={startDate}
                                    inputFormat="dd/MM/yyyy HH:mm"
                                    onChange={(newValue) => { setStartDate(newValue) }}
                                    renderInput={(props) => <TextField {...props} />}
                                    disabled={!isBeingEdited}
                                    ampm={false}
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                    <tr>
                        <td><label>End date:</label></td>
                        <td className="whiteTimeFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    value={endDate}
                                    inputFormat="dd/MM/yyyy HH:mm"
                                    onChange={(newValue) => { setEndDate(newValue) }}
                                    renderInput={(props) => <TextField {...props} />}
                                    disabled={!isBeingEdited}
                                    ampm={false}
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                </tbody>
            </table>
            <Button variant='contained' onClick={handleOnEditClick} disabled={isBeingEdited}>Edit</Button>
            <Button variant='contained' onClick={handleOnCancel} disabled={!isBeingEdited}>Cancel</Button>
            <Button variant='contained' onClick={handleOnSave} disabled={!isBeingEdited}>Save</Button>
            <Tooltip title="Deletes the project and all its events. If the project is already exported, it deletes the calendar from Google Calendar.">
                <Button variant='contained' onClick={handleOnDeleteClick}>Delete</Button>
            </Tooltip>
            {!props.project.exportedToGoogle &&
                <Tooltip title="Export all the project's events to your Google calendar. This creates a new Calendar for the events.">
                    <Button variant='contained' onClick={handleOnExportClick}>Export</Button>
                </Tooltip>
            }
            <Dialog
                open={openDeleteDialog}
                onClose={handleCancelDelete}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {`Delete ${projectTitle}?`}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Delete the project and all its events from the schedule.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}