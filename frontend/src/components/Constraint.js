import * as React from 'react';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

export const Constraint = (props) => {
    const startDate = new Date();
    const [startHour, startMinute] = props.constraint.startTime.split(":");
    startDate.setHours(startHour);
    startDate.setMinutes(startMinute);

    const endDate = new Date();
    const [endHour, endMinute] = props.constraint.endTime.split(":");
    endDate.setHours(endHour);
    endDate.setMinutes(endMinute);

    const [sundayValue, setSundayValue] = React.useState(props.constraint.daysOfWeek.includes(0));
    const [mondayValue, setMondayValue] = React.useState(props.constraint.daysOfWeek.includes(1));
    const [tuesdayValue, setTuesdayValue] = React.useState(props.constraint.daysOfWeek.includes(2));
    const [wednesdayValue, setWednesdayValue] = React.useState(props.constraint.daysOfWeek.includes(3));
    const [thursdayValue, setThursdayValue] = React.useState(props.constraint.daysOfWeek.includes(4));
    const [fridayValue, setFridayValue] = React.useState(props.constraint.daysOfWeek.includes(5));
    const [saturdayValue, setSaturdayValue] = React.useState(props.constraint.daysOfWeek.includes(6));
    const [constraintStartTime, setConstraintStartTime] = React.useState(new Date(startDate));
    const [constraintEndTime, setConstraintEndTime] = React.useState(new Date(endDate));
    const [constraintNameValue, setConstraintNameValue] = React.useState(props.constraint.title);

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
        const id = props.constraint.id;
        props.handleConstraintDelete(id);
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
        <div>
            <table>
                <tbody>
                    <tr>
                        <td><label>Name: </label></td>
                        <td><input type="textbox" onChange={(newValue) => setConstraintNameValue(newValue.target.value)} value={constraintNameValue}></input></td>
                    </tr>
                    <tr>
                        <td><label>Days of Week: </label></td>
                        <td id="daysDiv">
                            <label>Sunday</label><input type="checkbox" checked={sundayValue} onChange={(newValue) => { setSundayValue(newValue.target.checked); }}></input>
                            <label>Monday</label><input type="checkbox" checked={mondayValue} onChange={(newValue) => { setMondayValue(newValue.target.checked); }}></input>
                            <label>Tuesday</label><input type="checkbox" checked={tuesdayValue} onChange={(newValue) => { setTuesdayValue(newValue.target.checked); }}></input>
                            <label>Wednesday</label><input type="checkbox" checked={wednesdayValue} onChange={(newValue) => { setWednesdayValue(newValue.target.checked); }}></input>
                            <label>Thursday</label><input type="checkbox" checked={thursdayValue} onChange={(newValue) => { setThursdayValue(newValue.target.checked); }}></input>
                            <label>Friday</label><input type="checkbox" checked={fridayValue} onChange={(newValue) => { setFridayValue(newValue.target.checked); }}></input>
                            <label>Saturday</label><input type="checkbox" checked={saturdayValue} onChange={(newValue) => { setSaturdayValue(newValue.target.checked); }}></input>
                        </td>
                    </tr>
                    <tr>
                        <td><label>Start Time: </label></td>
                        <td className="whiteFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <TimePicker
                                    value={constraintStartTime}
                                    onChange={(newValue) => { setConstraintStartTime(newValue) }}
                                    renderInput={(params) => <TextField {...params} />}
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                    <tr>
                        <td><label>End Time: </label></td>
                        <td className="whiteFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <TimePicker
                                    value={constraintEndTime}
                                    onChange={(newValue) => { setConstraintEndTime(newValue) }}
                                    renderInput={(params) => <TextField {...params} />}
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                    <tr>
                        <td><button onClick={handleSaveChangesClick}>Save Changes</button></td>
                        <td><button onClick={handleDeleteClick}>Delete</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}