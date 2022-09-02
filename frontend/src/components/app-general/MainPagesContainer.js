import React from 'react';
import { Schedules } from '../../pages/Schedules';
import { Projects } from '../../pages/Projects';
import { Constraints } from '../../pages/Constraints';
import { ProjectManagement } from '../../pages/ProjectManagement';
import { NavBar } from './NavBar';
import { Routes, Route } from "react-router-dom";

export const MainPagesContainer = (props) => {
    const setEvents = (events) => {
        allEvents.events = events;
    }

    let allEvents = {
        events: [],
        unexportedAlgorithmEvents: []
      }

    const pages = [{
      name: "Schedules",
      relativePath: "/schedules",
      element: <Schedules setEvents={setEvents} setNotificationMsg={props.setMsg} />
    },{
      name: "Projects",
      relativePath: "/projects",
      element: <Projects events={allEvents} setNotificationMsg={props.setMsg} />
    },{
      name: "Constraints",
      relativePath: "/constraints",
      element: <Constraints setNotificationMsg={props.setMsg} />
    },{
      name: "Project Management",
      relativePath: "/projectmanagement/*",
      element: <ProjectManagement allEvents={allEvents} setNotificationMsg={props.setMsg} />
    }]

    const routes = pages.map((page, index) => <Route path={page.relativePath} element={page.element} key={index}/>);

    return(
      <>
        <NavBar pages={pages} />
        <Routes>
          {routes}
        </Routes>
      </>
    )
  }