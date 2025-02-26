import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Login from './components/login/login'
import reportWebVitals from './reportWebVitals';
import {BrowserRouter, Router} from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "bootstrap-icons/font/bootstrap-icons.css"
import Carousel from "bootstrap/js/src/carousel";
import CarouselPage from "./components/CarouselPage/CarouselPage";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
        <React.StrictMode>
      <App/>
  < /React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
