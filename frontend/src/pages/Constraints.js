import * as React from 'react';
import { ConstraintsList } from '../components/ConstraintsList';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

export const Constraints = () => {
    // Hooks
    const [sundayValue, setSundayValue] = React.useState(false);
    const [mondayValue, setMondayValue] = React.useState(false);
    const [tuesdayValue, setTuesdayValue] = React.useState(false);
    const [wednesdayValue, setWednesdayValue] = React.useState(false);
    const [thursdayValue, setThursdayValue] = React.useState(false);
    const [fridayValue, setFridayValue] = React.useState(false);
    const [saturdayValue, setSaturdayValue] = React.useState(false);
    const [constraintStartTime, setConstraintStartTime] = React.useState(new Date());
    const [constraintEndTime, setConstraintEndTime] = React.useState(new Date());
    const [constraintNameValue, setConstraintNameValue] = React.useState("");

    const constraints = []; // TODO: fetch all constraints in useEffect and when a constrtaint is created

    const days = <div id="daysDiv">
        <label>Sunday</label><input type="checkbox" onChange={(newValue) => { setSundayValue(newValue.target.checked); }}></input>
        <label>Monday</label><input type="checkbox" onChange={(newValue) => { setMondayValue(newValue.target.checked); }}></input>
        <label>Tuesday</label><input type="checkbox" onChange={(newValue) => { setTuesdayValue(newValue.target.checked); }}></input>
        <label>Wednesday</label><input type="checkbox" onChange={(newValue) => { setWednesdayValue(newValue.target.checked); }}></input>
        <label>Thursday</label><input type="checkbox" onChange={(newValue) => { setThursdayValue(newValue.target.checked); }}></input>
        <label>Friday</label><input type="checkbox" onChange={(newValue) => { setFridayValue(newValue.target.checked); }}></input>
        <label>Saturday</label><input type="checkbox" onChange={(newValue) => { setSaturdayValue(newValue.target.checked); }}></input>
    </div>

    const handleCreateClick = async () => {
        // Send all values to server (constraintStartTime, constraintEndTime, [sundayValue, mondayValue, ...])
        try {
            const days = getCheckedDays(); // TODO: change to numbers to match FullCalendar


            /* TODO: old version with our own TimeWindow. Delete?
            const startHour = constraintStartTime.getHours();
            const startMinute = constraintStartTime.getMinutes();
            const endHour = constraintEndTime.getHours();
            const endMinute = constraintEndTime.getMinutes();


            const body = {
                days: days, 
                startHour: startHour,
                startMinute: startMinute,
                endHour: endHour,
                endMinute: endMinute,
            };

            */

            const body = {
                days: days,
                forbiddenStartDate: constraintStartTime,
                forbiddenEndDate: constraintEndTime,
                title: constraintNameValue,
            };

            const response = await fetch('http://localhost:3001/api/constraints', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token'),
                },
                method: 'POST',
                body: JSON.stringify(body),
            });

            if (response.status !== 200) throw new Error('Error while adding constraint')
            console.log('Constraint added');
            alert("Constraints added!");
        }
        catch (err) {
            console.error(err);
        }
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
            <h1>Create constraint</h1>
            <table>
                <tbody>
                    <tr>
                        <td><label>Name:</label></td>
                        <td>
                            <input type="textbox" onChange={(newValue) => setConstraintNameValue(newValue.target.value)} value={constraintNameValue} />
                        </td>
                    </tr>
                    <tr>
                        <td><label>Day:</label></td>
                        <td>
                            {days}
                        </td>
                    </tr>
                    <tr>
                        <td><label>Start time:</label></td>
                        <td>
                            <LocalizationProvider dateAdapter={AdapterDateFns} className="whiteFont">
                                <TimePicker
                                    value={constraintStartTime}
                                    onChange={(newValue) => { setConstraintStartTime(newValue) }}
                                    renderInput={(params) => <TextField {...params} className="whiteFont" />}
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                    <tr>
                        <td><label>End time:</label></td>
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
                        <td><label>Repeat:</label></td>
                        <td>
                            <select>
                                <option>Daily</option>
                                <option>Weekly</option>
                                <option>Monthly</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td><button onClick={handleCreateClick}>Create</button></td>
                    </tr>
                </tbody>
            </table>
            <ConstraintsList></ConstraintsList>
        </div>
    )
}