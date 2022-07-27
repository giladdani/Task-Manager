import { ProjectsList } from '../components/ProjectsList';

export const ProjectManagement = (props) => {
    return (
        <div>
            <ProjectsList allEvents={props.allEvents}></ProjectsList>
        </div>
    )
}