import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import Button from "@material-ui/core/Button";
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox'

export const Constraint = (props) => {
    const startDate = new Date();
    const [startHour, startMinute] = props.constraint.startTime.split(":");
    startDate.setHours(startHour);
    startDate.setMinutes(startMinute);

    const endDate = new Date();
    const [endHour, endMinute] = props.constraint.endTime.split(":");
    endDate.setHours(endHour);
    endDate.setMinutes(endMinute);

    const [sundayValue, setSundayValue] = useState(props.constraint.daysOfWeek.includes(0));
    const [mondayValue, setMondayValue] = useState(props.constraint.daysOfWeek.includes(1));
    const [tuesdayValue, setTuesdayValue] = useState(props.constraint.daysOfWeek.includes(2));
    const [wednesdayValue, setWednesdayValue] = useState(props.constraint.daysOfWeek.includes(3));
    const [thursdayValue, setThursdayValue] = useState(props.constraint.daysOfWeek.includes(4));
    const [fridayValue, setFridayValue] = useState(props.constraint.daysOfWeek.includes(5));
    const [saturdayValue, setSaturdayValue] = useState(props.constraint.daysOfWeek.includes(6));
    const [constraintStartTime, setConstraintStartTime] = useState(new Date(startDate));
    const [constraintEndTime, setConstraintEndTime] = useState(new Date(endDate));
    const [constraintNameValue, setConstraintNameValue] = useState(props.constraint.title);

    const handleSaveChangesClick = async () => {
        const days = getCheckedDays(); // TODO: change to numbers to match FullCalendar

        const tempConstraint = {
            days: days,
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

    const getCheckedDays = () => {
        const days = [];

        if (sundayValue) {
            days.push("0");
        }

        if (mondayValue) {
            days.push("1");
        }

        if (tuesdayValue) {
            days.push("2");
        }

        if (wednesdayValue) {
            days.push("3");
        }

        if (thursdayValue) {
            days.push("4");
        }

        if (fridayValue) {
            days.push("5");
        }

        if (saturdayValue) {
            days.push("6");
        }

        return days;
    }

    return (
        <table>
            <tbody>
                <tr>
                    <td><label>Name: </label></td>
                    <td>
                    <TextField onChange={(newValue) => setConstraintNameValue(newValue.target.value)} value={constraintNameValue} variant="outlined" />
                    {/* <input type="textbox" onChange={(newValue) => setConstraintNameValue(newValue.target.value)} value={constraintNameValue}></input> */}
                    </td>
                </tr>
                <tr>
                    <td><label>Days of Week: </label></td>
                    <td id="daysDiv">
                    <FormGroup>
                        <FormControlLabel control={<Checkbox checked={sundayValue} onChange={(newValue) => { setSundayValue(newValue.target.checked); }} />} label="Sunday" />
                        <FormControlLabel control={<Checkbox checked={mondayValue} onChange={(newValue) => { setMondayValue(newValue.target.checked); }} />} label="Monday" />
                        <FormControlLabel control={<Checkbox checked={tuesdayValue} onChange={(newValue) => { setTuesdayValue(newValue.target.checked); }} />} label="Tuesday" />
                        <FormControlLabel control={<Checkbox checked={wednesdayValue} onChange={(newValue) => { setWednesdayValue(newValue.target.checked); }} />} label="Wednesday" />
                        <FormControlLabel control={<Checkbox checked={thursdayValue} onChange={(newValue) => { setThursdayValue(newValue.target.checked); }} />} label="Thursday" />
                        <FormControlLabel control={<Checkbox checked={fridayValue} onChange={(newValue) => { setFridayValue(newValue.target.checked); }} />} label="Friday" />
                        <FormControlLabel control={<Checkbox checked={saturdayValue} onChange={(newValue) => { setSaturdayValue(newValue.target.checked); }} />} label="Saturday" />
                    </FormGroup>
                        {/* <label>Sunday</label><input type="checkbox" checked={sundayValue} onChange={(newValue) => { setSundayValue(newValue.target.checked); }}></input>
                        <label>Monday</label><input type="checkbox" checked={mondayValue} onChange={(newValue) => { setMondayValue(newValue.target.checked); }}></input>
                        <label>Tuesday</label><input type="checkbox" checked={tuesdayValue} onChange={(newValue) => { setTuesdayValue(newValue.target.checked); }}></input>
                        <label>Wednesday</label><input type="checkbox" checked={wednesdayValue} onChange={(newValue) => { setWednesdayValue(newValue.target.checked); }}></input>
                        <label>Thursday</label><input type="checkbox" checked={thursdayValue} onChange={(newValue) => { setThursdayValue(newValue.target.checked); }}></input>
                        <label>Friday</label><input type="checkbox" checked={fridayValue} onChange={(newValue) => { setFridayValue(newValue.target.checked); }}></input>
                        <label>Saturday</label><input type="checkbox" checked={saturdayValue} onChange={(newValue) => { setSaturdayValue(newValue.target.checked); }}></input> */}
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