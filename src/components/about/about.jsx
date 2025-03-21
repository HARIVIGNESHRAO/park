import React from 'react';
import './about.css';
import AboutHero from "./about1";
import MissionSection from "./about2";
import TeamSection from "./about3";

const AboutPage = () => {
  return (
    <div className="about-page">
        <AboutHero/>
        <MissionSection/>
        <TeamSection/>
    </div>
  );
};

export default AboutPage;