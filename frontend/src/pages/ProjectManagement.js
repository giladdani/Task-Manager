import { ProjectsAccordion } from '../components/projects/ProjectsAccordion'
import { TagsAccordion } from '../components/general/tags/TagsAccordion';
import { PendingProjectsList } from '../components/projects/PendingProjectList';
import { Routes, Route } from "react-router-dom";
import { NavLink } from "react-router-dom";

export const ProjectManagement = (props) => {

    const pages = [{
        name: "My projects",
        relativePath: "myprojects",
        element: <ProjectsAccordion allEvents={props.allEvents} setNotificationMsg={props.setNotificationMsg} />
      },{
        name: "Tags",
        relativePath: "tags",
        element: <TagsAccordion setNotificationMsg={props.setMsg} />
      },{
        name: "Pending projects",
        relativePath: "pendingprojects",
        element: <PendingProjectsList allEvents={props.allEvents} />
      }]

    const routes = pages.map((page, index) => <Route path={page.relativePath} element={page.element} key={index}/>);

    return(
      <>
        <ul className="sub-nav-bar">
            {pages.map((page) => (
                <li key={page.name}>
                    <NavLink className={({ isActive }) => (isActive ? 'active' : 'inactive')} to={page.relativePath}>
                        {page.name}
                    </NavLink>
                </li>
            ))}
        </ul>
        <Routes>
          {routes}
        </Routes>
      </>
      )
}