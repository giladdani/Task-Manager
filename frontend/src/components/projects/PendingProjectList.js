import React, { useState, useEffect, useRef } from 'react';
import { PendingProject as PendingProject } from './PendingProject';
import { isValidStatus } from '../../apis/APIUtils.js'
import { generalErrorMsg } from '../../utils/consts';
import { ThreeDots } from 'react-loader-spinner'
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
const ProjectsAPI = require('../../apis/ProjectsAPI.js')

export const PendingProjectsList = (props) => {
    const [pendingProjects, setPendingProjects] = useState([]);
    const [isLoading, toggleLoading] = useState(false);
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
        toggleLoading(true);
        ProjectsAPI.approvePendingProject(project)
            .then(response => {
                if (isValidStatus(response, ProjectsAPI.approvePendingValidStatusArr)) {
                    fetchAndUpdateProjects();
                    props.setNotificationMsg("Project approved");
                } else {
                    props.setNotificationMsg("Failed to approve project");
                }
            })
            .catch(err => {
                console.error(err);
                props.setNotificationMsg(generalErrorMsg);
            })
            .finally(() => {
                toggleLoading(false);
            })
    }

    return (
        <>
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
            <Dialog open={isLoading}>
                <DialogTitle>Working on it...</DialogTitle>
                <DialogContent><ThreeDots color="#00BFFF" height={80} width={80} /></DialogContent>
            </Dialog>
        </>
    )
}