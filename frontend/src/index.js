import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app-general/App';
import './styles/style.css';
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";

ReactDOM.render(
  // <StrictMode>
    <App />,
  // </StrictMode>,
  document.getElementById('root')
);