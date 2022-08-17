import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import { useEffect, useState } from 'react';

export const DaysCheckbox = (props) => {
    const [days, setDays] = useState({
        sundayValue: false,
        mondayValue: false,
        tuesdayValue: false,
        wednesdayValue: false,
        thursdayValue: false,
        fridayValue: false,
        saturdayValue: false,
    })

    useEffect(() => {
        if (props.startingDays) {
            setStartingDays();
        } else if (props.startChecked) {
            setDaysValue(props.startChecked);
        }

        let daysArr = getCheckedDays(days);
        props.setDays(daysArr);
    }, [])

    useEffect(() => {
        let daysArr = getCheckedDays(days);
        props.setDays(daysArr);
    }, [days])

    const setStartingDays = () => {
        let sundayValue = props.startingDays.includes(0);
        let mondayValue = props.startingDays.includes(1);
        let tuesdayValue = props.startingDays.includes(2);
        let wednesdayValue = props.startingDays.includes(3);
        let thursdayValue = props.startingDays.includes(4);
        let fridayValue = props.startingDays.includes(5);
        let saturdayValue = props.startingDays.includes(6);

        setDays(
            {
                sundayValue: sundayValue,
                mondayValue: mondayValue,
                tuesdayValue: tuesdayValue,
                wednesdayValue: wednesdayValue,
                thursdayValue: thursdayValue,
                fridayValue: fridayValue,
                saturdayValue: saturdayValue,
            }
        )
    }

    const setDaysValue = (bValue) => {
        setDays({
            sundayValue: bValue,
            mondayValue: bValue,
            tuesdayValue: bValue,
            wednesdayValue: bValue,
            thursdayValue: bValue,
            fridayValue: bValue,
            saturdayValue: bValue,
        })
    }

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