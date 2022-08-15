import { useState, useEffect, useRef } from 'react';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import { ThreeDots } from 'react-loader-spinner'
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { DynamicInputList } from '../components/DynamicInputList';
import MultipleSelectChip from '../components/MultipleSelectChip';
import { DaysCheckbox } from '../components/general/DaysCheckbox';
import { getCheckedDays } from '../components/general/DaysCheckbox';
const ConstraintsAPI = require('../apis/ConstraintsAPI.js');
const ProjectsAPI = require('../apis/ProjectsAPI.js');


export const Projects = (props) => {
    let tempEndDate = new Date();
    tempEndDate.setHours(23, 59, 0, 0);
    tempEndDate.setMonth(tempEndDate.getMonth() + 1);

    // Hooks
    const [successDialogOpen, toggleSuccessDialog] = useState(false);
    const [isLoading, toggleLoading] = useState(false);
    const [projectTitle, setProjectName] = useState('');
    const [estimatedTime, setEstimatedTime] = useState(0);
    const [sessionLengthMinutes, setSessionLengthMinutes] = useState(0);
    const [spacingLengthMinutes, setSpacingLengthMinutes] = useState(0);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(tempEndDate);
    const [maxEventsPerDay, setMaxEventsPerDay] = useState();
    const [dayRepetitionFrequency, setDayRepetitionFrequency] = useState(1); // Determines how frequent the sessions are - every day? Every 3 days? Etc.
    const [dailyStartHour, setDailyStartHour] = useState(new Date().setHours(0, 0, 0, 0));
    const [dailyEndHour, setDailyEndHour] = useState(new Date().setHours(23, 59, 0, 0));
    const [constraints, setConstraints] = useState([]);
    const [ignoredConstraintIds, setIgnoredConstraintsIds] = useState([]);
    const [shareChecked, setShareChecked] = useState(false);
    const [emailList, setEmailList] = useState([]);
    const [projectCreationMsg, setProjectCreationMsg] = useState("");
    const [daysOfWeek, setDaysOfWeek] = useState();
    const componentMounted = useRef(true);

    useEffect(async () => {
        const tempConstraints = await ConstraintsAPI.fetchConstraints();
        setConstraints(tempConstraints);
    }, [])

    /*
        useEffect(() => {
            const fetchData = async () => {
                let tempConstraints = await ConstraintsAPI.fetchConstraints();
    
                if (componentMounted.current) {
                    setConstraints(tempConstraints);
                } else {
                    console.log(`[Projects - update constraints] component is unmounted, not updating constraints!`)
                }
            }
    
            fetchData();
    
            return () => {
                componentMounted.current = false;
            }
        }, []);
        */

    const handleGenerateClick = async () => {
        try {
            let errorMsg = checkInputValidity();
            if (errorMsg != null) {
                alert(errorMsg);
                return;
            }

            let participatingEmails = getParticipatingEmails();

            const body = {
                participatingEmails: participatingEmails,
                projectTitle: projectTitle,
                sessionLengthMinutes: sessionLengthMinutes,
                spacingLengthMinutes: spacingLengthMinutes,
                estimatedTime: estimatedTime,
                startDate: startDate,
                endDate: endDate,
                maxEventsPerDay: maxEventsPerDay,
                dayRepetitionFrequency: dayRepetitionFrequency,
                daysOfWeek: daysOfWeek,
                dailyStartHour: dailyStartHour,
                dailyEndHour: dailyEndHour,
                ignoredConstraintsIds: ignoredConstraintIds,
            };

            let response;
            let error;
            if (shareChecked) {
                [response, error] = await ProjectsAPI.createSharedProject(body);
                alert(`Sent a request to share. Awaiting users approval.`);
            } else {
                toggleLoading(true);
                [response, error] = await ProjectsAPI.createIndividualProject(body);

                let msg = "";
                if (!error) {
                    let jsonRes = await response.json();
                    let estimatedTimeLeft = Number(jsonRes.estimatedTimeLeft);
                    if (estimatedTimeLeft > 0) {
                        msg = `Project added.
                        \nNote! There was not enough time to match the estimated hours.
                        Estimated time left: ${estimatedTimeLeft}`
                    } else {
                        msg = `Project added.`;
                    }
                } else {
                    msg = "Whoops, something went wrong!"; // TODO: fetch message from the server's response?
                }

                toggleLoading(false);
                setProjectCreationMsg(msg);
                console.log(msg);
                toggleSuccessDialog(true);
            }
        }
        catch (err) {
            toggleLoading(false);
            console.error(err);
            alert(err);
        }
    }

    function getParticipatingEmails() {
        let participatingEmails = [];
        let userEmail = sessionStorage.getItem('user_email');
        let foundUserEmail = false;

        for(const email of emailList) {
            participatingEmails.push(email);
            foundUserEmail = foundUserEmail || (email === userEmail);
        }
        
        if (!foundUserEmail) {
            participatingEmails.push(userEmail);
        }

        return participatingEmails;
    }

    /**
     * 
     * @returns a string with the type of error. Null if no error is found.
     */
    function checkInputValidity() {
        let errorMsg = "";

        for (let [index, val] of emailList.entries()) {
            if (val.length > 0) {
                if (!isValidEmail(val)) {
                    errorMsg += `   - email ${index + 1} ('${val}') is not valid.\n`;
                }

                if (val === sessionStorage.getItem('user_email')) {
                    errorMsg += `   - Cannot insert your own email to share with.\n`
                }
            }
        }

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

        {
            // TODO: add a check if user wants repetition frequency or specific days
            if (!isPositiveInteger(dayRepetitionFrequency)) {
                errorMsg += "   - Day repetition frequency must be a positive integer.\n";
            }

            if (daysOfWeek.length === 0) {
                errorMsg += "   - Must have at least one day checked.\n";
            }
        }

        const currDate = new Date();

        if (endDate <= startDate) {
            errorMsg += "   - End date must be later than start date.\n";
        }

        if (endDate <= currDate) {
            errorMsg += "   - End date must be later than current date.\n";
        }

        if (dailyStartHour >= dailyEndHour) {
            errorMsg += "   - Daily start hour must be earlier than daily end hour."
        }

        if (errorMsg.length === 0) {
            errorMsg = null;
        }

        return errorMsg;
    }

    function isValidEmail(email) {
        const re =
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        return re.test(String(email).toLowerCase());
    }

    function isPositiveInteger(input) {
        const num = Number(input);

        if (Number.isInteger(num) && num > 0) {
            return true;
        }

        return false;
    }

    function areAnyDaysChecked(days) {
        let foundCheckedDay = false;

        foundCheckedDay = foundCheckedDay || days.sundayValue;
        foundCheckedDay = foundCheckedDay || days.mondayValue;
        foundCheckedDay = foundCheckedDay || days.tuesdayValue;
        foundCheckedDay = foundCheckedDay || days.wednesdayValue;
        foundCheckedDay = foundCheckedDay || days.thursdayValue;
        foundCheckedDay = foundCheckedDay || days.fridayValue;
        foundCheckedDay = foundCheckedDay || days.saturdayValue;

        return foundCheckedDay;
    }

    function handleDialogClose() {
        toggleSuccessDialog(false);
    }

    const onSelectConstraintChange = (selectedConstraints) => {
        const chosenConstraintIds = selectedConstraints.map(constraint => constraint.id);
        setIgnoredConstraintsIds(chosenConstraintIds);
    }

    const handleShareCheckboxChange = (event) => {
        setShareChecked(event.target.checked);
    }

    const updateEmailList = (emailList) => {
        let newList = [];

        for (const email of emailList) {
            if (email.value.length > 0) {
                newList.push(email.value);
            }
        }

        setEmailList(newList);
    }

    const handleSetDays = (daysArr) => {
        setDaysOfWeek(daysArr);
    }

    return (
        <>
            <h1>Create project schedule</h1>
            <table>
                <tbody>
                    <tr>
                        <td>
                            <label>Users to share with: </label>
                        </td>
                        <td>
                            <FormControlLabel
                                control={<Checkbox
                                    checked={shareChecked}
                                    onChange={handleShareCheckboxChange}
                                />}
                                label="Share"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>
                            <DynamicInputList
                                disabled={!shareChecked}
                                updateList={updateEmailList}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label>Project Name:</label>
                        </td>
                        <td>
                            <input type="text" onChange={(newValue) => { setProjectName(newValue.target.value) }}></input>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label>Estimated Time (Hours):</label>
                        </td>
                        <td>
                            <input type="number" min="1" step="1" onChange={(newValue) => { setEstimatedTime(newValue.target.value) }}></input>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label>Session Length (Minutes):</label>
                        </td>
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
                                    inputFormat="dd/MM/yyyy HH:mm"
                                    onChange={(newValue) => { setStartDate(newValue) }}
                                    renderInput={(props) => <TextField {...props} />}
                                    ampm={false}
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
                                    inputFormat="dd/MM/yyyy HH:mm"
                                    onChange={(newValue) => { setEndDate(newValue) }}
                                    renderInput={(props) => <TextField {...props} />}
                                    ampm={false}
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                    <tr>
                    </tr>
                    <tr>
                        <td>
                            <Tooltip title="These determine what is the daily time frame you would like for the project's events. For example, setting 15:00-19:00 means the application will only fit your sessions within those hours.">
                                <p>Daily time frame</p>
                            </Tooltip>
                        </td>
                    </tr>
                    <tr>
                        <td><label>Start time:</label></td>
                        <td className="whiteTimeFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <TimePicker
                                    value={dailyStartHour}
                                    onChange={(newValue) => { setDailyStartHour(newValue) }}
                                    renderInput={(params) => <TextField {...params} />}
                                    ampm={false}
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                    <tr>
                        <td><label>End time:</label></td>
                        <td className="whiteTimeFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <TimePicker
                                    value={dailyEndHour}
                                    onChange={(newValue) => { setDailyEndHour(newValue) }}
                                    renderInput={(params) => <TextField {...params} />}
                                    ampm={false}
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
                            <Tooltip title="Determine which days you would like to work on the project.">
                                <label>
                                    Day repetition:
                                </label>
                            </Tooltip>
                        </td>
                        <td>
                            <DaysCheckbox startChecked={true} setDays={handleSetDays}></DaysCheckbox>
                        </td>
                        {/* <td>
                            <input
                                type="number"
                                value={dayRepetitionFrequency}
                                min="1" step="1"
                                onChange={(newValue) => { setDayRepetitionFrequency(newValue.target.value) }}>
                            </input>
                        </td> */}
                    </tr>
                    <tr>
                        <td>
                            <label>Constraints to ignore: </label>
                        </td>
                        <td>
                            <form >
                                {/* <select
                                    onChange={onSelectConstraintChange}
                                    name="constraints" id="constraints" multiple>
                                    {constraints.map((constraint, index) => {
                                        return <option key={index} id={constraint.id} value={constraint.id}>{constraint.title}</option>
                                    })}
                                </select> */}
                                <MultipleSelectChip items={constraints} onSelectChange={onSelectConstraintChange}></MultipleSelectChip>
                            </form>
                        </td>
                    </tr>
                </tbody>
            </table>

            <Button variant='contained' onClick={handleGenerateClick} disabled={isLoading}>Generate</Button>

            <Dialog open={isLoading}>
                <DialogTitle>generating project schedule...</DialogTitle>
                <DialogContent><ThreeDots color="#00BFFF" height={80} width={80} /></DialogContent>
            </Dialog>

            <Dialog open={successDialogOpen}>
                <DialogTitle>Success!</DialogTitle>
                <DialogContent>Project created successfully.</DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    )
}
