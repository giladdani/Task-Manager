import Button from '@mui/material/Button';
import React from 'react';
import { SuggestedEvent } from './SuggestedEvent';

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


