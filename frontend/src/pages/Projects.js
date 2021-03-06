import * as React from 'react';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

export const Projects = (props) => {

    // Hooks
    const [projectName, setProjectName] = React.useState('');
    const [estimatedTime, setEstimatedTime] = React.useState(0);
    const [sessionLengthMinutes, setSessionLengthMinutes] = React.useState(0);
    const [spacingBetweenSessions, setSpacingBetweenSessions] = React.useState(0);
    const [startDate, setStartDate] = React.useState(new Date());
    const [endDate, setEndDate] = React.useState(new Date());

    const handleGenerateClick = async () => {
        try {

            // Get all events from Calendar


            // let calendarApi = props.calendarRef.current.getApi(); // TODO: make this global? because we duplicate this line
            // const allEvents = calendarApi.getEvents();
            const allEvents = props.events.events;

            const body = {
                projectName: projectName,
                sessionLengthMinutes: sessionLengthMinutes,
                spacingLengthMinutes: spacingBetweenSessions,
                estimatedTime: estimatedTime,
                startDate: startDate,
                endDate: endDate,
                allEvents: allEvents,
            };

            const response = await fetch('http://localhost:3001/api/projects', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token'),
                },
                method: 'POST',
                body: JSON.stringify(body),
            });

            if (response.status !== 200) throw new Error('Error while creating project')


            let jsonRes = response.json();

            console.log('Project added');
            alert("Project added");
        }
        catch (err) {
            console.error(err);
        }
    }

    return (
        <div>
            <h1>Generate</h1>
            <table>
                <tbody>
                    <tr>
                        <td><label>Project Name:</label></td>
                        <td>
                            <input type="text" onChange={(newValue) => { setProjectName(newValue.target.value) }}></input>
                        </td>
                    </tr>
                    <tr>
                        <td><label>Estimated Time (Hours):</label></td>
                        <td>
                            <input type="number" onChange={(newValue) => { setEstimatedTime(newValue.target.value) }}></input>
                        </td>
                    </tr>
                    <tr>
                        <td><label>Session Length (Minutes):</label></td>
                        <td>
                            <input type="number" onChange={(newValue) => { setSessionLengthMinutes(newValue.target.value) }}></input>
                        </td>
                    </tr>
                    <tr>
                        <td><label>Break Between Sessions (Minutes):</label></td>
                        <td>
                            <input type="number" onChange={(newValue) => { setSpacingBetweenSessions(newValue.target.value) }}></input>
                        </td>
                    </tr>
                    <tr>
                        <td><label>Start Date:</label></td>
                        <td>
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
                        <td>
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
                        <td><button onClick={handleGenerateClick}>Generate</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}