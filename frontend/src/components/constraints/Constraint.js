import Button from "@material-ui/core/Button";
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import React, { useState } from 'react';
import { DaysCheckbox } from '../general/DaysCheckbox';

export const Constraint = (props) => {
    const startDate = new Date();
    const [startHour, startMinute] = props.constraint.startTime.split(":");
    startDate.setHours(startHour);
    startDate.setMinutes(startMinute);

    const endDate = new Date();
    const [endHour, endMinute] = props.constraint.endTime.split(":");
    endDate.setHours(endHour);
    endDate.setMinutes(endMinute);

    const [daysOfWeek, setDaysOfWeek] = useState();
    const [constraintStartTime, setConstraintStartTime] = useState(new Date(startDate));
    const [constraintEndTime, setConstraintEndTime] = useState(new Date(endDate));
    const [constraintNameValue, setConstraintNameValue] = useState(props.constraint.title);

    const handleSaveChangesClick = async () => {
        const tempConstraint = {
            days: daysOfWeek,
            forbiddenStartDate: constraintStartTime,
            forbiddenEndDate: constraintEndTime,
            title: constraintNameValue,
            id: props.constraint.id,
        };

        props.handleConstraintUpdate(tempConstraint);
    }

    const handleDeleteClick = async () => {
        props.handleConstraintDelete(props.constraint.id);
    }

    const handleSetDays = (daysArr) => {
        setDaysOfWeek(daysArr);
    }

    return (
        <table>
            <tbody>
                <tr>
                    <td><label>Name: </label></td>
                    <td>
                        <TextField onChange={(newValue) => setConstraintNameValue(newValue.target.value)} value={constraintNameValue} variant="outlined" />
                    </td>
                </tr>
                <tr>
                    <td><label>Days of Week: </label></td>

                    <td>
                        <DaysCheckbox startingDays={props.constraint.daysOfWeek} setDays={handleSetDays}></DaysCheckbox>

                    </td>
                </tr>
                <tr>
                    <td><label>Start Time: </label></td>
                    <td>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <TimePicker
                                value={constraintStartTime}
                                onChange={(newValue) => { setConstraintStartTime(newValue) }}
                                renderInput={(params) => <TextField {...params} />}
                                ampm={false}
                            />
                        </LocalizationProvider>
                    </td>
                </tr>
                <tr>
                    <td><label>End Time: </label></td>
                    <td>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <TimePicker
                                value={constraintEndTime}
                                onChange={(newValue) => { setConstraintEndTime(newValue) }}
                                renderInput={(params) => <TextField {...params} />}
                                ampm={false}
                            />
                        </LocalizationProvider>
                    </td>
                </tr>
                <tr>
                    <td><Button onClick={handleSaveChangesClick} color="primary" variant='contained'>Save Changes</Button></td>
                    <td><Button onClick={handleDeleteClick} color="secondary" variant='contained'>Delete</Button></td>
                </tr>
            </tbody>
        </table>
    )
}