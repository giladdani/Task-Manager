import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import Button from "@material-ui/core/Button";

export const PendingProject = (props) => {
    const [projectTitle, setProjectName] = useState(props.project.title);
    const [startDate, setStartDate] = useState(new Date(props.project.start));
    const [endDate, setEndDate] = useState(new Date(props.project.end));
    const [isBeingEdited, setIsBeingEdited] = useState(false);
    const [approvingUsersUser, setApprovedByUser] = useState(false);
    const [approvingUsers, setApprovingUsers] = useState([]);
    const [awaitingApproval, setAwaitingApproval] = useState([]);

    useEffect(async () => {
        const userEmail = sessionStorage.getItem('user_email');

        setApprovedByUser(hasUserApprovedProject(userEmail, props.project))

        setApprovingUsers(props.project.approvingUsers);
        setAwaitingApproval(props.project.awaitingApproval);
    });

    const hasUserApprovedProject = (userEmail, pendingProject) => {
        return pendingProject.approvingUsers.includes(userEmail);
    }

    const handleOnApproveClick = () => {
        props.approveProject(props.project);
    }

    return (
        <>
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
                    <tr>
                        <td>
                            <label>Approved By: </label>
                        </td>
                        <td>
                            {
                                approvingUsers.map((email, index) => (
                                    <p key={index}>{email}</p>
                                ))
                            }
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label>Awaiting Approval: </label>
                        </td>
                        <td>
                            {
                                awaitingApproval.map((email, index) => (
                                    <p key={index}>{email}</p>
                                ))
                            }
                        </td>
                    </tr>
                    <tr>

                    </tr>
                </tbody>
            </table>
            <Button variant='contained' disabled={approvingUsersUser} onClick={handleOnApproveClick}>Approve</Button>
        </div>
        </>
    )
}