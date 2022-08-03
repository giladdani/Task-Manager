import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export const AvatarPhoto = () => {
    const [avatarUrl, setAvatarUrl] = React.useState('');
    const [anchorMenu, setAnchorMenu] = React.useState(null);
    const isMenuOpen = Boolean(anchorMenu);

    const fetchUserAvatarUrl = async() =>{
        try {
            const response = await fetch('http://localhost:3001/api/users/avatar', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'access_token': sessionStorage.getItem('access_token')
                },
                method: 'GET'
            });
            if (response.status !== 200) throw new Error('Error while fetching user avatar');
            const data = await response.json();
            return data.avatarUrl;
        }
        catch (err) {
            console.error(err);
        }
    }

    const openMenu = (event) => {
        setAnchorMenu(event.currentTarget);
      };

    const closeMenu = () => {
        setAnchorMenu(null);
    };

    const handleLogout = () => {
        sessionStorage.clear();  
        window.location = "/";
    }

    React.useEffect(async () => {
        const avatarUrlRes = await fetchUserAvatarUrl();
        setAvatarUrl(avatarUrlRes);
    });

    return (
        <>
            <Avatar src={avatarUrl} onClick={openMenu} />
            <Menu
            id="basic-menu"
            anchorEl={anchorMenu}
            open={isMenuOpen}
            onClose={closeMenu}
            MenuListProps={{'aria-labelledby': 'basic-button'}}
            >
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
      </>
    )
}