// app.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CarouselPage from "./components/CarouselPage/CarouselPage";
import Home from "./components/home/home";
import Login from "./components/login/login";
import ResultPage from "./components/result/result";
import Admin from "../src/components/admin/admin"
import Dashboard from "./components/dashboard/dashboard";
import ContactSection from "./components/contact/contact";
import AboutPage from "./components/about/about";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CarouselPage />} />
        <Route path='/home' element={<Home/>}/>
          <Route path='/login' element={<Login/>}/>
          <Route path='/result' element={<ResultPage/>}/>
          <Route path='/admin' element={<Admin/>}/>
          <Route path='/dashboard' element={<Dashboard/>}/>
        <Route path="/contact" element={<ContactSection/>}/>
        <Route path="/about" element={<AboutPage/>}/>
      </Routes>
    </Router>
  );
}

export default App;