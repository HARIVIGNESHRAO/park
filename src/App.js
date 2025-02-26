// app.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CarouselPage from "./components/CarouselPage/CarouselPage";
import Home from "./components/home/home";
import Login from "./components/login/login";
import ResultPage from "./components/result/result";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CarouselPage />} />
        <Route path='/home' element={<Home/>}/>
          <Route path='/login' element={<Login/>}/>
          <Route path='/result' element={<ResultPage/>}/>
      </Routes>
    </Router>
  );
}

export default App;