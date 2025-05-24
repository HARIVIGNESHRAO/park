import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  Cpu,
  Brain,
  BarChart,
  ChevronDown,
  Smile,
  Facebook,
  Twitter,
  Instagram,
  MapPin,
  Mail,
  Phone,
  Download,
  Calendar,
  Users,
  Award,
  BookOpen,
  Activity,
  Shield,
} from "lucide-react";
import styles from "./CarouselPage.module.css";

// Process Step Component
const ProcessStep = ({ number, title, description, icon }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={styles["process-step"]}>
      <div className={styles["step-number-container"]}>
        <div className={styles["step-circle"]}>{number}</div>
        {number < 4 && <div className={styles["step-line"]}></div>}
      </div>
      <div className={styles["step-content"]}>
        <div className={styles["step-header"]}>
          <div className={styles["step-icon"]}>{icon}</div>
          <h3 className={styles["step-title"]}>{title}</h3>
        </div>
        <p className={styles["step-description"]}>{description}</p>
        {expanded && (
          <div className={styles["step-details"]}>
            {number === 1 &&
              "Our high-fidelity microphone captures subtle voice inflections and tonal variations that contain emotional cues. The system filters out background noise to ensure accurate analysis."}
            {number === 2 &&
              "Advanced signal processing extracts over 1,500 acoustic features including pitch, tempo, energy, and spectral characteristics that correlate with different emotional states."}
            {number === 3 &&
              "Our proprietary neural network, trained on over 10,000 hours of emotionally-labeled speech samples, identifies patterns associated with specific emotions with 95% accuracy."}
            {number === 4 &&
              "Results are presented in an intuitive interface showing the primary emotion and distribution of all detected emotional states, with insights tailored for clinical interpretation."}
          </div>
        )}
        <button
          className={styles["learn-more-btn"]}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Learn more"}{" "}
          <ChevronDown
            className={`${styles["chevron-icon"]} ${
              expanded ? styles["rotate"] : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
};

// Loading Component
const LoadingOverlay = ({
  isVisible,
  message = "Loading...",
  ariaLabel = "Loading in progress",
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={styles["loading-overlay"]}
      aria-live="polite"
      aria-label={ariaLabel}
      role="status"
    >
      <div className={styles["loading-content"]}>
        <div className={styles["loading-spinner-container"]}>
          <div className={styles["loading-spinner"]}></div>
          <div className={styles["loading-wave"]}></div>
        </div>

        <div className={styles["loading-bubbles"]}>
          <div className={styles["loading-bubble"]}></div>
          <div className={styles["loading-bubble"]}></div>
          <div className={styles["loading-bubble"]}></div>
        </div>

        <p className={styles["loading-message"]}>{message}</p>
      </div>
    </div>
  );
};
const EmotionResult = ({ result }) => {
  if (!result) return null;
  return (
    <div className={styles["emotion-result"]}>
      <h2>Analysis Result</h2>
      <div>
        <strong>Transcription:</strong> {result.text || <em>Not detected</em>}
      </div>
      <div>
        <strong>Language:</strong> {result.language || <em>Unknown</em>}
      </div>
      <div>
        <strong>Emotions:</strong>{" "}
        {result.emotions && result.emotions.length > 0
          ? result.emotions.join(", ")
          : <em>None detected</em>}
      </div>
      <div>
        <strong>Tones:</strong>{" "}
        {result.tones && result.tones.length > 0
          ? result.tones.join(", ")
          : <em>None detected</em>}
      </div>
      <div>
        <strong>Reasons:</strong> {result.reasons || <em>None</em>}
      </div>
      <div>
        <strong>Suggestions:</strong>{" "}
        {result.suggestions && result.suggestions.length > 0
          ? (
            <ul>
              {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          )
          : <em>None</em>}
      </div>
      <div>
        <strong>Acoustic Analysis:</strong>
        {result.acoustic_analysis && Object.keys(result.acoustic_analysis).length > 0 ? (
          <ul>
            {Object.entries(result.acoustic_analysis).map(([k, v]) => (
              <li key={k}>
                <strong>{k}:</strong> {v}
              </li>
            ))}
          </ul>
        ) : <em>None</em>}
      </div>
    </div>
  );
};


// Main Component
export const CarouselPage = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Click to speak");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingMessage, setProcessingMessage] = useState(
    "Loading your experience..."
  );
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const navigate = useNavigate();

  // Audio recording refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleSignUp = () => {
    navigate("/login");
  };

  const slides = [
    {
      title: "Advanced Emotion Detection",
      description:
        "Our AI-powered system detects subtle emotional nuances in voice patterns with remarkable 95% accuracy, helping therapists understand patients better than ever.",
      icon: <Brain className="slide-icon" />,
    },
    {
      title: "Real-time Analysis",
      description:
        "Experience instant emotional insights as our system processes voice patterns in real-time, providing immediate feedback on emotional states during therapy sessions.",
      icon: <Cpu className="slide-icon" />,
    },
    {
      title: "Comprehensive Understanding",
      description:
        "From joy to contemplation, our technology recognizes a wide spectrum of emotions, helping build deeper connections between therapists and patients.",
      icon: <BarChart className="slide-icon" />,
    },
  ];
  const steps = [
    {
      number: 1,
      title: "Voice Capture",
      description: "High-quality audio sampling captures the nuances in your speech",
      icon: <Mic className="step-icon-svg" />,
    },
    {
      number: 2,
      title: "Feature Extraction",
      description: "Our algorithms extract key acoustic features from your voice",
      icon: <Cpu className="step-icon-svg" />,
    },
    {
      number: 3,
      title: "Emotion Analysis",
      description:
        "Deep learning models analyze patterns to identify emotional states",
      icon: <Brain className="step_icon_svg" />,
    },
    {
      number: 4,
      title: "Results Display",
      description: "Emotions are categorized and displayed with helpful insights",
      icon: <BarChart className="step_icon_svg" />,
    },
  ];

  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;

      const sections = ["home", "about", "features", "demo", "process"].map(
        (id) => {
          const element = document.getElementById(id);
          if (!element) return { id, top: 0, bottom: 0 };

          const rect = element.getBoundingClientRect();
          return {
            id,
            top: rect.top + scrollPosition - 100,
            bottom: rect.bottom + scrollPosition - 100,
          };
        }
      );

      for (const section of sections) {
        if (
          scrollPosition >= section.top &&
          scrollPosition < section.bottom
        ) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

 // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new window.MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await sendAudioToBackend(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus("Listening...");
      setResult(null);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setStatus("Microphone access denied");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatus("Processing...");
    }
  };


  const sendAudioToBackend = async (audioBlob) => {
    try {
      setIsLoading(true);
      setProcessingMessage("Analyzing your voice...");
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const response = await fetch("http://localhost:5000/emotion", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process audio");
      }

      const data = await response.json();
      setResult(data);
      setStatus("Click to speak");
    } catch (error) {
      console.error("Error processing audio:", error);
      setStatus("Error processing audio");
    } finally {
      setIsLoading(false);
    }
  };


 const handleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
;

  return (
    <div className={styles["app-container"]}>
      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={isLoading}
        message={processingMessage}
        ariaLabel={processingMessage}
      />

      {/* Navbar */}
      <header className={styles["navbar"]}>
        <div className={`${styles["container"]} ${styles["navbar-container"]}`}>
          <h1 className={styles["logo"]}>Vaidya Vani</h1>

          {/* Desktop Navigation */}
          <nav className={styles["desktop-nav"]}>
            <ul className={styles["nav-list"]}>
              <li>
                <a
                  href="/"
                  className={`${styles["nav-item"]} ${
                    activeSection === "home" ? styles["active"] : ""
                  }`}
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className={`${styles["nav-item"]} ${
                    activeSection === "about" ? styles["active"] : ""
                  }`}
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className={`${styles["nav-item"]} ${
                    activeSection === "features" ? styles["active"] : ""
                  }`}
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#demo"
                  className={`${styles["nav-item"]} ${
                    activeSection === "demo" ? styles["active"] : ""
                  }`}
                >
                  Demo
                </a>
              </li>
              <li>
                <a
                  href="#process"
                  className={`${styles["nav-item"]} ${
                    activeSection === "process" ? styles["active"] : ""
                  }`}
                >
                  How It Works
                </a>
              </li>
              <li>
                <a href="/contact" className={`${styles["nav-item"]}`}>
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
          <button className={styles["signup-button"]} onClick={handleSignUp}>
            Sign Up
          </button>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className={styles["mobile-nav"]}>
            <nav className={styles["container"]}>
              <ul className={styles["mobile-nav-list"]}>
                <li>
                  <a
                    href="/"
                    className={`${styles["mobile-nav-item"]} ${
                      activeSection === "home" ? styles["active"] : ""
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="/about"
                    className={`${styles["mobile-nav-item"]} ${
                      activeSection === "about" ? styles["active"] : ""
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className={`${styles["mobile-nav-item"]} ${
                      activeSection === "features" ? styles["active"] : ""
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#demo"
                    className={`${styles["mobile-nav-item"]} ${
                      activeSection === "demo" ? styles["active"] : ""
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Demo
                  </a>
                </li>
                <li>
                  <a
                    href="#process"
                    className={`${styles["mobile-nav-item"]} ${
                      activeSection === "process" ? styles["active"] : ""
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="/contact" className={`${styles["nav-item"]}`}>
                    Contact Us
                  </a>
                </li>
                <li className={styles["mobile-signup-container"]}>
                  <button
                    className={`${styles["signup-button"]} ${styles["mobile-signup"]}`}
                    onClick={handleSignUp}
                  >
                    Sign Up
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}

      <section id="home" className={styles["hero-section"]}>
        <div
          className={`${styles["hero-bg-circle"]} ${styles["hero-bg-circle-1"]}`}
        ></div>
        <div
          className={`${styles["hero-bg-circle"]} ${styles["hero-bg-circle-2"]}`}
        ></div>

        <div className={`${styles["container"]} ${styles["hero-container"]}`}>
          <div className={styles["hero-content"]}>
            <div className={styles["hero-badge"]}>
              Revolutionizing Mental Health Assessment
            </div>
            <h1 className={styles["hero-title"]}>
              Welcome to{" "}
              <span style={{ fontSize: "4.0rem" }} className={styles["text-teal"]}>
                Vaidya
              </span>{" "}
              <span
                style={{ fontSize: "4.0rem" }}
                className={styles["text-blue"]}
              >
                Vani
              </span>
            </h1>
            <p className={styles["hero-description"]}>
              A revolutionary speech-based emotion detection solution designed
              specifically for psychiatric professionals.
            </p>
            <div className={styles["hero-buttons"]}>
              <a href="#demo" className={styles["btn btn-primary"]}>
                Try Demo
              </a>
              <a href="#features" className={styles["btn btn-outline"]}>
                Learn More
              </a>
            </div>

            <div className={styles["hero-stats"]}>
              <div className={styles["hero-stat"]}>
                <Award className={styles["hero-stat-icon"]} />
                <span>High accuracy in detecting emotions from clear speech</span>
              </div>
              <div className={styles["hero-stat"]}>
                <Users className={styles["hero-stat-icon"]} />
                <span>Supports dozens of languages for global applicability</span>
              </div>
              <div className={styles["hero-stat"]}>
                <BookOpen className={styles["hero-stat-icon"]} />
                <span>Research Backed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className={styles["about-section"]}>
        <div className={styles["container"]}>
          <div className={styles["about-grid"]}>
            <div className={styles["about-content"]}>
              <div className={styles["section-badge"]}>About Vaidya Vani</div>
              <h2 className={styles["section-title"]}>
                Transforming Mental Health Assessment Through Voice Analysis
              </h2>
              <p className={styles["section-text"]}>
                Vaidya Vani is a cutting-edge emotion detection platform that
                analyzes speech patterns to identify emotional states with
                remarkable accuracy. Our technology helps mental health
                professionals gain deeper insights into their patients' emotional
                wellbeing.
              </p>
              <p className={styles["section-text"]}>
                Developed by a team of AI researchers and clinical psychologists,
                our system has been trained on thousands of hours of
                emotionally-labeled speech to recognize subtle vocal cues that
                indicate different emotional states.
              </p>

              <div className={styles["about-cards"]}>
                <div
                  className={`${styles["about-card"]} ${styles["about-card-teal"]}`}
                >
                  <h3 className={styles["about-card-title"]}>For Clinicians</h3>
                  <p className={styles["about-card-text"]}>
                    Enhanced diagnostic capabilities and treatment monitoring
                  </p>
                </div>
                <div
                  className={`${styles["about-card"]} ${styles["about-card-blue"]}`}
                >
                  <h3 className={styles["about-card-title"]}>For Researchers</h3>
                  <p className={styles["about-card-text"]}>
                    Precise emotional data collection for advanced studies
                  </p>
                </div>
              </div>
            </div>

            <div className={styles["stats-container"]}>
              <div className={styles["stats-box"]}>
                <div className={styles["stats-grid"]}>
                  <div className={styles["stat-card"]}>
                    <div className={styles["stat-number text-teal"]}>
                      High accuracy in detecting emotions from clear speech
                    </div>
                    <p className={styles["stat-label"]}>
                      Emotion detection accuracy
                    </p>
                  </div>
                  <div className={styles["stat-card"]}>
                    <div className={styles["stat-number text-blue"]}>
                      Supports dozens of languages
                    </div>
                    <p className={styles["stat-label"]}>Languages Supported</p>
                  </div>
                  <div className={styles["stat-card"]}>
                    <div className={styles["stat-number text-teal"]}>
                      Trained on a large volume of emotionally-rich audio data
                    </div>
                    <p className={styles["stat-label"]}>Hours of training data</p>
                  </div>
                  <div className={styles["stat-card"]}>
                    <div className={styles["stat-number text-blue"]}>
                      Capable of real-time analysis using modern processing system
                    </div>
                    <p className={styles["stat-label"]}>
                      Real-time analysis speed
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={`${styles["stats-bg-circle"]} ${styles["stats-bg-circle stats-bg-circle-1"]}`}
              ></div>
              <div
                className={`${styles["stats-bg-circle"]} ${styles["stats-bg-circle stats-bg-circle-2"]}`}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles["features-section"]}>
        <div className={styles["container"]}>
          <div className={styles["section-header"]}>
            <div className={styles["section-badge"]}>Our Features</div>
            <h2 className={styles["section-title"]}>
              Key <span className={styles["text-teal"]}>Features</span>
            </h2>
            <p className={styles["section-description"]}>
              Discover how our advanced technology can transform your practice
              with these powerful features
            </p>
          </div>

          <div className={styles["features-content"]}>
            {/* Feature Tabs */}
            <div className={styles["feature-tabs"]}>
              <div className={styles["tabs-header"]}>
                {slides.map((slide, index) => (
                  <button
                    key={index}
                    className={`${styles["tab-button"]} ${
                      index === activeSlide ? styles["active"] : ""
                    }`}
                    onClick={() => setActiveSlide(index)}
                  >
                    <div className={styles["tab-icon-container"]}>
                      {slide.icon}
                    </div>
                    <span>{slide.title}</span>
                  </button>
                ))}
              </div>

              <div className={styles["tabs-content"]}>
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`${styles["tab-panel"]} ${
                      index === activeSlide ? styles["active"] : ""
                    }`}
                  >
                    <div className={styles["tab-panel-content"]}>
                      <div className={styles["tab-panel-image"]}>
                        <div className={styles["feature-illustration"]}>
                          {index === 0 && (
                            <div
                              className={styles["emotion-detection-illustration"]}
                            >
                              <div className={styles["brain-waves"]}></div>
                              <div className={styles["brain-icon"]}>
                                {slide.icon}
                              </div>
                              <div className={styles["emotion-dots"]}>
                                <span
                                  className={styles["emotion-dot happy"]}
                                ></span>
                                <span className={styles["emotion-dot sad"]}></span>
                                <span
                                  className={styles["emotion-dot calm"]}
                                ></span>
                                <span
                                  className={styles["emotion-dot excited"]}
                                ></span>
                              </div>
                            </div>
                          )}
                          {index === 1 && (
                            <div className={styles["realtime-illustration"]}>
                              <div className={styles["realtime-waves"]}></div>
                              <div className={styles["realtime-icon"]}>
                                {slide.icon}
                              </div>
                              <div className={styles["realtime-bars"]}>
                                <span className={styles["realtime-bar"]}></span>
                                <span className={styles["realtime-bar"]}></span>
                                <span className={styles["realtime-bar"]}></span>
                                <span className={styles["realtime-bar"]}></span>
                              </div>
                            </div>
                          )}
                          {index === 2 && (
                            <div
                              className={styles["comprehensive-illustration"]}
                            >
                              <div className={styles["comprehensive-icon"]}>
                                {slide.icon}
                              </div>
                              <div className={styles["comprehensive-chart"]}>
                                <span className={styles["chart-bar"]}></span>
                                <span className={styles["chart-bar"]}></span>
                                <span className={styles["chart-bar"]}></span>
                                <span className={styles["chart-bar"]}></span>
                                <span className={styles["chart-bar"]}></span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={styles["tab-panel-info"]}>
                        <h3 className={styles["tab-panel-title"]}>
                          {slide.title}
                        </h3>
                        <p className={styles["tab-panel-description"]}>
                          {slide.description}
                        </p>
                        <ul className={styles["feature-benefits"]}>
                          {index === 0 && (
                            <>
                              <li className={styles["feature-benefit-item"]}>
                                <div
                                  className={styles["benefit-icon-container"]}
                                >
                                  <Award className={styles["benefit-icon"]} />
                                </div>
                                <div className={styles["benefit-content"]}>
                                  <h4 className={styles["benefit-title"]}>
                                    High accuracy in detecting emotions from clear
                                    speech
                                  </h4>
                                  <p className={styles["benefit-description"]}>
                                    Industry-leading precision in emotion
                                    detection
                                  </p>
                                </div>
                              </li>
                              <li className={styles["feature-benefit-item"]}>
                                <div
                                  className={styles["benefit-icon-container"]}
                                >
                                  <BookOpen className={styles["benefit-icon"]} />
                                </div>
                                <div className={styles["benefit-content"]}>
                                  <h4 className={styles["benefit-title"]}>
                                    Research Backed
                                  </h4>
                                  <p className={styles["benefit-description"]}>
                                    Based on extensive clinical studies and
                                    research
                                  </p>
                                </div>
                              </li>
                            </>
                          )}
                          {index === 1 && (
                            <>
                              <li className={styles["feature-benefit-item"]}>
                                <div
                                  className={styles["benefit-icon-container"]}
                                >
                                  <Cpu className={styles["benefit-icon"]} />
                                </div>
                                <div className={styles["benefit-content"]}>
                                  <h4 className={styles["benefit-title"]}>
                                    Instant Processing
                                  </h4>
                                  <p className={styles["benefit-description"]}>
                                    Results in seconds, not minutes or hours
                                  </p>
                                </div>
                              </li>
                              <li className={styles["feature-benefit-item"]}>
                                <div
                                  className={styles["benefit-icon-container"]}
                                >
                                  <Calendar className={styles["benefit-icon"]} />
                                </div>
                                <div className={styles["benefit-content"]}>
                                  <h4 className={styles["benefit-title"]}>
                                    Session Tracking
                                  </h4>
                                  <p className={styles["benefit-description"]}>
                                    Monitor emotional changes across multiple
                                    sessions
                                  </p>
                                </div>
                              </li>
                            </>
                          )}
                          {index === 2 && (
                            <>
                              <li className={styles["feature-benefit-item"]}>
                                <div
                                  className={styles["benefit-icon-container"]}
                                >
                                  <BarChart className={styles["benefit-icon"]} />
                                </div>
                                <div className={styles["benefit-content"]}>
                                  <h4 className={styles["benefit-title"]}>
                                    Detailed Analysis
                                  </h4>
                                  <p className={styles["benefit-description"]}>
                                    Comprehensive breakdown of emotional states
                                  </p>
                                </div>
                              </li>
                              <li className={styles["feature-benefit-item"]}>
                                <div
                                  className={styles["benefit-icon-container"]}
                                >
                                  <Download className={styles["benefit-icon"]} />
                                </div>
                                <div className={styles["benefit-content"]}>
                                  <h4 className={styles["benefit-title"]}>
                                    Exportable Reports
                                  </h4>
                                  <p className={styles["benefit-description"]}>
                                    Share insights with patients or colleagues
                                  </p>
                                </div>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Cards */}
            <div className={styles["feature-highlights"]}>
              <h3 className={styles["highlights-title"]}>
                Additional Capabilities
              </h3>
              <div className={styles["feature-cards"]}>
                <div className={styles["feature-card"]}>
                  <div className={styles["feature-card-icon"]}>
                    <Calendar className={styles["feature-card-icon-svg"]} />
                  </div>
                  <h3 className={styles["feature-card-title"]}>
                    Session Tracking
                  </h3>
                  <p className={styles["feature-card-description"]}>
                    Track emotional progress across multiple therapy sessions with
                    detailed reports and visualizations.
                  </p>
                  <div className={styles["feature-card-footer"]}>
                    <span className={styles["feature-tag"]}>Premium</span>
                  </div>
                </div>

                <div className={styles["feature-card"]}>
                  <div className={styles["feature-card-icon"]}>
                    <Download className={styles["feature-card-icon-svg"]} />
                  </div>
                  <h3 className={styles["feature-card-title"]}>Export & Share</h3>
                  <p className={styles["feature-card-description"]}>
                    Easily export analysis results in multiple formats and
                    securely share with colleagues or patients.
                  </p>
                  <div className={styles["feature-card-footer"]}>
                    <span className={styles["feature-tag"]}>All Plans</span>
                  </div>
                </div>

                <div className={styles["feature-card"]}>
                  <div className={styles["feature-card-icon"]}>
                    <Users className={styles["feature-card-icon-svg"]} />
                  </div>
                  <h3 className={styles["feature-card-title"]}>
                    Multi-User Access
                  </h3>
                  <p className={styles["feature-card-description"]}>
                    Create accounts for your entire practice with role-based
                    permissions and collaborative features.
                  </p>
                  <div className={styles["feature-card-footer"]}>
                    <span className={styles["feature-tag"]}>Enterprise</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className={styles["demo-section"]}>
        <div className={styles["container"]}>
          <div className={styles["section-header"]}>
            <div className={styles["section-badge"]}>Interactive Demo</div>
            <h2 className={styles["section-title"]}>
              Experience <span className={styles["text-teal"]}>Emotion</span>{" "}
              <span className={styles["text-blue"]}>Detection</span>
            </h2>
            <p className={styles["section-description"]}>
              Try our emotion detection technology with this interactive demo
            </p>
          </div>

          <div className={styles["demo-container"]}>
            <div className={styles["demo-header"]}>
              <h3 className={styles["demo-title"]}>Voice Emotion Analyzer</h3>
              <p className={styles["demo-subtitle"]}>
                Speak into the microphone to detect your current emotional state
              </p>
            </div>

            <div className={styles["demo-content"]}>
              <div className={styles["recorder-container"]}>
                <div className={styles["recorder-instructions"]}>
                  <h4 className={styles["recorder-title"]}>Record Your Voice</h4>
                  <p className={styles["recorder-description"]}>
                    Click the button below and speak a few sentences
                  </p>
                </div>

                <div className={styles["recorder-controls"]}>
                  <button
                    onClick={handleRecording}
                    disabled={status === "Processing..."}
                    className={styles["record-button"]}
                    aria-label={
                      isRecording ? "Stop recording" : "Start voice recording"
                    }
                  >
                    <Mic
                      className={`${styles["record-icon"]} ${
                        isRecording ? styles["pulse"] : ""
                      }`}
                    />
                    {!isRecording && !result && (
                      <span className={styles["record-pulse"]}></span>
                    )}
                  </button>
                  <p className={styles["record-status"]}>{status}</p>

                  {isRecording && (
                    <div className={styles["recording-indicator"]}>
                      <span className={styles["recording-dot"]}></span>
                      <span className={styles["recording-text"]}>
                        Recording in progress...
                      </span>
                    </div>
                  )}
                </div>

                {emotionHistory.length > 0 && (
                  <div className={styles["emotion-history"]}>
                    <h4 className={styles["emotion-history-title"]}>
                      Recent Analysis
                    </h4>
                    <div className={styles["emotion-history-items"]}>
                      {emotionHistory.map((item, index) => (
                        <div
                          key={index}
                          className={styles["emotion-history-item"]}
                        >
                          <div
                            className={`${styles["emotion-history-badge"]} ${
                              styles[`emotion-${item.emotion.toLowerCase()}`]
                            }`}
                          >
                            {item.emotion}
                          </div>
                          <div className={styles["emotion-history-confidence"]}>
                            {item.confidence}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`${styles["results-container"]} ${
                  !isRecording && result
                    ? styles[`emotion-${result.emotion.toLowerCase()}`]
                    : ""
                }`}
              >
                <div className={styles["results-content"]}>
                  <h4 className={styles["results-title"]}>Analysis Results</h4>

                  {!isRecording && !result && (
                    <div className={styles["results-empty"]}>
                      <p>No results yet. Record your voice to see analysis.</p>
                      <div className={styles["results-empty-icon"]}>
                        <Mic className={styles["empty-icon"]} />
                      </div>
                      <p className={styles["results-empty-hint"]}>
                        Try saying something like "I'm feeling great today" or
                        "I've been having a difficult week"
                      </p>
                    </div>
                  )}

                  {isRecording && (
                    <div className={styles["results-listening"]}>
                      <div className={styles["listening-icon"]}>
                        <Mic className={styles["listening-mic"]} />
                      </div>
                      <p className={styles["listening-text"]}>Listening...</p>
                    </div>
                  )}

                  {status === "Processing..." && (
                    <div className={styles["results-processing"]}>
                      <div className={styles["processing-overlay"]}>
                        <div className={styles["processing-content"]}>
                          <div className={styles["processing-spinner"]}></div>
                          <p className={styles["processing-text"]}>
                            Analyzing voice patterns...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isRecording && result && (
                    <div className={styles["results-data"]}>
                      <div className={styles["emotion-result"]}>
                        <div className={styles["emotion-icon"]}>
                          {result.emotion === "Calm" && (
                            <Smile className={styles["emotion-icon-svg"]} />
                          )}
                          {result.emotion === "Happy" && (
                            <Smile className={styles["emotion-icon-svg"]} />
                          )}
                          {result.emotion === "Anxious" && (
                            <Activity className={styles["emotion-icon-svg"]} />
                          )}
                        </div>
                        <h5 className={styles["emotion-name"]}>
                          {result.emotion}
                        </h5>
                        <p className={styles["emotion-confidence"]}>
                          Detected with {result.confidence}% confidence
                        </p>
                      </div>

                      <div className={styles["emotion-distribution"]}>
                        {result.distribution.map((item, index) => (
                          <div key={index} className={styles["emotion-bar"]}>
                            <div className={styles["emotion-bar-header"]}>
                              <span className={styles["emotion-bar-label"]}>
                                {item.name}
                              </span>
                              <span className={styles["emotion-bar-value"]}>
                                {item.value}%
                              </span>
                            </div>
                            <div className={styles["emotion-bar-container"]}>
                              <div
                                className={`${styles["emotion-bar-fill"]} ${
                                  item.name.toLowerCase() ===
                                  result.emotion.toLowerCase()
                                    ? styles["primary"]
                                    : styles["secondary"]
                                }`}
                                style={{ width: `${item.value}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className={styles["emotion-insights"]}>
                        <h5 className={styles["insights-title"]}>
                          Clinical Insights
                        </h5>
                        <div className={styles["insights-content"]}>
                          {result.emotion === "Calm" && (
                            <p>
                              Patient exhibits a balanced emotional state,
                              suggesting effective coping mechanisms and
                              emotional regulation.
                            </p>
                          )}
                          {result.emotion === "Happy" && (
                            <p>
                              Positive emotional indicators suggest improved mood
                              and potential progress in treatment outcomes.
                            </p>
                          )}
                          {result.emotion === "Anxious" && (
                            <p>
                              Elevated stress markers detected. Consider exploring
                              recent stressors and reviewing anxiety management
                              techniques.
                            </p>
                          )}
                        </div>
                        <div className={styles["insights-actions"]}>
                          <button
                            className={styles["insights-action-btn"]}
                            onClick={() => alert("Exporting report...")}
                          >
                            <Download
                              className={styles["insights-action-icon"]}
                            />{" "}
                            Export Report
                          </button>
                          <button
                            className={styles["insights-action-btn"]}
                            onClick={() => alert("Saving to patient record...")}
                          >
                            <Shield className={styles["insights-action-icon"]} />{" "}
                            Save to Patient Record
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className={styles["process-section"]}>
        <div className={styles["container"]}>
          <div className={styles["section-header"]}>
            <div className={styles["section-badge"]}>Our Process</div>
            <h2 className={styles["section-title"]}>
              How <span className={styles["text-teal"]}>It Works</span>
            </h2>
            <p className={styles["section-description"]}>
              Our sophisticated emotion detection process happens in four key
              steps
            </p>
          </div>

          <div className={styles["process-steps"]}>
            {steps.map((step) => (
              <ProcessStep key={step.number} {...step} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles["cta-section"]}>
        <div className={styles["container"]}>
          <div className={styles["cta-content"]}>
            <h2 className={styles["cta-title"]}>
              Ready to Transform Your Practice?
            </h2>
            <p className={styles["cta-description"]}>
              Join thousands of mental health professionals who are using Vaidya
              Vani to gain deeper insights into their patients' emotional states.
            </p>
            <div className={styles["cta-buttons"]}>
              <button
                className={styles["btn btn-white"]}
                onClick={handleSignUp}
              >
                Sign Up Free
              </button>
              <button
                className={styles["btn btn-outline-white"]}
                onClick={handleSignUp}
              >
                Schedule a Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles["footer"]}>
        <div className={styles["container"]}>
          <div className={styles["footer-grid"]}>
            <div className={styles["footer-brand"]}>
              <h3 className={styles["footer-logo"]}>Vaidya Vani</h3>
              <p className={styles["footer-tagline"]}>
                The next generation of emotion detection technology for mental
                health professionals.
              </p>
              <div className={styles["footer-social"]}>
                <button className={styles["social-icon"]}>
                  <Facebook />
                </button>
                <button className={styles["social-icon"]}>
                  <Twitter />
                </button>
                <button className={styles["social-icon"]}>
                  <Instagram />
                </button>
              </div>
            </div>

            <div className={styles["footer-links"]}>
              <h3 className={styles["footer-heading"]}>Quick Links</h3>
              <ul className={styles["footer-nav"]}>
                <li>
                  <a href="/" className={styles["footer-link"]}>
                    Home
                  </a>
                </li>
                <li>
                  <a href="/about" className={styles["footer-link"]}>
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#features" className={styles["footer-link"]}>
                    Features
                  </a>
                </li>
                <li>
                  <a href="#demo" className={styles["footer-link"]}>
                    Demo
                  </a>
                </li>
                <li>
                  <a href="#process" className={styles["footer-link"]}>
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="/contact" className={styles["footer-link"]}>
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div className={styles["footer-links"]}>
              <h3 className={styles["footer-heading"]}>Contact</h3>
              <ul className={styles["contact-list"]}>
                <li className={styles["contact-item"]}>
                  <MapPin className={styles["contact-icon"]} />
                  <span>Erragada</span>
                </li>
                <li className={styles["contact-item"]}>
                  <Mail className={styles["contact-icon"]} />
                  <span>erragada@gmail.com</span>
                </li>
                <li className={styles["contact-item"]}>
                  <Phone className={styles["contact-icon"]} />
                  <span>+91 9573996891</span>
                </li>
              </ul>
            </div>

            <div className={styles["footer-contact"]}></div>
          </div>

          <div className={styles["footer-bottom"]}>
            <p className={styles["copyright"]}>
              © {new Date().getFullYear()} Vaidya Vani. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CarouselPage;