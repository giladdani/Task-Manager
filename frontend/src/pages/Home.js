import { Events } from "../components/Events"
import { GoogleLoginButton } from "../components/GoogleLoginButton"
import { useRef } from 'react'

export const Home = () => {

    const myRef = useRef();

    const notify_login_successful = () => {
        console.log("in callback function");
        myRef.current.childMethod();
    }
    
    return(
        <div>
            <GoogleLoginButton onLogin={notify_login_successful}></GoogleLoginButton>
            <Events ref={myRef}></Events>
        </div>
    )
}