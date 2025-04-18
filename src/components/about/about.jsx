import React, {useState} from 'react';
import './about.css';
import AboutHero from "./about1";
import MissionSection from "./about2";
import TeamSection from "./about3";
import {Menu, X} from "lucide-react";

const AboutPage = () => {
        const [isMenuOpen, setIsMenuOpen] = useState(false);
            const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  return (
    <div className="about-page">
<header className="header">
        <div className="logo">
          <h1><img src="../images/prahas.png" style={{ width: '100px' }} alt="Vaidya Vani Logo" /></h1>
          <span>Hearing Emotions Hearing Minds</span>
        </div>

        <div className="nav-container">
          <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
            <ul>
              <li><a href="/">Home</a></li>
              <li className="active"><a href="/about">About</a></li>
              <li><a href="#demo">Try Demo</a></li>
              <li><a href="/login">Login</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </nav>

          <button className="menu-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      <br/><br/><br/>
        <AboutHero/>
        <MissionSection/>
        <TeamSection/>
    </div>
  );
};

export default AboutPage;
