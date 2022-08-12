import { ProjectsAccordion } from '../components/ProjectsAccordion'
import { PendingProjectsList } from '../components/PendingProjectList';

export const ProjectManagement = (props) => {
    return (
        <>
            <table className="full_width">
                <tbody>
                    <tr>
                        <td className="accordion">
                            <h2 className="center_text">Your projects</h2>
                            <ProjectsAccordion
                                allEvents={props.allEvents}
                            >
                            </ProjectsAccordion>
                        </td>
                        <td>
                            <h2>Pending projects</h2>
                            <PendingProjectsList allEvents={props.allEvents} />
                        </td>
                    </tr>
                </tbody>
            </table>
        </>
    )
}