import React from 'react';
import './about1.css';

const AboutHero = () => {
  return (
    <section className="about-hero">
      <div className="about-hero-content">
        <h1>About Us</h1>
        <p className="tagline">We're dedicated to creating innovative solutions that make a difference.</p>
      </div>
      <div className="about-hero-image">
        <div className="hero-image-placeholder">
            <img src="../images/prahas.png" style={{ width: '550px' }}/>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;