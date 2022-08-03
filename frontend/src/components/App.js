import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Login } from '../pages/Login';
import { Schedules } from '../pages/Schedules';
import { Projects } from '../pages/Projects';
import { Constraints } from '../pages/Constraints';
import { ProjectManagement } from '../pages/ProjectManagement';
import { AvatarPhoto } from './AvatarPhoto';
import { NavBar } from './NavBar';

const App = () => {
  let allEvents = {
    events: [],
    unexportedAlgorithmEvents: [],
  }

  const setEvents = (events) => {
    allEvents.events = events;
  }

  const onLogin = () => {
    window.location = "/schedules";
  }

  const NavbarContainer = () => (
    <>
      <div>{<AvatarPhoto />}</div>
      <div className="app-header">
        <NavBar />
        <Routes>
          <Route path="/schedules" element={<Schedules setEvents={setEvents}/>}></Route>
          <Route path="/projects" element={<Projects events={allEvents} />}></Route>
          <Route path="/constraints" element={<Constraints />}></Route>
          <Route path="/projectmanagement" element={<ProjectManagement allEvents={allEvents} />}></Route>
        </Routes>
      </div>
    </>
  )

  return (
    <Router>
      <div className="app-header">
        <Routes>
          <Route path="/" element={<Login to="/login" onLogin={onLogin} />} />
          <Route path="*" element={<NavbarContainer />}></Route>
        </Routes>
      </div>
    </Router>
  )
}

export default App;