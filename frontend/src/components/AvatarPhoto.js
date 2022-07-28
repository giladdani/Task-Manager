import * as React from 'react';
import Avatar from '@mui/material/Avatar';

export const AvatarPhoto = () => {
    const [avatarUrl, setAvatarUrl] = React.useState('');

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

    React.useEffect(async () => {
        const avatarUrlRes = await fetchUserAvatarUrl();
        setAvatarUrl(avatarUrlRes);
    });

    return (
        <div>
            <Avatar src={avatarUrl} />
        </div>
    )
}