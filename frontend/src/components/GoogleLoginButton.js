import { GoogleLogin } from "react-google-login"
import { useState } from 'react'
import { ThreeDots } from 'react-loader-spinner'


export const GoogleLoginButton = (props) => {
    const [loggingIn, setLoggingIn] = useState(false);

    const getLoggedInUserData = async (response) => {
        setLoggingIn(true);

        const { code } = response;
        try {
            const res = await fetch(`http://localhost:3001/api/users`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({ code })
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
        <>
            <div hidden={loggingIn}>
                <GoogleLogin
                    clientId="255089907729-d285lq0bfp7kjhpt99m03a3sktpsva5i.apps.googleusercontent.com"
                    buttonText="Sign in"
                    onSuccess={getLoggedInUserData}
                    onFailure={responseError}
                    cookiePolicy={'single_host_origin'}
                    responseType='code'
                    accessType="offline"
                    scope="openid email profile https://www.googleapis.com/auth/calendar">
                </GoogleLogin>
            </div>
            <div hidden={!loggingIn}>
                <h3>Logging in...</h3>
                <ThreeDots color="#00BFFF" height={80} width={80} />
            </div>
        </>
    )
}