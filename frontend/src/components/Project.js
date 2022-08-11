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
const ProjectsAPI = require('../apis/ProjectsAPI.js')
const EventsAPI = require('../apis/EventsAPI.js')

export const Project = (props) => {
    const allEvents = props.projectEvents;
    const [projectTitle, setProjectName] = useState(props.project.title);
    const [startDate, setStartDate] = useState(new Date(props.project.start));
    const [endDate, setEndDate] = useState(new Date(props.project.end));
    const [isBeingEdited, setIsBeingEdited] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    
    
    // Start of code for future update
    const [projectEvents, setProjectEvents] = useState([]);
    const componentMounted = useRef(true);


    useEffect(() => {
        const fetchData = async () => {
            // // await fetchAndUpdateProjects();
            // await fetchAndUpdateProjectEvents();
        }

        fetchData();

        return () => {
            componentMounted.current = false;
        }
    });

    const fetchAndUpdateProjectEvents = async () => {
        const [projectEvents, error] = await EventsAPI.fetchProjectEvents(props.project.id);

        if (componentMounted.current) {
            // // setAllProjects(projects);
            setProjectEvents(projectEvents);
        } else {
            console.log(`[Project - fetchAndUpdateProjectEvents] component is unmounted, not setting project events!`)
        }
    }
    // End of code for future update

    const oldEvents = allEvents.filter(event => {
        const currDate = new Date();
        const eventEndDate = new Date(event.end);

        return eventEndDate <= currDate;
    })

    const futureEvents = allEvents.filter(event => {
        const currDate = new Date();
        const eventStartDate = new Date(event.start);

        return eventStartDate >= currDate;
    })

    const getAllHoursInEvents = (futureEvents) => {
        let diffMs = 0;

        for (const event of futureEvents) {
            let endDate = new Date(event.end);
            let startDate = new Date(event.start)

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

    let totalHoursPast = getAllHoursInEvents(oldEvents);
    totalHoursPast = totalHoursPast.toFixed(2);
    totalHoursPast = parseFloat(totalHoursPast);

    let totalHoursFuture = getAllHoursInEvents(futureEvents);
    totalHoursFuture = totalHoursFuture.toFixed(2);
    totalHoursFuture = parseFloat(totalHoursFuture);

    let totalHoursExpected = totalHoursPast + totalHoursFuture;
    totalHoursExpected = totalHoursExpected.toFixed(2);
    totalHoursExpected = parseFloat(totalHoursExpected);


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