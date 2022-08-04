import React, { useState } from 'react';
import { Project } from './Project';

export class ProjectsList extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const projects = this.props.projects.map((project, index) => {
            const allEvents = this.props.allEvents.events;
            const projectEvents = allEvents.filter(event => event.extendedProps.projectId == project.id)

        return <li key={index}>
            <Project
                project={project}
                projectEvents={projectEvents}
                deleteProject={this.props.deleteProject}
                exportProject={this.props.exportProject}
            ></Project>
        </li>
    });

    return(
            <ul>
    { projects }
            </ul >
        )
    }
}