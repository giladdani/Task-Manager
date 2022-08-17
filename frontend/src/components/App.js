import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Login } from '../pages/Login';
import { MainPagesContainer } from './MainPagesContainer';
import Snackbar from './general/Snackbar'

const App = () => {
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [renderFlag, setFlag] = useState(false);

  const onLogin = () => {
    window.location = "/schedules";
  }

  const handleNewMsg = (msg) =>{
    setSnackbarMsg(msg);
    setFlag(!renderFlag);
  }

  return (
      <Router>
        <div className="app-header">
          <Snackbar msg={snackbarMsg} key={renderFlag}></Snackbar>
          <Routes>
            <Route path="/" element={<Login to="/login" onLogin={onLogin} setMsg={handleNewMsg} />} />
            <Route path="*" element={<MainPagesContainer setMsg={handleNewMsg}/>}/>
          </Routes>
        </div>
      </Router>
  )
}

export default App;