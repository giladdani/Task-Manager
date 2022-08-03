import * as React from 'react';
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

export const PendingProject = (props) => {
    const [projectTitle, setProjectName] = React.useState(props.project.title);
    const [startDate, setStartDate] = React.useState(new Date(props.project.start));
    const [endDate, setEndDate] = React.useState(new Date(props.project.end));
    const [isBeingEdited, setIsBeingEdited] = React.useState(false);

    const handleOnApproveClick = () => {
        props.approveProject(props.project);
    }

    return (
        <div>
            <table>
                <tbody>
                    <tr>
                        <td><label>Name: </label></td>
                        <td>
                            <input
                                type="text"
                                value={projectTitle}
                                disabled={!isBeingEdited}
                                onChange={(newValue) => { setProjectName(newValue.target.value) }}>
                            </input>
                        </td>
                    </tr>
                    <tr>
                        <td><label>Requesting User: </label></td>
                        <td>
                            <input
                                type="text"
                                value={props.project.requestingUser}
                                disabled
                            ></input>
                        </td>
                    </tr>
                    <tr>
                        <td><label>Time Estimate: </label></td>
                        <td>{props.project.timeEstimate}</td>
                    </tr>
                    <tr>
                        <td><label>Start date: </label></td>
                        <td className="whiteTimeFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    value={startDate}
                                    inputFormat="dd/MM/yyyy HH:mm"
                                    onChange={(newValue) => { setStartDate(newValue) }}
                                    renderInput={(props) => <TextField {...props} />}
                                    disabled={!isBeingEdited}
                                    ampm={false}
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                    <tr>
                        <td><label>End date:</label></td>
                        <td className="whiteTimeFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    value={endDate}
                                    inputFormat="dd/MM/yyyy HH:mm"
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
            <Button variant='contained' onClick={handleOnApproveClick}>Approve</Button>
        </div>
    )
}