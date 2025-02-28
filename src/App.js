// app.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CarouselPage from "./components/CarouselPage/CarouselPage";
import Home from "./components/home/home";
import Login from "./components/login/login";
import ResultPage from "./components/result/result";
import Admin from "../src/components/admin/admin"
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CarouselPage />} />
        <Route path='/home' element={<Home/>}/>
          <Route path='/login' element={<Login/>}/>
          <Route path='/result' element={<ResultPage/>}/>
          <Route path='/admin' element={<Admin/>}/>
      </Routes>
    </Router>
  );
}

export default App;