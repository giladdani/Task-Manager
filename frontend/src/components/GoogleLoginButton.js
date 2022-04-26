import { GoogleLogin } from "react-google-login"

export const GoogleLoginButton = (props) => {
    const responseGoogle = async (response) => {
        const { code } = response;
        try {
            const res = await fetch('http://localhost:3001/api/calendar/create-tokens', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                body: JSON.stringify({code})
            });

            const data = await res.json();
            document.cookie = data.access_token;
            props.onLogin();
        } 
        catch (err) {
            console.log(err);
        }
    }

    const responseError = (error) => {
        console.log(error);
    }

    return (
        <GoogleLogin clientId="255089907729-d285lq0bfp7kjhpt99m03a3sktpsva5i.apps.googleusercontent.com"
            buttonText="Sign in"
            onSuccess={responseGoogle}
            onFailure={responseError}
            cookiePolicy={'single_host_origin'}
            responseType='code'
            accessType="offline"
            scope="openid email profile https://www.googleapis.com/auth/calendar">
        </GoogleLogin>
    )
}