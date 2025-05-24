import React, {useEffect, useState} from 'react';
import './about.css';
import AboutHero from "./about1";
import MissionSection from "./about2";
import TeamSection from "./about3";
import {Menu, X} from "lucide-react";
import {useNavigate} from "react-router-dom";
import styles from "../CarouselPage/CarouselPage.module.css";

const AboutPage = () => {
     const [showMobileMenu, setShowMobileMenu] = useState(false)
  const navigate = useNavigate();
  const handleSignUp = () => {
    navigate('/login');
  };
    const [activeSection, setActiveSection] = useState("about")

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
    <div className="about-page">
      <header className={styles["navbar"]}>
        <div className={`${styles["container"]} ${styles["navbar-container"]}`}>
          <h1 className={styles["logo"]}>Vaidya Vani</h1>

          {/* Desktop Navigation */}
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
                  className={`${styles["nav-item"]}`}
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
                  className={`${styles["nav-item"]}`}
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
        <AboutHero/>
        <MissionSection/>
        <TeamSection/>
    </div>
  );
};

export default AboutPage;