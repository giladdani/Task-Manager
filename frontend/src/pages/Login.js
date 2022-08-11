import { GoogleLoginButton } from "../components/GoogleLoginButton"

export const Login = (props) => {
    const onGoogleLogin = async () => {
        props.onLogin();
    }

    return (
        <div className="center_elem">
            <h1>Please sign in with your Google account:</h1>
            <h4>(Task Manager requires access to your Google Calendar)</h4>
            <GoogleLoginButton onLogin={onGoogleLogin} />
        </div>
    )
}