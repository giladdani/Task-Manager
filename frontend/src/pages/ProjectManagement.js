import { useState, useEffect } from 'react'
import { ProjectsList } from '../components/ProjectsList'
import { ProjectsAccordion } from '../components/ProjectsAccordion'
const ProjectsAPI = require('../apis/ProjectsAPI.js')


export const ProjectManagement = (props) => {
    const [allProjects, setAllProjects] = useState([]);

    useEffect(async () => {
        await fetchAndSetProjects();
    });

    const fetchAndSetProjects = async () => {
        const [projects, error] = await ProjectsAPI.fetchProjects();
        setAllProjects(projects);
    }

    const deleteProject = async (project) => {
        ProjectsAPI.deleteProject(project)
        .then(([response, error]) => {
            // TODO: check if RESPONSE OK
            fetchAndSetProjects();
        })
    }

    const exportProject = async (project) => {
        ProjectsAPI.exportProject(project)
            .then(([response, error]) => {
                // TODO: check if RESPONSE OK
                fetchAndSetProjects();
            })
    }

    return (
        <>
            {allProjects.length == 0 &&
                <div>User has no projects!</div>
            }
            <ProjectsAccordion
                projects={allProjects}
                allEvents={props.allEvents}
                deleteProject={deleteProject}
                exportProject={exportProject}>
            </ProjectsAccordion>
            {/* <ProjectsList
                projects={allProjects}
                allEvents={props.allEvents}
                deleteProject={deleteProject}
                exportProject={exportProject}
            ></ProjectsList> */}
        </>
    )
}