import React, {useEffect, useState} from 'react';
import './contact.css';
import {Menu, X} from "lucide-react";
import styles from "../CarouselPage/CarouselPage.module.css";
import {useNavigate} from "react-router-dom";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const navigate = useNavigate();
  const handleSignUp = () => {
    navigate('/login');
  };
    const [activeSection, setActiveSection] = useState("hero")

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
    const response = await fetch('https://guruvayur.onrender.com/api/contact', {
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
useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY

      const sections = ["home", "about", "features", "demo", "process"].map((id) => {
        const element = document.getElementById(id)
        if (!element) return { id, top: 0, bottom: 0 }

        const rect = element.getBoundingClientRect()
        return {
          id,
          top: rect.top + scrollPosition - 100,
          bottom: rect.bottom + scrollPosition - 100,
        }
      })

      for (const section of sections) {
        if (scrollPosition >= section.top && scrollPosition < section.bottom) {
          setActiveSection(section.id)
          break
        }
      }
    }


    window.addEventListener("scroll", handleScroll)


    handleScroll()


    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section className="contact-section" id="contact">
      <header className={styles["navbar"]}>
        <div className={`${styles["container"]} ${styles["navbar-container"]}`}>
          <h1 className={styles["logo"]}>Vaidya Vani</h1>
          <nav className={styles["desktop-nav"]}>
            <ul className={styles["nav-list"]}>
              <li>
                <a href="/" className={`${styles["nav-item"]} ${activeSection === "home" ? styles["active"] : ""}`}>
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className={`${styles["nav-item"]} ${activeSection === "about" ? styles["active"] : ""}`}
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/"
                  className={`${styles["nav-item"]} ${activeSection === "features" ? styles["active"] : ""}`}
                >
                  Features
                </a>
              </li>
              <li>
                <a href="/" className={`${styles["nav-item"]} ${activeSection === "demo" ? styles["active"] : ""}`}>
                  Demo
                </a>
              </li>
              <li>
                <a
                  href="/"
                  className={`${styles["nav-item"]} ${activeSection === "process" ? styles["active"] : ""}`}
                >
                  How It Works
                </a>
              </li>
                            <li>
                <a
                  href="/contact"
                  className={`${styles["nav-item"]}  ${activeSection === "hero" ? styles["active"] : ""}`}
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className={styles["mobile-menu-button"]}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-expanded={showMobileMenu}
            aria-label="Toggle navigation menu"
          >
            <div className={styles["menu-bar"]}></div>
            <div className={styles["menu-bar"]}></div>
            <div className={styles["menu-bar"]}></div>
          </button>

          <button className={styles["signup-button"]} onClick={handleSignUp}>Sign Up</button>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className={styles["mobile-nav"]}>
            <nav className={styles["container"]}>
              <ul className={styles["mobile-nav-list"]}>
                <li>
                  <a
                    href="/"
                    className={`${styles["mobile-nav-item"]} ${activeSection === "home" ? styles["active"] : ""}`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="/about"
                    className={`${styles["mobile-nav-item"]} ${activeSection === "about" ? styles["active"] : ""}`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="/"
                    className={`${styles["mobile-nav-item"]} ${activeSection === "features" ? styles["active"] : ""}`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="/"
                    className={`${styles["mobile-nav-item"]} ${activeSection === "demo" ? styles["active"] : ""}`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Demo
                  </a>
                </li>
                <li>
                  <a
                    href="/"
                    className={`${styles["mobile-nav-item"]} ${activeSection === "process" ? styles["active"] : ""}`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    How It Works
                  </a>
                </li>
                <li>
                <a
                  href="/contact"
                  className={`${styles["nav-item"]} ${activeSection === "hero" ? styles["active"] : ""}`}
                >
                  Contact Us
                </a>
              </li>
                <li className={styles["mobile-signup-container"]}>
                  <button className={`${styles["signup-button"]} ${styles["mobile-signup"]}` } onClick={handleSignUp}>Sign Up</button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </header>
      <br/>
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
