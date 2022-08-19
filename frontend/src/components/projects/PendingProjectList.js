import React, { useState, useEffect, useRef } from 'react';
import { PendingProject as PendingProject } from './PendingProject';
import { isValidStatus } from '../../apis/APIUtils.js'
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
        ProjectsAPI.fetchPendingProjectsData()
        .then(data => {
          if (componentMounted.current) {
            setPendingProjects(data);
          } else {
            console.log(`[PendingProjectsList - fetchAndUpdateProjects] component is unmounted, not setting pending projects!`)
          }
        })
        .catch(err => {
          console.log(err);
        })
    }

    const approveProject = async (project) => {
        ProjectsAPI.approvePendingProject(project)
        .then(response => {
            if (isValidStatus(response, ProjectsAPI.approvePendingValidStatusArr)) {
                fetchAndUpdateProjects();
                // TODO: add success and error notifications
            }
        })
        .catch(err => {
            console.error(err);
        })
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