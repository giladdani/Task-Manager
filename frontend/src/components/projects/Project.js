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
import { ButtonGroup } from '@mui/material';
import { ThreeDots } from 'react-loader-spinner';
import APIUtils from '../../apis/APIUtils.js';
import Tags from '../general/tags/Tags';
const EventsAPI = require('../../apis/EventsAPI.js');
const ProjectsAPI = require('../../apis/ProjectsAPI.js');


export const Project = (props) => {
    const [projectTitle, setProjectTitle] = useState(props.project.title);
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
    const [tagIds, setTagIds] = useState(props.project.tagIds);
    const [isProcessing, setIsProcessing] = useState(false);
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
        EventsAPI.fetchProjectEventsData(props.project.id)
            .then(data => {
                if (componentMounted.current) {
                    setProjectEvents(data);
                } else {
                    console.log(`[Project - fetchAndUpdateProjectEvents] component is unmounted, not setting project events!`)
                }
            })
            .catch(err => {
                console.error(err);
            })
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
        patchProject();
    }

    const patchProject = async () => {
        let patchArguments = getPatchArguments();
        ProjectsAPI.patchProject(patchArguments, props.project.id)
            .then(response => {
                if (APIUtils.isValidStatus(response, ProjectsAPI.validStatusArr_patchProject)) {
                    // TODO: refetch?
                    props.setNotificationMsg("Project updated");

                } else {
                    props.setNotificationMsg("Failed to update project");
                }
            })
            .catch(err => {
                console.error(err);
                props.setNotificationMsg("Failed to update project");
            })
    }

    const getPatchArguments = () => {
        // TODO: should we use different hooks for updated fields, to somehow only take what has been changed?
        const args = {
            title: projectTitle,
            start: startDate,
            end: endDate,
            tagIds: tagIds,
        }

        return args;
    }

    const handleOnDeleteClick = () => {
        setOpenDeleteDialog(true);
    }

    const handleCancelDelete = () => {
        setOpenDeleteDialog(false);
    }

    const handleConfirmDelete = () => {
        setOpenDeleteDialog(false);
        setIsProcessing(true);
        props.deleteProject(props.project);
        setIsProcessing(false);
    }

    const handleOnExportClick = () => {
        setIsProcessing(true);
        props.exportProject(props.project);
        setIsProcessing(false);
    }

    const handleTagsUpdated = (selectedTagIds) => {
        setTagIds(selectedTagIds);
    }

    return (
        <>
            <table className="whiteFont">
                <tbody>
                    <tr>
                        <td><label>Name:</label></td>
                        <td>
                            <TextField value={projectTitle} disabled={!isBeingEdited} onChange={(newValue) => { setProjectTitle(newValue.target.value) }} variant="outlined" />
                        </td>
                    </tr>
                    <tr>
                        <td><label>Time Estimate:</label></td>
                        <td>{props.project.timeEstimate}</td>
                    </tr>
                    <tr>
                        <td><label>Events finished:</label></td>
                        <td>{oldEvents.length}</td>
                    </tr>
                    <tr>
                        <td><label>Hours done:</label></td>
                        <td>{totalHoursPast}</td>
                    </tr>
                    <tr>
                        <td><label>Events left:</label></td>
                        <td>{futureEvents.length}</td>
                    </tr>
                    <tr>
                        <td><label>Hours left:</label></td>
                        <td>{totalHoursFuture}</td>
                    </tr>
                    <tr>
                        <td>On track to perform {totalHoursExpected} out of estimated {props.project.timeEstimate} hours.</td>
                    </tr>
                    <tr>
                        <td><label>Start date:</label></td>
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
                    <tr>
                        <td colSpan={"2"}>
                            <Tags
                                setNotificationMsg={props.setNotificationMsg}
                                selectedTagIds={tagIds}
                                onTagsUpdate={handleTagsUpdated}
                                disabled={!isBeingEdited}
                            ></Tags>
                        </td>
                    </tr>
                </tbody>
            </table>
            <ButtonGroup variant='contained'>
                <Button variant='contained' onClick={handleOnEditClick} disabled={isBeingEdited || isProcessing} size="small">Edit</Button>
                <Button variant='contained' onClick={handleOnCancel} disabled={!isBeingEdited || isProcessing} size="small">Cancel</Button>
                <Button variant='contained' onClick={handleOnSave} disabled={!isBeingEdited || isProcessing} size="small">Save</Button>
                <Tooltip title="Deletes the project and all its events. If the project is already exported, it deletes the calendar from Google Calendar.">
                    <Button variant='contained' onClick={handleOnDeleteClick} disabled={isProcessing} size="small">Delete</Button>
                </Tooltip>
                {!props.project.exportedToGoogle &&
                    <Tooltip title="Export all the project's events to your Google calendar. This creates a new Calendar for the events.">
                        <Button variant='contained' onClick={handleOnExportClick} disabled={isProcessing} size="small">Export</Button>
                    </Tooltip>
                }
            </ButtonGroup>
            <div hidden={!isProcessing} className="center_text">
                <h5>Working on it</h5>
                <ThreeDots color="#00BFFF" height={80} width={80} />
            </div>

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