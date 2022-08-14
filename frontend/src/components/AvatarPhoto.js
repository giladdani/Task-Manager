import React, { useState, useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Logout from '@mui/icons-material/Logout';
import ListItemIcon from '@mui/material/ListItemIcon';

export const AvatarPhoto = () => {
    const [avatarUrl, setAvatarUrl] = useState('');
    const [anchorMenu, setAnchorMenu] = useState(null);

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

    useEffect(async () => {
        const avatarUrlRes = await fetchUserAvatarUrl();
        setAvatarUrl(avatarUrlRes);
    });

    return (
        <>
            <Avatar src={avatarUrl} />
        </>
    )
}