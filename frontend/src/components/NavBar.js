import React from 'react';
import { Link } from "react-router-dom";

export const NavBar = (props) => {
    const links = props.pages.map((page, index) => <li key={index}><Link to={page.relativePath}>{page.name}</Link></li>);

    return (
        <nav className="nav-bar">
          <ul>
            {links}
          </ul>
        </nav>
    )
}