import React, { useState, useImperativeHandle } from 'react';

export const Events = React.forwardRef((props, ref) => {
    useImperativeHandle(ref, () => ({
        childMethod: childMethod
    }))

    const fetchEvents = async () => {
        try{
            const response = await fetch('http://localhost:3001/api/calendar/events', {
                headers: {
                	'Accept': 'application/json',
                	'Content-Type': 'application/json',
                    'access_token': document.cookie
                },
                method: 'GET'
            });

            if (response.status !== 200) throw new Error('Error while fetching events');
            const data = await response.json();
            setEvents(data);
        }
        catch(err){
            console.error(err);
        }
    }

    const childMethod = () => {
        if(document.cookie){
            fetchEvents();
        }
    }

    const [events, setEvents] = useState([]);
    const [summary, setSummary] = useState('');
    const [startDateTime, setStartDateTime] = useState('');
    const [endDateTime, setEndDateTime] = useState('');

    // useEffect(() => {
    //     const fetchEvents = async () => {
    //         try{
    //             const events = await axios.get('http://localhost:3001/api/calendar/events', {data:{access_token: document.cookie}});
    //             setEvents(events.data);
    //         }
    //         catch(err){
    //             console.error(err);
    //         }
    //       }
    //       if(document.cookie){
    //           fetchEvents();
    //       }
    //   });

    const OnAddEventClicked = async () =>{
        try{
            const response = await fetch('http://localhost:3001/api/calendar/events', {
                headers: {
                	'Accept': 'application/json',
                	'Content-Type': 'application/json',
                    'access_token': document.cookie
                },
                method: 'POST',
                body: JSON.stringify({summary, startDateTime, endDateTime})
            });

            if (response.status !== 200) throw new Error('Error while inserting event');
            const data = await response.json();
            console.log(data);
        }
        catch(err){
            console.error(err);
        }
    }

    const eventsList = events.map((event, index) => <li key={index}>{event.summary}</li>);
        return(
            <table className="full_width">
                <tbody>
                    <tr>
                        <td>
                            <div>
                                <h1>Add event to calendar:</h1>
                                <table>
                                    <tbody>
                                        <tr>
                                            <td><label>Title:</label></td>
                                            <td><input type='text' value={summary} onChange={e => setSummary(e.target.value)}></input></td>
                                        </tr>
                                        <tr>
                                            <td><label>Starts:</label></td>
                                            <td><input type="datetime-local" value={startDateTime} onChange={e => setStartDateTime(e.target.value)}></input></td>
                                            
                                        </tr>
                                        <tr>
                                            <td><label>Ends:</label></td>
                                            <td><input type="datetime-local" value={endDateTime} onChange={e => setEndDateTime(e.target.value)}></input></td>
                                        </tr>
                                    </tbody>
                                </table>
                                <button onClick={OnAddEventClicked}>Add event</button>
                            </div>
                        </td>
                        <td className="center_elem">
                            <div>
                                <h1>Upcoming events:</h1>
                                <ul>
                                    {eventsList}
                                </ul>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        )
})