import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Home } from '../pages/Home';
import { Schedules } from '../pages/Schedules';
import { Projects } from '../pages/Projects';
import { Constraints } from '../pages/Constraints';
import { Profile } from '../pages/Profile';

const App = () => {
  return <Router>
  <div className="app-header">
    <nav className="nav-bar">
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
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
          <Link to="/profile">Profile</Link>
        </li>
      </ul>
    </nav>

    <Routes>
        <Route path="/" element={<Home/>}></Route>
        <Route path="/schedules" element={<Schedules/>}></Route>
        <Route path="/projects" element={<Projects/>}></Route>
        <Route path="/constraints" element={<Constraints/>}></Route>
        <Route path="/profile" element={<Profile/>}></Route>
    </Routes>
  </div>
</Router>
}

export default App;