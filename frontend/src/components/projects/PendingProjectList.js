import React, { useState, useEffect, useRef } from 'react';
import { PendingProject as PendingProject } from './PendingProject';
const ProjectsAPI = require('../../apis/ProjectsAPI.js')

export const PendingProjectsList = (props) => {
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

    const fetchAndUpdateProjects = async () => {
        const [pendingProjects, error] = await ProjectsAPI.fetchPendingProjects();

        if (componentMounted.current) {
            setPendingProjects(pendingProjects);
        } else {
            console.log(`[PendingProjectList - fetchAndUpdateProjects] component is unmounted, not setting pending projects!`)
        }
    }

    const approveProject = async (project) => {
        const [res, err] = await ProjectsAPI.approvePendingProject(project);

        if (!err) {
            fetchAndUpdateProjects();
        }
    }

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
                            approveProject={approveProject}
                        ></PendingProject>
                    </li>
                })
            }
        </ul>
    )
}