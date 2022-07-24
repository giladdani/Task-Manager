import * as React from 'react';
import { useState, useEffect } from 'react';
import { ConstraintsList } from '../components/ConstraintsList';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

export const Constraints = () => {
    // Hooks
    const [sundayValue, setSundayValue] = useState(false);
    const [mondayValue, setMondayValue] = useState(false);
    const [tuesdayValue, setTuesdayValue] = useState(false);
    const [wednesdayValue, setWednesdayValue] = useState(false);
    const [thursdayValue, setThursdayValue] = useState(false);
    const [fridayValue, setFridayValue] = useState(false);
    const [saturdayValue, setSaturdayValue] = useState(false);
    const [constraintStartTime, setConstraintStartTime] = useState(new Date());
    const [constraintEndTime, setConstraintEndTime] = useState(new Date());
    const [constraintNameValue, setConstraintNameValue] = useState("");
    const [allConstraints, setAllConstraints] = useState([]);

    useEffect(async () => {
        const constraints = await fetchConstraints();
        setAllConstraints(constraints);
    });

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
        try {
            const days = getCheckedDays(); // TODO: change to numbers to match FullCalendar

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

            if (response.status !== 200) {
                throw new Error('Error while adding constraint');
            } else {
                console.log('Constraint added');
                alert("Constraints added!");

                const constraints = await fetchConstraints();
                setAllConstraints(constraints);
            }
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

    const fetchConstraints = async () => {
        const response = await fetch('http://localhost:3001/api/constraints', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'access_token': sessionStorage.getItem('access_token')
            },
            method: 'GET'
        });

        if (response.status !== 200) throw new Error('Error while fetching constraints')
        const data = await response.json();
        return data;
    }

    const handleConstraintUpdate = async (partialConstraintEvent) => {
        console.log(`Updating constraint ${partialConstraintEvent.title}`);

        try {
            const body = {
                days: partialConstraintEvent.days,
                forbiddenStartDate: partialConstraintEvent.forbiddenStartDate,
                forbiddenEndDate: partialConstraintEvent.forbiddenEndDate,
                title: partialConstraintEvent.title,
            };

            const response = await fetch(`http://localhost:3001/api/constraints/${partialConstraintEvent.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token'),
                },
                method: 'PUT',
                body: JSON.stringify(body),
            });

            if (response.status !== 200) throw new Error(`Error while updating constraint: '${partialConstraintEvent.title}'`)
            console.log(`Constraint updated: '${partialConstraintEvent.title}'`);
            alert(`Constraint ${body.title} updated successfully`);

            const constraints = await fetchConstraints();
            setAllConstraints(constraints);
        }
        catch (err) {
            console.error(err);
        }
    }

    const handleConstraintDelete = async (constraintID) => {
        try {
            const response = await fetch(`http://localhost:3001/api/constraints/${constraintID}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token'),
                },
                method: 'DELETE',
            });

            if (response.status !== 200) throw new Error('Error while deleting constraint')
            console.log(`Constraint ${constraintID} deleted`);

            const constraints = await fetchConstraints();
            setAllConstraints(constraints);
        }
        catch (err) {
            console.error(err);
        }
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
            <ConstraintsList
                constraints={allConstraints}
                handleConstraintUpdate={handleConstraintUpdate}
                handleConstraintDelete={handleConstraintDelete}
            >
            </ConstraintsList>
        </div>
    )
}