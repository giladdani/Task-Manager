
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import MenuItem from '@mui/material/MenuItem';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import IconButton from '@mui/material/IconButton';
import { NavLink } from "react-router-dom";
import { AvatarPhoto } from './AvatarPhoto';
import generalUtils from '../../utils/general-utils';

export const NavBar = (props) => {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const settings = [{name: 'Logout', action: generalUtils.handleLogout}];

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar position="static" className="nav-bar">
      <Container maxWidth="false">
        <Toolbar disableGutters>

          {/* LOGO */}
          <CalendarMonthIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />

          {/* APP NAME */}
          <Typography
            variant="h6"
            noWrap
            component="a"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            TASK MASTER
          </Typography>

          {/* PAGES */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
          <ul>
            {props.pages.map((page) => (
              <li key={page.name}>
                <NavLink
                  sx={{ my: 2, color: 'white', display: 'block' }}
                  className={({ isActive }) => (isActive ? 'active' : 'inactive')}
                  to={page.relativePath}>{page.name}
                </NavLink>
              </li>
            ))}
          </ul>
          </Box>

          {/* AVATAR + SETTINGS */}
          <Box sx={{ flexGrow: 0 }}>
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <AvatarPhoto />
            </IconButton>
            
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={setting.action}>
                  <Typography textAlign="center">{setting.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};