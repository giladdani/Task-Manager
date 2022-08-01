import * as React from 'react';
import { useState, useEffect } from 'react';
import { SuggestedEvent as SuggestedEvent } from './SuggestedEvent';

import Button from '@mui/material/Button';
import Draggable from 'react-draggable';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

export class SuggestedEventsList extends React.Component {
    constructor(props) {
        super(props);
    }

    handleOnConfirmClick = () => {
        this.props.confirmRescheduling(this.props.suggestedEvents);
    }

    render() {
        if (this.props.suggestedEvents !== null) {

            const suggestedEvents = this.props.suggestedEvents.map((event, index) => {
                return (
                    <li
                        key={index}
                    >
                        <SuggestedEvent
                            event={event}
                        ></SuggestedEvent>
                    </li>)
            });

            if (suggestedEvents.length > 0) {
                return (
                    <>
                        <p>
                            Suggested Rescheduling:
                        </p>
                        <ul>
                            {suggestedEvents}
                        </ul>
                        <Button
                            variant='contained'
                            onClick={this.handleOnConfirmClick}
                        >
                            Confirm Changes
                        </Button>
                    </>
                )
            } else {
                return <p>Could not find another time to reschedule!</p>
            }
        } else {
            return <></>;
        }

    }
}

// export const SuggestedEventsList = (props) => {
//     const suggestedEventsList = props.suggestedEvents.map((event, index) => {
//         <li key={index}>
//             <SuggestedEvent
//                 event={event}
//             ></SuggestedEvent>
//         </li>
//     })

//     return (
//         <>
//             <ul>
//                 {suggestedEventsList}
//             </ul>
//         </>
//     );
// }


