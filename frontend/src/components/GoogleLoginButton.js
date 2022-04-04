import { GoogleLogin } from "react-google-login"
import axios from "axios"

export const GoogleLoginButton = (props) => {
    const responseGoogle = async (response) => {
        const {code} = response;
        const res = await axios.post('http://localhost:3001/api/calendar/create-tokens', {code});
        document.cookie = res.data.access_token;
        props.onLogin();
    }

    const responseError = (error) => {
        console.log(error);
    }
    
    return(
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