import * as React from 'react';
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

    const days = <div id="daysDiv">
                    <label>Sunday</label><input type="checkbox" onChange={(newValue) => {setSundayValue(newValue.target.checked);}}></input>
                    <label>Monday</label><input type="checkbox" onChange={(newValue) => {setMondayValue(newValue.target.checked);}}></input>
                    <label>Tuesday</label><input type="checkbox" onChange={(newValue) => {setTuesdayValue(newValue.target.checked);}}></input>
                    <label>Wednesday</label><input type="checkbox" onChange={(newValue) => {setWednesdayValue(newValue.target.checked);}}></input>
                    <label>Thursday</label><input type="checkbox" onChange={(newValue) => {setThursdayValue(newValue.target.checked);}}></input>
                    <label>Friday</label><input type="checkbox" onChange={(newValue) => {setFridayValue(newValue.target.checked);}}></input>
                    <label>Saturday</label><input type="checkbox" onChange={(newValue) => {setSaturdayValue(newValue.target.checked);}}></input>
                </div>

    const handleCreateClick = () => {
        // Send all values to server (constraintStartTime, constraintEndTime, [sundayValue, mondayValue, ...])
    }

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
                                <LocalizationProvider dateAdapter={AdapterDateFns} className="whiteFont">
                                    <TimePicker
                                    value={constraintStartTime}
                                    onChange={(newValue) => {setConstraintStartTime(newValue)}}
                                    renderInput={(params) => <TextField {...params}  className="whiteFont"/>}
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
                                    onChange={(newValue) => {setConstraintEndTime(newValue)}}
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
            </div>
    )
}