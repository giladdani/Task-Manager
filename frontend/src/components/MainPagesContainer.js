import React, { useState } from 'react';
import { Schedules } from '../pages/Schedules';
import { Projects } from '../pages/Projects';
import { Constraints } from '../pages/Constraints';
import { ProjectManagement } from '../pages/ProjectManagement';
import { AvatarPhoto } from './AvatarPhoto';
import { NavBar } from './NavBar';
import { Routes, Route } from "react-router-dom";

export const MainPagesContainer = () => {
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
      element: <Schedules setEvents={setEvents} />
    },{
      name: "Projects",
      relativePath: "/projects",
      element: <Projects events={allEvents} />
    },{
      name: "Constraints",
      relativePath: "/constraints",
      element: <Constraints />
    },{
      name: "Project Management",
      relativePath: "/projectmanagement",
      element: <ProjectManagement allEvents={allEvents} />
    }]

    const routes = pages.map((page, index) => <Route path={page.relativePath} element={page.element} key={index}/>);

    return(
      <>
        <div>{<AvatarPhoto />}</div>
        <div className="app-header">
          <NavBar pages={pages}/>
          <Routes>
            {routes}
          </Routes>
        </div>
      </>
    )
  }