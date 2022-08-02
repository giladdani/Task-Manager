import * as React from 'react';
import { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import Button from "@material-ui/core/Button";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Tooltip from "@material-ui/core/Tooltip";

export const SuggestedEvent = (props) => {
    const allEvents = props.projectEvents;

    const [title, setProjectName] = useState(props.event.title);
    const [start, setStartDate] = useState(new Date(props.event.start));
    const [end, setEndDate] = useState(new Date(props.event.end));
    const [isBeingEdited, setIsBeingEdited] = React.useState(false);

    return (
        <>
            <table>
                <tbody>
                    <tr>
                        <td><label>Name: </label></td>
                        <td>
                            <input
                                type="text"
                                value={title}
                                disabled={!isBeingEdited}
                                onChange={(newValue) => { setProjectName(newValue.target.value) }}>
                            </input>
                        </td>
                    </tr>
                    <tr>
                        <td><label>Start: </label></td>
                        <td className="whiteTimeFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    value={start}
                                    inputFormat="HH:mm dd/MM/yyyy"
                                    onChange={(newValue) => { setStartDate(newValue) }}
                                    renderInput={(props) => <TextField {...props} />}
                                    disabled={!isBeingEdited}
                                    ampm={false}
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                    <tr>
                        <td><label>End: </label></td>
                        <td className="whiteTimeFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    value={end}
                                    inputFormat="HH:mm dd/MM/yyyy"
                                    onChange={(newValue) => { setEndDate(newValue) }}
                                    renderInput={(props) => <TextField {...props} />}
                                    disabled={!isBeingEdited}
                                    ampm={false}
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                </tbody>
            </table>
        </>
    )
}