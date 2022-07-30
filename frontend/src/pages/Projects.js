import * as React from 'react';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import { PendingProjectsList } from '../components/PendingProjectList';


export const Projects = (props) => {

    // Hooks
    const [projectTitle, setProjectName] = React.useState('');
    const [userEmailToShareWith, setUserEmailToShareWith] = React.useState('');
    const [estimatedTime, setEstimatedTime] = React.useState(0);
    const [sessionLengthMinutes, setSessionLengthMinutes] = React.useState(0);
    const [spacingLengthMinutes, setSpacingLengthMinutes] = React.useState(0);
    const [startDate, setStartDate] = React.useState(new Date());
    const [endDate, setEndDate] = React.useState(new Date());
    const [maxEventsPerDay, setMaxEventsPerDay] = React.useState();
    const [dayRepetitionFrequency, setDayRepetitionFrequency] = React.useState(1); // Determines how frequent the sessions are - every day? Every 3 days? Etc.
    const [pendingProjects, setPendingProjects] = React.useState([]);


    React.useEffect(async () => {
    });

    const handleGenerateClick = async () => {
        try {
            let errorMsg = checkInputValidity();
            if (errorMsg != null) {
                alert(errorMsg);
                return;
            }

            const allEvents = props.events.events;
            const body = {
                userEmailToShareWith: userEmailToShareWith,
                projectTitle: projectTitle,
                sessionLengthMinutes: sessionLengthMinutes,
                spacingLengthMinutes: spacingLengthMinutes,
                estimatedTime: estimatedTime,
                startDate: startDate,
                endDate: endDate,
                allEvents: allEvents,
                maxEventsPerDay: maxEventsPerDay,
                dayRepetitionFrequency: dayRepetitionFrequency,
            };

            if (userEmailToShareWith && userEmailToShareWith.length > 0) { // TODO: add regex check for email
                const response = await fetch('http://localhost:3001/api/projects/shared', {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'access_token': sessionStorage.getItem('access_token'),
                    },
                    method: 'POST',
                    body: JSON.stringify(body),
                });

                if (response.status !== 200) {
                    let errorMsg = await response.text();
                    throw new Error('Invalid parameters for the project:\n\n' + errorMsg)
                }

                console.log(`Sent request for a shared project with ${userEmailToShareWith}`);
                alert(`Sent a request to ${userEmailToShareWith}. Awaiting his approval.`);
            } else {
                const response = await fetch('http://localhost:3001/api/projects', {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'access_token': sessionStorage.getItem('access_token'),
                    },
                    method: 'POST',
                    body: JSON.stringify(body),
                });

                if (response.status !== 200) {
                    let errorMsg = await response.text();
                    throw new Error('Invalid parameters for the project:\n\n' + errorMsg)
                }

                let jsonRes = await response.json();
                let estimatedTimeLeft = Number(jsonRes.estimatedTimeLeft);
                let msg = "";
                if (estimatedTimeLeft > 0) {
                    msg = `Project added.
                    \nNote! There was not enough time to match the estimated hours.
                    Estimated time left: ${estimatedTimeLeft}`
                } else {
                    msg = `Project added.`;
                }

                console.log(msg);
                alert(msg);
            }
        }
        catch (err) {
            console.error(err);
            alert(err);
        }
    }

    /**
     * 
     * @returns a string with the type of error. Null if no error is found.
     */
    function checkInputValidity() {
        let errorMsg = "";

        if (!projectTitle || projectTitle.length === 0) {
            errorMsg += "   - Must enter project name.\n";
        }

        if (!isPositiveInteger(estimatedTime)) {
            errorMsg += "   - Estimated time for project must be a positive integer.\n";
        }

        if (!isPositiveInteger(sessionLengthMinutes)) {
            errorMsg += "   - Session length must be a positive integer.\n";
        }

        if (!isPositiveInteger(spacingLengthMinutes)) {
            errorMsg += "   - Break between sessions must be a positive integer.\n";
        }

        if (maxEventsPerDay !== null && maxEventsPerDay !== undefined) {
            if (!isPositiveInteger(maxEventsPerDay)) {
                errorMsg += "   - Max sessions per day must be a positive integer, or left blank for unlimited (as much as possible).\n";
            }
        }

        if (!isPositiveInteger(dayRepetitionFrequency)) {
            errorMsg += "   - Day repetition frequency must be a positive integer.\n";
        }

        const currDate = new Date();

        if (endDate <= startDate) {
            errorMsg += "   - End date must be later than start date.\n";
        }

        if (endDate <= currDate) {
            errorMsg += "   - End date must be later than current date.\n";
        }

        if (errorMsg.length === 0) {
            errorMsg = null;
        }

        return errorMsg;
    }

    function isPositiveInteger(input) {
        const num = Number(input);

        if (Number.isInteger(num) && num > 0) {
            return true;
        }

        return false;
    }

    return (
        <div>
            <h1>Generate</h1>
            <table>
                <tbody>
                    <tr>
                        <td><label>Share with user: </label></td>
                        <td>
                            <input type="text" onChange={(newValue) => { setUserEmailToShareWith(newValue.target.value) }}></input>
                        </td>
                    </tr>
                    <tr>
                        <td><label>Project Name:</label></td>
                        <td>
                            <input type="text" onChange={(newValue) => { setProjectName(newValue.target.value) }}></input>
                        </td>
                    </tr>
                    <tr>
                        <td><label>Estimated Time (Hours):</label></td>
                        <td>
                            <input type="number" min="1" step="1" onChange={(newValue) => { setEstimatedTime(newValue.target.value) }}></input>
                        </td>
                    </tr>
                    <tr>
                        <td><label>Session Length (Minutes):</label></td>
                        <td>
                            <input type="number" min="1" step="1" onChange={(newValue) => { setSessionLengthMinutes(newValue.target.value) }}></input>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Tooltip title="How long of a break\spacing would you like between your sessions?">
                                <label>Break Between Sessions (Minutes):</label>
                            </Tooltip>
                        </td>
                        <td>
                            <input type="number" min="1" step="1" onChange={(newValue) => { setSpacingLengthMinutes(newValue.target.value) }}></input>
                        </td>
                    </tr>
                    <tr>
                        <td><label>Start Date:</label></td>
                        <td className="whiteTimeFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    value={startDate}
                                    onChange={(newValue) => { setStartDate(newValue) }}
                                    renderInput={(props) => <TextField {...props} />}
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                    <tr>
                        <td><label>End Date:</label></td>
                        <td className="whiteTimeFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    value={endDate}
                                    onChange={(newValue) => { setEndDate(newValue) }}
                                    renderInput={(props) => <TextField {...props} />}
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Tooltip title="How many sessions at maximum per day. Leave undefined for unlimited (as much as possible).">
                                <label>Max sessions per day: </label>
                            </Tooltip>
                        </td>
                        <td>
                            <input type="number" onChange={(newValue) => { setMaxEventsPerDay(newValue.target.value) }}></input>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Tooltip title="Day repetition determines how frequently the sessions will occur, e.g. 3 for every 3 days, 1 for every day, etc.">
                                <label>
                                    Day repetition:
                                </label>
                            </Tooltip>
                        </td>
                        <td>
                            <input
                                type="number"
                                value={dayRepetitionFrequency}
                                min="1" step="1"
                                onChange={(newValue) => { setDayRepetitionFrequency(newValue.target.value) }}>
                            </input>
                        </td>
                    </tr>
                    <tr>
                        <td><Button variant='contained' onClick={handleGenerateClick}>Generate</Button></td>
                    </tr>
                </tbody>
            </table>
            <PendingProjectsList allEvents={props.events}/>
        </div>
    )
}
