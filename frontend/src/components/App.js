import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Login } from '../pages/Login';
import { Schedules } from '../pages/Schedules';
import { Projects } from '../pages/Projects';
import { Constraints } from '../pages/Constraints';
import { ProjectManagement } from '../pages/ProjectManagement';
import { AvatarPhoto } from './AvatarPhoto';

const App = () => {
  let allEvents = {
    events: [],
    unexportedAlgorithmEvents: [],
  }

  const setEvents = (events) =>{
    allEvents.events = events;
  }

  const onLogin = () => {
    window.location = "/schedules";
  }

  const NavbarContainer = () => (
    <div>
      <div>{<AvatarPhoto/>}</div>
      <div className="app-header">
        <nav className="nav-bar">
          <ul>
            <li>
              <Link to="/schedules">Schedules</Link>
            </li>
            <li>
              <Link to="/projects">Projects</Link>
            </li>
            <li>
              <Link to="/constraints">Constraints</Link>
            </li>
            <li>
              <Link to="/projectmanagement">Project Management</Link>
            </li>
          </ul>
        </nav>
          <Routes>
            <Route path="/schedules" element={<Schedules setEvents={setEvents} />}></Route>
            <Route path="/projects" element={<Projects events={allEvents} />}></Route>
            <Route path="/constraints" element={<Constraints />}></Route>
            <Route path="/projectmanagement" element={<ProjectManagement allEvents={allEvents}/>}></Route>
          </Routes>
      </div>
    </div>
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