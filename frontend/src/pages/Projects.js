import FullCalendar from '@fullcalendar/react' // must go before plugins
import dayGridPlugin from '@fullcalendar/daygrid' // a plugin!
import interactionPlugin from "@fullcalendar/interaction" // needed for dayClick
import { Calendar } from '@fullcalendar/core';
import googleCalendarPlugin from '@fullcalendar/google-calendar';

export const Projects = () => {

    const handleDateClick = (arg) => { // bind with an arrow function
        alert(arg.dateStr)
    }
    
    const eventsSources = [{
          googleCalendarId: 'iw.jewish#holiday@group.v.calendar.google.com'
      },
      {
        events:[
          {
            title: 'event2',
            start: '2022-04-12',
            end: '2022-04-13',
            id: '1'
          }
        ]
      }
    ]

    const handleEventClick = (info) =>{
        info.jsEvent.preventDefault();
        alert('id: ' + info.event.id);
    }

    return (
        <FullCalendar
            initialView="dayGridWeek"
            googleCalendarApiKey='AIzaSyDU2RAPfkCgbfLSIrJ_R_feaTQEGzhUnuk'
            plugins={[ dayGridPlugin, interactionPlugin, googleCalendarPlugin ]}
            dateClick={handleDateClick}
            editable="true"
            eventSources={eventsSources}
            eventClick={handleEventClick}
        />
    )

    // return <div>Projects component</div>
}