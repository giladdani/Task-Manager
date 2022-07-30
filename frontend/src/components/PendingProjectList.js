import * as React from 'react';
import { PendingProject as PendingProject } from './PendingProject';

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
        const pendingProjects = await this.fetchPendingProjects();
        this.setState({ pendingProjects: pendingProjects });
    }

    fetchPendingProjects = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/projects/pending', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token'),
                },
                method: 'GET',
            });

            if (response.status !== 200) {
                let errorMsg = await response.text();
                throw new Error('Invalid parameters for the project:\n\n' + errorMsg)
            }

            const data = await response.json();

            return data;
        } catch (err) {
            console.error(err);
        }
    }

    approveProject = async (project) => {
        alert(`Approve pending project ${project.title}!`);

        try {
            const allEvents = this.props.allEvents.events;

            const body = {
                project: project,
                allEvents: allEvents,
            };

            const response = await fetch('http://localhost:3001/api/projects/shared/approved', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token'),
                },
                method: 'POST',
                body: JSON.stringify(body),
            });

            if (response.status !== 200) {
                let errorMsg = await response.text();
                throw errorMsg;
            }

            let jsonRes = await response.json();
            let estimatedTimeLeft = Number(jsonRes.estimatedTimeLeft);
            let msg = "";
            if (estimatedTimeLeft > 0) {
                msg = `Shared Project added.
                    \nNote! There was not enough time to match the estimated hours.
                    Estimated time left: ${estimatedTimeLeft}`
            } else {
                msg = `Project added.`;
            }

            console.log(msg);
            alert(msg);
            this.fetchAndUpdateProjects();
        }
        catch (err) {
            console.error(err);
            alert(err);
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