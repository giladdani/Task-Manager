import * as React from 'react';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

export const Constraints = () => {
    const daysDict = [];
    const [constraintStartTime, setConstraintStartTime] = React.useState(new Date());
    const [constraintEndTime, setConstraintEndTime] = React.useState(new Date());
    const handleCreateClick = () => {
        functionwewilldelete();
        alert(`Start time: ${constraintStartTime} ${daysDict["Sunday"]}`);
    }

    const functionwewilldelete = () => {
        daysDict["Sunday"] = document.getElementById("sundayCheckbox").checked;
        daysDict["Monday"] = document.getElementById("mondayCheckbox").checked;
        daysDict["Tuesday"] = document.getElementById("tuesdayCheckbox").checked;
        daysDict["Wednesday"] = document.getElementById("wednesdayCheckbox").checked;
        daysDict["Thursday"] = document.getElementById("thursdayCheckbox").checked;
        daysDict["Friday"] = document.getElementById("fridayCheckbox").checked;
        daysDict["Saturday"] = document.getElementById("saturdayCheckbox").checked;
    }

    const days = <div id="daysDiv">
                    <label>Sunday</label><input id="sundayCheckbox" type="checkbox"></input>
                    <label>Monday</label><input id="mondayCheckbox" type="checkbox"></input>
                    <label>Tuesday</label><input id="tuesdayCheckbox" type="checkbox"></input>
                    <label>Wednesday</label><input id="wednesdayCheckbox" type="checkbox"></input>
                    <label>Thursday</label><input id="thursdayCheckbox" type="checkbox"></input>
                    <label>Friday</label><input id="fridayCheckbox" type="checkbox"></input>
                    <label>Saturday</label><input id="saturdayCheckbox" type="checkbox"></input>
                </div>

    return(
            <div>
                <h1>Create constraint</h1>
                <table>
                    <tbody>
                        <tr>
                            <td><label>Day:</label></td>
                            <td>
                                {days}
                            </td>
                        </tr>
                        <tr>
                            <td><label>Start time:</label></td>
                            <td>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                                    <TimePicker
                                                                        value={constraintStartTime}
                                                                        onChange={(newValue) => {
                                                                            setConstraintStartTime(newValue);
                                                                        }}
                                                                        renderInput={(params) => <TextField {...params} />}
                                                                    />
                                </LocalizationProvider>
                            </td>
                        </tr>
                        <tr>
                            <td><label>End time:</label></td>
                            <td><LocalizationProvider dateAdapter={AdapterDateFns}>
                                                                    <TimePicker
                                                                        value={constraintEndTime}
                                                                        onChange={(newValue) => {
                                                                            setConstraintEndTime(newValue);
                                                                        }}
                                                                        renderInput={(params) => <TextField {...params} />}
                                                                    />
                                </LocalizationProvider>
                            </td>
                        </tr>
                        <tr>
                            <td><label>Repeat:</label><select></select></td>
                        </tr>
                        <tr>
                            <td colSpan="2"><button onClick={handleCreateClick}>Create</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
    )
}