import { useState, useEffect, useRef } from 'react';
// // import { ConstraintsList } from '../components/ConstraintsList';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { ConstraintsAccordion } from '../components/ConstraintsAccordion'
import Button from "@material-ui/core/Button";
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox'
const ConstraintsAPI = require('../apis/ConstraintsAPI.js');

export const Constraints = () => {
    // Hooks
    const [days, setDays] = useState({
        sundayValue: false,
        mondayValue: false,
        tuesdayValue: false,
        wednesdayValue: false,
        thursdayValue: false,
        fridayValue: false,
        saturdayValue: false
    })
    const [constraintStartTime, setConstraintStartTime] = useState(new Date());
    const [constraintEndTime, setConstraintEndTime] = useState(new Date());
    const [constraintNameValue, setConstraintNameValue] = useState("");
    const [allConstraints, setAllConstraints] = useState([]);
    const componentMounted = useRef(true);

    useEffect(() => {
        // const constraints = await fetchConstraints();
        // const constraints = await api.fetchConstraints();
        // setAllConstraints(constraints);

        const fetchData = async () => {
            await fetchAndUpdateConstraints();
        }

        fetchData();

        return () => {
            componentMounted.current = false;
        }
    });

    const fetchAndUpdateConstraints = async () => {
        const constraints = await ConstraintsAPI.fetchConstraints();

        if (componentMounted.current) {
            setAllConstraints(constraints);
          } else {
            console.log(`[Constraints - fetchAndUpdateConstraints] component is unmounted, not setting constraints!`)
          }
    }

    /*
 * TODO: delete if all works well
Moved this to API file!
 */
    // const fetchConstraints = async () => {
    //     const response = await fetch('http://localhost:3001/api/constraints', {
    //         headers: {
    //             'Accept': 'application/json',
    //             'Content-Type': 'application/json',
    //             'access_token': sessionStorage.getItem('access_token')
    //         },
    //         method: 'GET'
    //     });

    //     if (response.status !== 200) throw new Error('Error while fetching constraints')
    //     const data = await response.json();

    //     return data;
    // }

    const handleDaysChange = (e) => {
        setDays((prev => ({ ...prev, [e.target.name]: e.target.checked })));
    }

    // const daysCheckboxes = <div id="daysDiv">
    //     <label>Sunday</label><input type="checkbox" name="sundayValue" onChange={handleDaysChange}></input>
    //     <label>Monday</label><input type="checkbox" name="mondayValue" onChange={handleDaysChange}></input>
    //     <label>Tuesday</label><input type="checkbox" name="tuesdayValue" onChange={handleDaysChange}></input>
    //     <label>Wednesday</label><input type="checkbox" name="wednesdayValue" onChange={handleDaysChange}></input>
    //     <label>Thursday</label><input type="checkbox" name="thursdayValue" onChange={handleDaysChange}></input>
    //     <label>Friday</label><input type="checkbox" name="fridayValue" onChange={handleDaysChange}></input>
    //     <label>Saturday</label><input type="checkbox" name="saturdayValue" onChange={handleDaysChange}></input>
    // </div>

    
    const daysCheckboxes = <FormGroup>
                        <FormControlLabel control={<Checkbox name="sundayValue" onChange={handleDaysChange} />} label="Sunday" />
                        <FormControlLabel control={<Checkbox name="mondayValue" onChange={handleDaysChange} />} label="Monday" />
                        <FormControlLabel control={<Checkbox name="tuesdayValue" onChange={handleDaysChange} />} label="Tuesday" />
                        <FormControlLabel control={<Checkbox name="wednesdayValue" onChange={handleDaysChange} />} label="Wednesday" />
                        <FormControlLabel control={<Checkbox name="thursdayValue" onChange={handleDaysChange} />} label="Thursday" />
                        <FormControlLabel control={<Checkbox name="fridayValue" onChange={handleDaysChange} />} label="Friday" />
                        <FormControlLabel control={<Checkbox name="saturdayValue" onChange={handleDaysChange} />} label="Saturday" />
                    </FormGroup>


    const handleCreateClick = async () => {
        try {
            const checkedDays = getCheckedDays(); // TODO: change to numbers to match FullCalendar

            const body = {
                days: checkedDays,
                forbiddenStartDate: constraintStartTime,
                forbiddenEndDate: constraintEndTime,
                title: constraintNameValue,
            };

            const response = await fetch('http://localhost:3001/api/constraints', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token'),
                },
                method: 'POST',
                body: JSON.stringify(body),
            });

            if (response.status !== 200) {
                throw new Error('Error while adding constraint');
            } else {
                console.log('Constraint added');
                alert("Constraints added!");

                // const constraints = await utils.fetchConstraints();
                // setAllConstraints(constraints);

                await fetchAndUpdateConstraints();

            }
        }
        catch (err) {
            console.error(err);
        }
    }

    const getCheckedDays = () => {
        const checkedDays = [];

        if (days.sundayValue) {
            checkedDays.push("0");
        }

        if (days.mondayValue) {
            checkedDays.push("1");
        }

        if (days.tuesdayValue) {
            checkedDays.push("2");
        }

        if (days.wednesdayValue) {
            checkedDays.push("3");
        }

        if (days.thursdayValue) {
            checkedDays.push("4");
        }

        if (days.fridayValue) {
            checkedDays.push("5");
        }

        if (days.saturdayValue) {
            checkedDays.push("6");
        }

        return checkedDays;
    }

    const handleConstraintUpdate = async (partialConstraintEvent) => {
        console.log(`Updating constraint ${partialConstraintEvent.title}`);

        try {
            const body = {
                days: partialConstraintEvent.days,
                forbiddenStartDate: partialConstraintEvent.forbiddenStartDate,
                forbiddenEndDate: partialConstraintEvent.forbiddenEndDate,
                title: partialConstraintEvent.title,
            };

            const response = await fetch(`http://localhost:3001/api/constraints/${partialConstraintEvent.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token'),
                },
                method: 'PUT',
                body: JSON.stringify(body),
            });

            if (response.status !== 200) throw new Error(`Error while updating constraint: '${partialConstraintEvent.title}'`)
            console.log(`Constraint updated: '${partialConstraintEvent.title}'`);
            alert(`Constraint ${body.title} updated successfully`);

            // const constraints = await fetchConstraints();
            // setAllConstraints(constraints);
            await fetchAndUpdateConstraints();
        }
        catch (err) {
            console.error(err);
        }
    }

    const handleConstraintDelete = async (constraintID) => {
        try {
            const response = await fetch(`http://localhost:3001/api/constraints/${constraintID}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token'),
                },
                method: 'DELETE',
            });

            if (response.status !== 200) throw new Error('Error while deleting constraint')
            console.log(`Constraint ${constraintID} deleted`);

            // const constraints = await fetchConstraints();
            // setAllConstraints(constraints);
            await fetchAndUpdateConstraints();
        }
        catch (err) {
            console.error(err);
        }
    }

    return (
        <>
            <table className="full_width">
                <tbody>
                    <tr>
                        <td className="accordion">
                            <h2 className="center_text">Your constraints</h2>
                                <ConstraintsAccordion
                                    constraints={allConstraints}
                                    onConstraintUpdate={handleConstraintUpdate}
                                    onConstraintDelete={handleConstraintDelete}>
                                </ConstraintsAccordion>
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
                                            {daysCheckboxes}
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
            

            
            {/* ////{<ConstraintsList
                ////constraints={allConstraints}
                ////handleConstraintUpdate={handleConstraintUpdate}
                ////handleConstraintDelete={handleConstraintDelete}
            ////>
            ////</ConstraintsList>
            */}
        </>
    )
}