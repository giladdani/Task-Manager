import { useState, useEffect } from 'react';
import { ProjectsList } from '../components/ProjectsList';

export const ProjectManagement = (props) => {
    const [allProjects, setAllProjects] = useState([]);

    useEffect(async () => {
        const projects = await fetchProjects();
        setAllProjects(projects);
    });

    const fetchProjects = async () => {
        const response = await fetch('http://localhost:3001/api/projects', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'access_token': sessionStorage.getItem("access_token")
            },
            method: 'GET'
        });

        if (response.status !== 200) throw new Error('Error while fetching constraints')
        const data = await response.json();
        return data;
    }

    const deleteProject = async (project) => {
        console.log(`Deleting project ${project.title}. Project ID: ${project.id}`);

        try {
            const response = await fetch(`http://localhost:3001/api/projects/${project.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token'),
                },
                method: 'DELETE',
            });

            if (response.status !== 200) {
                throw new Error(`Failed to delete project ${project.title} (ID: ${project.id})`);
            }

            console.log(`Project ${project.title} (ID: ${project.id}) deleted`);

            const projects = await fetchProjects();
            setAllProjects(projects);
        }
        catch (err) {
            console.error(err);
        }
    }

    const exportProject = async (project) => {
        console.log(`Exporting project ${project.title}. Project ID: ${project.id}`);

        try {
            const allEvents = props.allEvents.events;

            const body = {
                events: allEvents,
            };

            
            const response = await fetch(`http://localhost:3001/api/projects/export/${project.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token'),
                },
                method: 'POST',
                body: JSON.stringify(body)
            });

            if (response.status !== 200) {
                throw new Error(`Failed to export project ${project.title} (ID: ${project.id})`);
            }

            console.log(`Project ${project.title} (ID: ${project.id}) exported to Google.`);

            const projects = await fetchProjects();
            setAllProjects(projects);
        }
        catch (err) {
            console.error(err);
        }
    }



    return (
        <>
            {allProjects.length == 0 &&
                <p>User has no projects!</p>
            }
            <ProjectsList
                projects={allProjects}
                allEvents={props.allEvents}
                deleteProject={deleteProject}
                exportProject={exportProject}
            ></ProjectsList>
        </>
    )
}