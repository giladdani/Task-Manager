import React, { useState, useEffect, useRef } from 'react';
import TextField from '@mui/material/TextField';
import eventUtils from '../../../utils/event-utils.js';
const EventsAPI = require('../../../apis/EventsAPI.js');



export const TagItem = (props) => {
    const [tagEvents, setTagEvents] = useState([]);
    const [oldEvents, setOldEvents] = useState([]);
    const [futureEvents, setFutureEvents] = useState([]);
    const [totalHoursPast, setTotalHoursPast] = useState();
    const [totalHoursFuture, setTotalHoursFuture] = useState();
    const [googleEvents, setGoogleEvents] = useState([]);
    const [unexportedEvents, setUnexportedEvents] = useState([]);

    const componentMounted = useRef(true);

    useEffect(() => {
        const fetchData = async () => {
            await fetchAndUpdateTagEvents();
        }

        fetchData();

        return () => {
            componentMounted.current = false;
        }
    }, []);

    const fetchAndUpdateTagEvents = async () => {
        EventsAPI.fetchTagEventsData(props.tag.id)
            .then(data => {
                if (componentMounted.current) {
                    setTagEvents(data);
                }
            })
            .catch(err => {
                console.error(err);
            })
    }

    // Old events
    useEffect(() => {
        let oldEvents = [];
        let futureEvents = [];
        let unexportedEvents = [];
        let googleEvents = [];

        tagEvents.forEach(event => {
            const currDate = new Date();
            const eventEndDate = eventUtils.db_GetEventEndDate(event);
            const eventStartDate = eventUtils.db_GetEventStartDate(event);

            if (eventEndDate <= currDate) oldEvents.push(event);
            if (eventStartDate >= currDate) futureEvents.push(event);
            if (eventUtils.db_IsGoogleEvent(event)) {
                googleEvents.push(event);
            } else {
                unexportedEvents.push(event);
            }
        })

        if (componentMounted.current) {
            setOldEvents(oldEvents);
            setFutureEvents(futureEvents);
            setUnexportedEvents(unexportedEvents);
            setGoogleEvents(googleEvents);
        }
    }, [tagEvents])

    useEffect(() => {
        calculateHoursPast();
    }, [oldEvents]);

    useEffect(() => {
        calculateHoursLeft();
    }, [futureEvents]);

    const calculateHoursPast = () => {
        let totalHoursPast = getAllHoursInEvents(oldEvents);
        totalHoursPast = totalHoursPast.toFixed(2);
        totalHoursPast = parseFloat(totalHoursPast);

        if (componentMounted.current) {
            setTotalHoursPast(totalHoursPast);
        }
    }

    const calculateHoursLeft = () => {
        let totalHoursFuture = getAllHoursInEvents(futureEvents);
        totalHoursFuture = totalHoursFuture.toFixed(2);
        totalHoursFuture = parseFloat(totalHoursFuture);

        if (componentMounted.current) {
            setTotalHoursFuture(totalHoursFuture);
        }
    }

    const getAllHoursInEvents = (events) => {
        let diffMs = 0;

        for (const event of events) {
            let startDate = eventUtils.db_GetEventStartDate(event);
            let endDate = eventUtils.db_GetEventEndDate(event);

            let diffM = endDate - startDate;
            diffMs += diffM;
        }

        const diffDays = Math.floor(diffMs / 86400000); // days
        const diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
        const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

        let diffHrsTotal = (diffDays * 24) + diffHrs;

        if (diffMins > 0) {
            diffHrsTotal = diffHrsTotal + (diffMins / 60);
        }

        return diffHrsTotal;
    }

    return (
        <>
            <table>
                <tbody>
                    <tr>
                        <td><label>Name:</label></td>
                        <td><label>{props.tag.title}</label></td>
                    </tr>
                    <tr>
                        <td><label>Tagged events: </label></td>
                        <td><label>{tagEvents.length}</label></td>
                    </tr>
                    <tr>
                        <td><label>Google events: </label></td>
                        <td><label>{googleEvents.length}</label></td>
                    </tr>
                    <tr>
                        <td><label>Unexported events: </label></td>
                        <td><label>{unexportedEvents.length}</label></td>
                    </tr>
                    <tr>
                        <td><label>Events done: </label></td>
                        <td><label>{oldEvents.length}</label></td>
                    </tr>
                    <tr>
                        <td><label>Hours done: </label></td>
                        <td><label>{totalHoursPast}</label></td>
                    </tr>
                    <tr>
                        <td><label>Events left: </label></td>
                        <td><label>{futureEvents.length}</label></td>
                    </tr>
                    <tr>
                        <td><label>Hours left: </label></td>
                        <td><label>{totalHoursFuture}</label></td>
                    </tr>
                    <tr>
                        <td><label>Color:</label></td>
                        <td><div className="tagColor" style={{ backgroundColor: props.tag.color }}></div></td>
                    </tr>
                </tbody>
            </table>
        </>
    )
}