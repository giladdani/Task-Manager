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
            <table className="whiteFont spaced-table">
                <tbody>
                    <tr>
                        <td>
                            <TextField value={projectTitle} onChange={(newValue) => { setProjectTitle(newValue.target.value) }} variant="outlined" size="small" label="Name" focused />
                        </td>
                    </tr>
                    <tr>
                        <td disabled><TextField label="Time estimate" value={props.project.timeEstimate} focused></TextField></td>
                    </tr>
                    <tr>
                        <td disabled><TextField label="Events finished" value={oldEvents.length} focused></TextField></td>
                    </tr>
                    <tr>
                        <td disabled><TextField label="Hours done" value={totalHoursPast} focused></TextField></td>
                    </tr>
                    <tr>
                        <td disabled><TextField label="Events left" value={futureEvents.length} focused></TextField></td>
                    </tr>
                    <tr>
                        <td disabled><TextField label="Hours left" value={totalHoursFuture} focused></TextField></td>
                    </tr>
                    <tr>
                        <td>On track to perform {totalHoursExpected} out of estimated {props.project.timeEstimate} hours.</td>
                    </tr>
                    <tr>
                        {/* <td><label>Start date:</label></td> */}
                        <td className="whiteTimeFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    value={startDate}
                                    inputFormat="dd/MM/yyyy HH:mm"
                                    onChange={(newValue) => { setStartDate(newValue) }}
                                    renderInput={(props) => <TextField {...props} />}
                                    ampm={false}
                                    label="Start date"
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                    <tr>
                        {/* <td><label>End date:</label></td> */}
                        <td className="whiteTimeFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    value={endDate}
                                    inputFormat="dd/MM/yyyy HH:mm"
                                    onChange={(newValue) => { setEndDate(newValue) }}
                                    renderInput={(props) => <TextField {...props} />}
                                    ampm={false}
                                    label="End date"
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Tags
                                setNotificationMsg={props.setNotificationMsg}
                                selectedTagIds={tagIds}
                                onTagsUpdate={handleTagsUpdated}
                            ></Tags>
                        </td>
                    </tr>
                </tbody>
            </table>
            <ButtonGroup variant='contained'>
                <Button onClick={handleOnSave} size="small" variant="contained" color="primary">Save changes</Button>
                <Tooltip title="Deletes the project and all its events. If the project is already exported, it deletes the calendar from Google Calendar.">
                    <Button onClick={handleOnDeleteClick} size="small" variant="contained" color="secondary">Delete</Button>
                </Tooltip>
                {!props.project.exportedToGoogle &&
                    <Tooltip title="Export all the project's events to your Google calendar. This creates a new Calendar for the events.">
                        <Button onClick={handleOnExportClick} size="small" variant="contained">Export</Button>
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
                    <Button onClick={handleCancelDelete} variant="contained" color="primary">Cancel</Button>
                    <Button onClick={handleConfirmDelete} variant="contained" color="secondary">Delete</Button>
                </DialogActions>
            </Dialog>
        </>
    )
}