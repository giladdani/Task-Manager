import { ProjectsAccordion } from '../components/ProjectsAccordion'

export const ProjectManagement = (props) => {
    return (
        <>
            <ProjectsAccordion
                allEvents={props.allEvents}
            >
            </ProjectsAccordion>
        </>
    )
}