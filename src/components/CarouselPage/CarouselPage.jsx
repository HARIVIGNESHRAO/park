import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Menu, X, Mic, Smile, Frown, Meh } from 'lucide-react';
import './CarouselPage.css';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [emotion, setEmotion] = useState(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const slides = [
    {
      title: "Detect Happiness",
      description: "Our system can recognize joyful tones in your speech with 95% accuracy",
      icon: <Smile className="slide-icon text-yellow-500" size={48} />,
      color: "bg-yellow-100"
    },
    {
      title: "Identify Sadness",
      description: "Subtle emotional cues in voice patterns help detect sadness and melancholy",
      icon: <Frown className="slide-icon text-blue-500" size={48} />,
      color: "bg-blue-100"
    },
    {
      title: "Analyze Neutrality",
      description: "Even neutral tones carry emotional information our system can process",
      icon: <Meh className="slide-icon text-gray-500" size={48} />,
      color: "bg-gray-100"
    }
  ];

  const nextSlide = () => {
    setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const simulateRecording = () => {
    setIsRecording(true);
    setEmotion(null);

    setTimeout(() => {
      setIsRecording(false);
      const emotions = ["Happy", "Sad", "Neutral", "Excited", "Angry"];
      setEmotion(emotions[Math.floor(Math.random() * emotions.length)]);
    }, 3000);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <h1><img src="../images/prahas.png" style={{ width: '100px' }}/></h1>
          <span>Hearing Emotions Hearing Minds</span>
        </div>

        <div className="nav-container">
          <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
            <ul>
              <li className="active"><a href="#home">Home</a></li>
              <li><a href="/about">About</a></li>
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
      <main>
        <section className="hero-section">
          <div className="hero-content">
            <h2 className="animate-title">Discover the Emotion in Your Voice</h2>
            <p>Advanced AI technology that recognizes emotions through speech patterns and vocal characteristics</p>
            <div className="hero-buttons">
              <button className="btn primary">Learn More</button>
              <button className="btn secondary">View Demo</button>
            </div>
          </div>
          <div className="hero-image">
  <div className="wave-animation">
    <div className="robot-ear left"></div>
    <div className="robot-ear right"></div>
    <div className="robot-arm left"></div>
    <div className="robot-arm right"></div>
    <div className="robot-screen">
      <div className="robot-expression"></div>
      <div className="robot-mouth"></div>
    </div>
    <div className="soundwave left"></div>
    <div className="soundwave right"></div>
    <div className="thinking-dot"></div>
    <div className="thinking-dot"></div>
    <div className="thinking-dot"></div>
  </div>
</div>

        </section>
        <section className="features-section">
          <h2>Emotion Recognition Features</h2>

          <div className="carousel-container">
            <button className="carousel-arrow prev" onClick={prevSlide}>
              <ArrowLeft size={24} />
            </button>

            <div className="carousel-slides">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`carousel-slide ${slide.color} ${index === activeSlide ? 'active' : ''}`}
                >
                  <div className="slide-content">
                    {slide.icon}
                    <h3>{slide.title}</h3>
                    <p>{slide.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="carousel-arrow next" onClick={nextSlide}>
              <ArrowRight size={24} />
            </button>

            <div className="carousel-dots">
              {slides.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === activeSlide ? 'active' : ''}`}
                  onClick={() => setActiveSlide(index)}
                ></span>
              ))}
            </div>
          </div>
        </section>
        <section className="demo-section" id="demo">
          <h2>Try Our Emotion Recognition</h2>
          <div className="demo-container">
            <div className="mic-container">
              <button
                className={`mic-button ${isRecording ? 'recording' : ''}`}
                onClick={simulateRecording}
                disabled={isRecording}
              >
                <Mic size={32} />
                <span className="ripple"></span>
              </button>
              <p>{isRecording ? 'Listening...' : 'Click to speak'}</p>
            </div>

            <div className="result-container">
              {emotion ? (
                <>
                  <h3>Detected Emotion:</h3>
                  <div className="emotion-result">
                    <span className="emotion-text">{emotion}</span>
                    <div className="emotion-animation"></div>
                  </div>
                </>
              ) : (
                <p>Your emotion will appear here after speaking</p>
              )}
            </div>
          </div>
        </section>
        <section className="how-it-works">
          <h2>How Our Technology Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Voice Capture</h3>
              <p>High-quality audio sampling captures the nuances in your speech</p>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Feature Extraction</h3>
              <p>Our algorithms extract key acoustic features from your voice</p>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Emotion Analysis</h3>
              <p>Deep learning models analyze patterns to identify emotional states</p>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <h3>Results Display</h3>
              <p>Emotions are categorized and displayed with helpful insights</p>
            </div>
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Vaidya Vani</h3>
            <p>Cutting-edge emotion recognition technology for speech analysis</p>
          </div>

          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/about">About Us</a></li>
              <li><a href="/login">Login</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Contact</h3>
            <p>chanchalguda@gmail.com</p>
            <p>+91 9618015699</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 Vaidya Vani All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;