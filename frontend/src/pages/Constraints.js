import { useState, useEffect, useRef } from 'react';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { ConstraintsAccordion } from '../components/constraints/ConstraintsAccordion'
import Button from "@material-ui/core/Button";
import { DaysCheckbox } from '../components/general/DaysCheckbox';
const ConstraintsAPI = require('../apis/ConstraintsAPI.js');

export const Constraints = () => {
    const [daysOfWeek, setDaysOfWeek] = useState();
    const [constraintStartTime, setConstraintStartTime] = useState(new Date());
    const [constraintEndTime, setConstraintEndTime] = useState(new Date());
    const [constraintNameValue, setConstraintNameValue] = useState("");
    const [rerenderFlag, setFlag] = useState(false);
    const componentMounted = useRef(true);

    useEffect(() => {
        return () => {
            componentMounted.current = false;
        }
    }, []);

    const handleCreateClick = async () => {
        const body = {
            days: daysOfWeek,
            forbiddenStartDate: constraintStartTime,
            forbiddenEndDate: constraintEndTime,
            title: constraintNameValue,
        };

        ConstraintsAPI.createConstraint(body)
            .then(async ([response, error]) => {
                // TODO: Change the manner of notification. Alert sucks.
                if (error) {
                    alert(error)
                } else if (response.status !== 200) {
                    // TODO: read body of response. Code here is incorrect.
                    // const jsonPromise = response.json();
                    // jsonPromise.then((data) => {
                    // alert(data);
                    // })

                    alert("Something went wrong :(")
                } else {
                    setFlag(!rerenderFlag);
                }
            }
            )
    }

    const handleSetDays = (daysArr) => {
        setDaysOfWeek(daysArr);
    }

    return (
        <>
            <table className="full_width">
                <tbody>
                    <tr>
                        <td className="accordion">
                            <h2 className="center_text">Your constraints</h2>
                            <ConstraintsAccordion
                                key={rerenderFlag}
                            ></ConstraintsAccordion>
                        </td>
                        <td className="center_elem">
                            <h2>Create constraint</h2>
                            <table>
                                <tbody>
                                    <tr>
                                        <td><label>Name:</label></td>
                                        <td>
                                            <TextField onChange={(newValue) => setConstraintNameValue(newValue.target.value)} value={constraintNameValue} variant="outlined" />
                                            {/* <input type="textbox" onChange={(newValue) => setConstraintNameValue(newValue.target.value)} value={constraintNameValue} /> */}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><label>Days:</label></td>
                                        <td>
                                            <DaysCheckbox startChecked={true} setDays={handleSetDays}></DaysCheckbox>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><label>Start time:</label></td>
                                        <td className="whiteTimeFont">
                                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                <TimePicker
                                                    value={constraintStartTime}
                                                    onChange={(newValue) => { setConstraintStartTime(newValue) }}
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
                                                    value={constraintEndTime}
                                                    onChange={(newValue) => { setConstraintEndTime(newValue) }}
                                                    renderInput={(params) => <TextField {...params} />}
                                                    ampm={false}
                                                />
                                            </LocalizationProvider>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><Button variant='contained' onClick={handleCreateClick}>Create</Button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
        </>
    )
}