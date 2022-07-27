import * as React from 'react';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import Button from "@material-ui/core/Button";



export const Project = (props) => {
    const allEvents = props.projectEvents;


    const [projectName, setProjectName] = React.useState(props.project.title);
    const [startDate, setStartDate] = React.useState(new Date(props.project.start));
    const [endDate, setEndDate] = React.useState(new Date(props.project.end));
    const [isBeingEdited, setIsBeingEdited] = React.useState(false);



    const oldEvents = allEvents.filter(event => {
        const currDate = new Date();
        const eventStartDate = new Date(event.start);
        const eventEndDate = new Date(event.end);

        return eventEndDate <= currDate;
    })

    const futureEvents = allEvents.filter(event => {
        const currDate = new Date();
        const eventStartDate = new Date(event.start);
        const eventEndDate = new Date(event.end);

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

    const totalHoursPast = getAllHoursInEvents(oldEvents);
    const totalHoursFuture = getAllHoursInEvents(futureEvents);
    const totalHoursExpected = totalHoursPast + totalHoursFuture;


    const handleOnEditClick = () => {
        setIsBeingEdited(true);
    }

    const handleOnCancel = () => {
        setIsBeingEdited(false);
    }

    const handleOnSave = () => {

        setIsBeingEdited(false);

    }

    return (
        <div>
            <table>
                <tbody>
                    <tr>
                        <td><label>Name:</label></td>
                        <td>
                            <input
                                type="text"
                                value={projectName}
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
                        <tr>{oldEvents.length}</tr>
                    </tr>
                    <tr>
                        <td><label>Hours done: </label></td>
                        <tr>{totalHoursPast}</tr>
                    </tr>
                    <tr>
                        <td><label>Events left: </label></td>
                        <tr>{futureEvents.length}</tr>
                    </tr>
                    <tr>
                        <td><label>Hours left: </label></td>
                        <tr>{totalHoursFuture}</tr>
                    </tr>
                    <tr>
                        <td>On track to perform {totalHoursExpected} out of estimated {props.project.timeEstimate} hours.</td>
                    </tr>
                    <tr>
                        <td><label>Start date: </label></td>
                        <td className="whiteFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    value={startDate}
                                    onChange={(newValue) => { setStartDate(newValue) }}
                                    renderInput={(props) => <TextField {...props} />}
                                    disabled={!isBeingEdited}
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                    <tr>
                        <td><label>End date:</label></td>
                        <td className="whiteFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    value={endDate}
                                    onChange={(newValue) => { setEndDate(newValue) }}
                                    renderInput={(props) => <TextField {...props} />}
                                    disabled={!isBeingEdited}
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                </tbody>
            </table>
            <Button variant='contained' onClick={handleOnEditClick} disabled={isBeingEdited}>Edit</Button>
            <Button variant='contained' onClick={handleOnCancel} disabled={!isBeingEdited}>Cancel</Button>
            <Button variant='contained' onClick={handleOnSave} disabled={!isBeingEdited}>Save</Button>
        </div>
    )
}