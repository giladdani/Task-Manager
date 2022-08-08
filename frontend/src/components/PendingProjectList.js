import React, { useState } from 'react';
import { PendingProject as PendingProject } from './PendingProject';
const ProjectsAPI = require('../apis/ProjectsAPI.js')


export class PendingProjectsList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pendingProjects: [],
        }
    }

    async componentDidMount() {
        await this.fetchAndUpdateProjects();
    }

    fetchAndUpdateProjects = async () => {
        const [pendingProjects, error] = await ProjectsAPI.fetchPendingProjects();
        this.setState({ pendingProjects: pendingProjects });
    }

    approveProject = async (project) => {
        const allEvents = this.props.allEvents.events;
        const [res, err] = await ProjectsAPI.approvePendingProject(project, allEvents);

        if (err == null) {
            this.fetchAndUpdateProjects();
        }
    }

    render() {

        let res = null;

        if (this.state.pendingProjects.length === 0) {
            res = <div>You have no pending projects!</div>
        } else {
            res = this.state.pendingProjects.map((project, index) => {
                return <li key={index}>
                    <PendingProject
                        project={project}
                        approveProject={this.approveProject}
                    ></PendingProject>
                </li>
            });
        }

        return (
            <ul>
                {res}
            </ul>
        )
    }
}