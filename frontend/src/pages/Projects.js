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
import FormLabel from '@mui/material/FormLabel';
import { FormGroup } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import { DynamicInputList } from '../components/general/DynamicInputList';
import MultipleSelectChip from '../components/general/MultipleSelectChip';
import { DaysCheckbox } from '../components/general/DaysCheckbox';
import { isValidStatus } from '../apis/APIUtils';
import consts from '../utils/consts';
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
    const [daysOfWeek, setDaysOfWeek] = useState();

    useEffect(async () => {
        const tempConstraints = await ConstraintsAPI.fetchConstraintsData();
        setConstraints(tempConstraints);
    }, [])

    const handleGenerateClick = async () => {
        try {
            let errorMsg = checkInputValidity();
            if (errorMsg != null) {
                props.setMsg(errorMsg);
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

            if (shareChecked) {
                ProjectsAPI.createSharedProject(body)
                    .then(response => {
                        if (isValidStatus(response, ProjectsAPI.createSharedProjectValidStatusArr)) {
                            props.setNotificationMsg("Sent request to other users, awaiting their approval");
                        } else {
                            props.setNotificationMsg("Failed to create a shared project")
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        props.setNotificationMsg(consts.generalErrorMsg)
                    })
            } else {
                toggleLoading(true);

                let msg = "";
                ProjectsAPI.createIndividualProject(body)
                    .then(response => {
                        // TODO: set notification! See old code below
                        if (isValidStatus(response, ProjectsAPI.createIndividualProjectValidStatusArr)) {
                            msg = "Project created";
                        } else {
                            msg = "Failed to create project";
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        msg = consts.generalErrorMsg;
                    })
                    .finally(() => {
                        toggleLoading(false);
                        console.log(msg);
                        props.setNotificationMsg(msg);
                    })
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

        for (const email of emailList) {
            participatingEmails.push(email);
            foundUserEmail = foundUserEmail || (email === userEmail);
        }

        if (!foundUserEmail) {
            participatingEmails.push(userEmail);
        }

        return participatingEmails;
    }

    /**
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

    function isValidEmail(email) {      // TODO: move to a util file?
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
            <table className="whiteFont full_width">
                <tbody>
                    <tr>
                        <td>
                            <table className="spaced-table center_elem center_text">
                                <tbody>
                                    <tr>
                                        <td>
                                            <FormControlLabel control={<Checkbox checked={shareChecked} onChange={handleShareCheckboxChange} />} label="Shared project?"/>
                                        </td>
                                    </tr>
                                    <tr hidden={!shareChecked}>
                                        <td>
                                            <DynamicInputList
                                                disabled={!shareChecked}
                                                updateList={updateEmailList}
                                                placeholder="User email..."
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <TextField onChange={(newValue) => { setProjectName(newValue.target.value) }} variant="outlined" size="small" label="Project name" focused/>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <TextField
                                                type="number"
                                                onChange={(newValue) => { setEstimatedTime(newValue.target.value) }}
                                                InputProps={{ inputProps: { min: 0 } }}
                                                value={estimatedTime}
                                                size="small"
                                                label="Estimated time (hours)"
                                                focused
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <TextField
                                                type="number"
                                                onChange={(newValue) => { setSessionLengthMinutes(newValue.target.value) }}
                                                InputProps={{ inputProps: { min: 0 } }}
                                                value={sessionLengthMinutes}
                                                size="small"
                                                label="Session length (minutes)"
                                                focused
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <Tooltip title="How long of a break\spacing would you like between your sessions?">
                                                <TextField
                                                type="number"
                                                onChange={(newValue) => { setSpacingLengthMinutes(newValue.target.value) }}
                                                InputProps={{ inputProps: { min: 0 } }}
                                                value={spacingLengthMinutes}
                                                size="small"
                                                label="Break between sessions (minutes):"
                                                focused
                                                />
                                            </Tooltip>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                <DateTimePicker
                                                    value={startDate}
                                                    inputFormat="dd/MM/yyyy HH:mm"
                                                    onChange={(newValue) => { setStartDate(newValue) }}
                                                    renderInput={(props) => <TextField {...props} />}
                                                    ampm={false}
                                                    label="Start date"
                                                />
                                            </LocalizationProvider>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                <DateTimePicker
                                                    value={endDate}
                                                    inputFormat="dd/MM/yyyy HH:mm"
                                                    onChange={(newValue) => { setEndDate(newValue) }}
                                                    renderInput={(props) => <TextField {...props} />}
                                                    ampm={false}
                                                    minDateTime={new Date()}
                                                    label="End date"
                                                />
                                            </LocalizationProvider>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>

                        {/* RIGHT COLUMN */}

                        <td>
                            <table className="spaced-table">
                                <tbody>
                                    <tr>
                                        <td>
                                            <Tooltip title="These determine what is the daily time frame you would like for the project's events. For example, setting 15:00-19:00 means the application will only fit your sessions within those hours.">
                                                <span>Daily time frame</span>
                                            </Tooltip>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                <TimePicker
                                                    value={dailyStartHour}
                                                    onChange={(newValue) => { setDailyStartHour(newValue) }}
                                                    renderInput={(params) => <TextField {...params} />}
                                                    ampm={false}
                                                    label="Start time"
                                                />
                                            </LocalizationProvider>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                <TimePicker
                                                    value={dailyEndHour}
                                                    onChange={(newValue) => { setDailyEndHour(newValue) }}
                                                    renderInput={(params) => <TextField {...params} />}
                                                    ampm={false}
                                                    label="End time:"
                                                />
                                            </LocalizationProvider>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <Tooltip title="How many sessions at maximum per day. Leave undefined for unlimited (as much as possible).">
                                                <TextField
                                                    type="number"
                                                    onChange={(newValue) => { setMaxEventsPerDay(newValue.target.value) }}
                                                    InputProps={{ inputProps: { min: 1 } }}
                                                    value={maxEventsPerDay}
                                                    label="Max sessions per day:"
                                                    focused
                                                />
                                            </Tooltip>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <Tooltip title="Determine which days you would like to work on the project." placement="right">
                                                <FormLabel>Day repetition:</FormLabel>
                                            </Tooltip>
                                                <FormGroup>
                                                    <DaysCheckbox startChecked={true} setDays={handleSetDays}></DaysCheckbox>
                                                </FormGroup>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <form>
                                                <MultipleSelectChip items={constraints} onSelectChange={onSelectConstraintChange} label="Constraints to ignore:"></MultipleSelectChip>
                                            </form>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td className="center_text" colSpan={"2"}>
                            <Button variant='contained' onClick={handleGenerateClick} color="primary" disabled={isLoading}>Generate</Button>
                            <Dialog open={isLoading}>
                                <DialogTitle>Generating project schedule...</DialogTitle>
                                <DialogContent><ThreeDots color="#00BFFF" height={80} width={80} /></DialogContent>
                            </Dialog>

                            <Dialog open={successDialogOpen}>
                                <DialogTitle>Success!</DialogTitle>
                                <DialogContent>Project created successfully.</DialogContent>
                                <DialogActions>
                                    <Button onClick={handleDialogClose}>Close</Button>
                                </DialogActions>
                            </Dialog>
                        </td>
                    </tr>
                </tbody>
            </table>
        </>
    )
}
