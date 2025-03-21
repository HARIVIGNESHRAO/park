import React from 'react';
import './about2.css';

const MissionSection = () => {
  return (
    <section className="mission-section">
      <h2>Our Mission</h2>
      <div className="mission-content">
        <div className="mission-text">
          <p>
            We believe in creating technology that empowers people and businesses to achieve more.
            Our mission is to develop innovative solutions that address real-world challenges and
            make a positive impact on society.
          </p>
          <p>
            Since our founding in 2025, we've been committed to excellence, integrity, and
            customer-focused innovation. We work closely with our clients to understand their
            unique needs and deliver tailored solutions that exceed expectations.
          </p>
        </div>
        <div className="values-container">
          <div className="value-card">
            <h3>Innovation</h3>
            <p>We constantly explore new ideas and technologies to stay ahead of the curve.</p>
          </div>
          <div className="value-card">
            <h3>Integrity</h3>
            <p>We operate with honesty, transparency, and ethical standards in all we do.</p>
          </div>
          <div className="value-card">
            <h3>Excellence</h3>
            <p>We strive for the highest quality in our products and services.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;