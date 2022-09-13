import { GoogleLoginButton } from "../components/app-general/GoogleLoginButton"

export const Login = (props) => {
    const onGoogleLogin = async () => {
        props.onLogin();
    }

    return (
        <div className="center_elem center_text">
            <h1>Please sign in with your Google account:</h1>
            <h4>(Task Master requires access to your Google Calendar)</h4>
            <GoogleLoginButton onLogin={onGoogleLogin} setMsg={props.setMsg}/>
        </div>
    )
}