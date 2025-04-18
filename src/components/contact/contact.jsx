import React, { useState } from 'react';
import './contact.css';
import {Menu, X} from "lucide-react";

const ContactSection = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
    const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch('http://localhost:4200/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      alert('Thank you for your message! We will get back to you soon.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } else {
      alert('Something went wrong. Please try again.');
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    alert('Server error. Please try again later.');
  }
};


  return (
    <section className="contact-section" id="contact">
      <header className="header">
        <div className="logo">
          <h1><img src="../images/prahas.png" style={{ width: '100px' }} alt="Vaidya Vani Logo" /></h1>
          <span>Hearing Emotions Hearing Minds</span>
        </div>

        <div className="nav-container">
          <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/#demo">Try Demo</a></li>
              <li><a href="/login">Login</a></li>
              <li className="active"><a href="/contact">Contact</a></li>
            </ul>
          </nav>

          <button className="menu-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      <br/><br/><br/>
      <h2>Contact Us</h2>
      <div className="contact-container">
        <div className="contact-info">
          <div className="info-item">
            <h3>Visit Us</h3>
            <p>Chanchalguda Jail</p>
          </div>
          <div className="info-item">
            <h3>Email Us</h3>
            <p>chanchalguda@gmail.com</p>
          </div>
          <div className="info-item">
            <h3>Call Us</h3>
            <p>+91 9618015699</p>
            <p>Mon-Sat: 9am - 5pm</p>
          </div>
          <div className="social-links">
            <a href="#" className="social-link">Twitter</a>
            <a href="#" className="social-link">LinkedIn</a>
            <a href="#" className="social-link">Facebook</a>
            <a href="#" className="social-link">Instagram</a>
          </div>
        </div>
        <div className="contact-form-container">
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Your Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Your Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Your Message</label>
              <textarea
                id="message"
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            <button type="submit" className="submit-button">Send Message</button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
