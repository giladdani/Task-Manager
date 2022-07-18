import { GoogleLogin } from "react-google-login"

export const GoogleLoginButton = (props) => {
    const getLoggedInUserData = async (response) => {
        const { code } = response;
        try {
            const res = await fetch(`http://localhost:3001/api/users`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({code})
            });

            const data = await res.json();
            sessionStorage.setItem("access_token", data.accessToken);
            sessionStorage.setItem("user_email", data.email);
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
            onSuccess={getLoggedInUserData}
            onFailure={responseError}
            cookiePolicy={'single_host_origin'}
            responseType='code'
            accessType="offline"
            scope="openid email profile https://www.googleapis.com/auth/calendar">
        </GoogleLogin>
    )
}