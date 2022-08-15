import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import { useEffect, useState } from 'react';

export const DaysCheckbox = (props) => {
    const [days, setDays] = useState({
        sundayValue: props.startChecked,
        mondayValue: props.startChecked,
        tuesdayValue: props.startChecked,
        wednesdayValue: props.startChecked,
        thursdayValue: props.startChecked,
        fridayValue: props.startChecked,
        saturdayValue: props.startChecked,
    })

    useEffect(() => {
        let daysArr = getCheckedDays(days);
        props.setDays(daysArr);
    }, [days])

    const handleDaysChange = (e) => {
        setDays((prev => ({ ...prev, [e.target.name]: e.target.checked })));
    }

    // TODO: add select all \ deselect all options
    const daysElement = (
        <FormGroup disabled>
            <FormControlLabel control={<Checkbox name="sundayValue" onChange={handleDaysChange} checked={days.sundayValue} />} label="Sunday" />
            <FormControlLabel control={<Checkbox name="mondayValue" onChange={handleDaysChange} checked={days.mondayValue} />} label="Monday" />
            <FormControlLabel control={<Checkbox name="tuesdayValue" onChange={handleDaysChange} checked={days.tuesdayValue} />} label="Tuesday" />
            <FormControlLabel control={<Checkbox name="wednesdayValue" onChange={handleDaysChange} checked={days.wednesdayValue} />} label="Wednesday" />
            <FormControlLabel control={<Checkbox name="thursdayValue" onChange={handleDaysChange} checked={days.thursdayValue} />} label="Thursday" />
            <FormControlLabel control={<Checkbox name="fridayValue" onChange={handleDaysChange} checked={days.fridayValue} />} label="Friday" />
            <FormControlLabel control={<Checkbox name="saturdayValue" onChange={handleDaysChange} checked={days.saturdayValue} />} label="Saturday" />
        </FormGroup>
    )

    return daysElement;
}

/**
 * Returns an array of all the checked days, with 0 being Sunday and 6 being Saturday.
 * The numbering scheme is chosen to match FullCalendar's.
 * More importantly it matches the JavaScript Date object, which returns "0" for Sunday when requesting getDay().
 * @param {*} daysObj 
 * @returns 
 */
 export const getCheckedDays = (daysObj) => {
    const checkedDays = [];

    if (daysObj.sundayValue) {
        checkedDays.push(0);
    }

    if (daysObj.mondayValue) {
        checkedDays.push(1);
    }

    if (daysObj.tuesdayValue) {
        checkedDays.push(2);
    }

    if (daysObj.wednesdayValue) {
        checkedDays.push(3);
    }

    if (daysObj.thursdayValue) {
        checkedDays.push(4);
    }

    if (daysObj.fridayValue) {
        checkedDays.push(5);
    }

    if (daysObj.saturdayValue) {
        checkedDays.push(6);
    }

    return checkedDays;
}