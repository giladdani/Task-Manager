import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Login } from '../pages/Login';
import { MainPagesContainer } from './MainPagesContainer';

const App = () => {
  const onLogin = () => {
    window.location = "/schedules";
  }

  return (
    <Router>
      <div className="app-header">
        <Routes>
          <Route path="/" element={<Login to="/login" onLogin={onLogin} />} />
          <Route path="*" element={<MainPagesContainer />}></Route>
        </Routes>
      </div>
    </Router>
  )
}

export default App;