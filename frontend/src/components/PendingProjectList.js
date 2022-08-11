import React, { useState, useEffect, useRef } from 'react';
import { PendingProject as PendingProject } from './PendingProject';
const ProjectsAPI = require('../apis/ProjectsAPI.js')


// // export class PendingProjectsList extends React.Component {
export const PendingProjectsList = (props) => {
    // // constructor(props) {
    // //     super(props);
    // //     this.state = {
    // //         pendingProjects: [],
    // //     }
    // // }

    const [pendingProjects, setPendingProjects] = useState([]);
    const componentMounted = useRef(true);

    useEffect(() => {
        const fetchData = async () => {
            await fetchAndUpdateProjects();
        }

        fetchData();

        return () => {
            componentMounted.current = false;
        }
    }, []);

    // // async componentDidMount() {
    // //     await this.fetchAndUpdateProjects();
    // // }

    const fetchAndUpdateProjects = async () => {
        const [pendingProjects, error] = await ProjectsAPI.fetchPendingProjects();

        if (componentMounted.current) {
            // // setAllProjects(projects);
            setPendingProjects(pendingProjects);
        } else {
            console.log(`[PendingProjectList - fetchAndUpdateProjects] component is unmounted, not setting pending projects!`)
        }
    }

    const approveProject = async (project) => {
        // // const allEvents = this.props.allEvents.events;
        const allEvents = []; // I don't want to send all events when approving a project - server should keep track of all events in its DB!
        const [res, err] = await ProjectsAPI.approvePendingProject(project, allEvents);

        if (!err) {
            fetchAndUpdateProjects();
        }
    }
    // // approveProject = async (project) => {
    // //     const allEvents = this.props.allEvents.events;
    // //     const [res, err] = await ProjectsAPI.approvePendingProject(project, allEvents);

    // //     if (err == null) {
    // //         this.fetchAndUpdateProjects();
    // //     }
    // // }

    return (
        <ul>
            {pendingProjects.length === 0 &&
                <div>You have no pending projects!</div>
            }
            {
                pendingProjects.map((project, index) => {
                    return <li key={index}>
                        <PendingProject
                            project={project}
                            approveProject={this.approveProject}
                        ></PendingProject>
                    </li>
                })
            }
        </ul>
    )
    // // render() {

    // //     let res = null;

    // //     if (this.state.pendingProjects.length === 0) {
    // //         res = <div>You have no pending projects!</div>
    // //     } else {
    // //         res = this.state.pendingProjects.map((project, index) => {
    // //             return <li key={index}>
    // //                 <PendingProject
    // //                     project={project}
    // //                     approveProject={this.approveProject}
    // //                 ></PendingProject>
    // //             </li>
    // //         });
    // //     }

    // //     return (
    // //         <ul>
    // //             {res}
    // //         </ul>
    // //     )
    // // }
}