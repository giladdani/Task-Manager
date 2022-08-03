import * as React from 'react';
import { Link } from "react-router-dom";

export const NavBar = () => {
    return (
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
    )
}