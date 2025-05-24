"use client"

import { useState, useEffect } from "react"
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  UserCircle,
  LayoutDashboard,
  Download,
  BookOpen,
  Calendar,
  Moon,
  Droplets,
  Target,
} from "lucide-react"
import Cookies from "js-cookie"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "./dashboard.css"
import User from "../user/user"
import ProfilePage from "../Profile/ProfilePage"
import NotificationComponent from "../notifications/notification"

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [username] = useState(Cookies.get("username") || null)
  const [activeView, setActiveView] = useState("home")
  const [avatar, setAvatar] = useState(null)
  const [journalEntry, setJournalEntry] = useState("")
  const [breathingActive, setBreathingActive] = useState(false)
  const [breathingTime, setBreathingTime] = useState(60)
  const [welcomeVisible, setWelcomeVisible] = useState(true)
  const navigate = useNavigate()
  const username1 = Cookies.get("username") || "User"
  const [selectedMood, setSelectedMood] = useState("")
  const [sleepHours, setSleepHours] = useState(7)
  const [waterGlasses, setWaterGlasses] = useState(3)
  const [mindfulMinutes, setMindfulMinutes] = useState(0)
  const [previousEntries, setPreviousEntries] = useState([])

  const wellnessTips = [
    "Take short breaks throughout your day to stretch, breathe deeply, and reset your mind.",
    "Practice the 4-7-8 breathing technique: inhale for 4 seconds, hold for 7, exhale for 8.",
    "Spend at least 20 minutes outside each day, even if it's just sitting in your backyard or on a balcony.",
    "Keep a gratitude journal and write down three things you're thankful for each day.",
    "Limit screen time before bed to improve sleep quality. Try reading a book instead.",
    "Stay hydrated by drinking at least 8 glasses of water throughout the day.",
    "Practice mindful eating by savoring each bite and avoiding distractions during meals.",
    "Schedule short 5-minute meditation sessions throughout your day to reduce stress.",
    "Move your body for at least 30 minutes each day, even if it's just a gentle walk.",
    "Connect with a friend or family member each day, even if it's just a quick text or call.",
    "Create clear boundaries between work and personal time, especially if working from home.",
    "Declutter your physical space to help declutter your mind.",
    "Try the 5-4-3-2-1 grounding technique: acknowledge 5 things you see, 4 things you feel, 3 things you hear, 2 things you smell, and 1 thing you taste.",
    "Practice positive self-talk and challenge negative thoughts when they arise.",
    "Set realistic goals for yourself and celebrate small victories.",
    "Listen to music that boosts your mood or helps you relax, depending on what you need.",
    "Try a new hobby or activity that brings you joy and takes your mind off stressors.",
    "Limit caffeine intake, especially in the afternoon and evening.",
    "Create a calming bedtime routine to signal to your body it's time to wind down.",
    "Practice forgiveness, both for others and yourself. Let go of grudges that weigh you down.",
  ]

  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  const nextTip = () => {
    setCurrentTipIndex((prevIndex) => (prevIndex + 1) % wellnessTips.length)
  }

  const prevTip = () => {
    setCurrentTipIndex((prevIndex) => (prevIndex - 1 + wellnessTips.length) % wellnessTips.length)
  }

  useEffect(() => {
    if (!username) {
      navigate("/login")
    } else {
      const storedAvatar = localStorage.getItem("userAvatar")
      setAvatar(storedAvatar)
    }
  }, [username, navigate])

  useEffect(() => {
    const timer = setTimeout(() => {
      setWelcomeVisible(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let timer
    if (breathingActive && breathingTime > 0) {
      timer = setInterval(() => {
        setBreathingTime((prevTime) => prevTime - 1)
      }, 1000)
    } else if (breathingTime === 0) {
      setBreathingActive(false)
      setBreathingTime(60)
    }
    return () => clearInterval(timer)
  }, [breathingActive, breathingTime])

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * wellnessTips.length)
    setCurrentTipIndex(randomIndex)
  }, [])

  useEffect(() => {
    if (activeView === "journal" && username) {
      const fetchEntries = async () => {
        try {
          const response = await axios.get(`http://localhost:4200/api/journal/${username}`)
          setPreviousEntries(response.data)
        } catch (error) {
          console.error("Error fetching journal entries:", error)
        }
      }
      fetchEntries()
    }
  }, [activeView, username])

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed)

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5001/logout", {}, { withCredentials: true })
      Cookies.remove("username")
      localStorage.removeItem("userAvatar")
      navigate("/login")
    } catch (error) {
      Cookies.remove("username")
      localStorage.removeItem("userAvatar")
      navigate("/login")
    }
  }

  const profileInitial = username?.charAt(0).toUpperCase() || ""

  const handleNavClick = (view) => {
    setActiveView(view)
  }

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood)
  }

  const handleJournalChange = (e) => {
    setJournalEntry(e.target.value)
  }

  const handleJournalSubmit = async () => {
    if (!journalEntry || !selectedMood) {
      alert("Please write a journal entry and select a mood.")
      return
    }
    try {
      await axios.post("http://localhost:4200/api/journal", {
        username,
        content: journalEntry,
        mood: selectedMood,
      })
      alert("Journal entry saved!")
      setJournalEntry("")
      setSelectedMood("")
      const response = await axios.get(`http://localhost:4200/api/journal/${username}`)
      setPreviousEntries(response.data)
    } catch (error) {
      console.error("Error saving journal entry:", error)
      alert("Error saving journal entry.")
    }
  }

  const startBreathingExercise = () => {
    setBreathingActive(true)
  }

  const incrementWater = () => {
    setWaterGlasses((prev) => Math.min(prev + 1, 8))
  }

  const decrementWater = () => {
    setWaterGlasses((prev) => Math.max(prev - 1, 0))
  }

  const incrementSleep = () => {
    setSleepHours((prev) => Math.min(prev + 0.5, 12))
  }

  const decrementSleep = () => {
    setSleepHours((prev) => Math.max(prev - 0.5, 0))
  }

  const startMindfulness = () => {
    if (mindfulMinutes === 0) {
      const timer = setInterval(() => {
        setMindfulMinutes((prev) => prev + 1)
      }, 60000)
      localStorage.setItem("mindfulnessTimer", timer)
    }
  }

  const stopMindfulness = () => {
    const timer = localStorage.getItem("mindfulnessTimer")
    if (timer) {
      clearInterval(timer)
      localStorage.removeItem("mindfulnessTimer")
    }
  }

  const quotes = [
    {
      text: "You don't have to control your thoughts. You just have to stop letting them control you.",
      author: "Dan Millman",
    },
    {
      text: "Mental health is not a destination, but a process. It's about how you drive, not where you're going.",
      author: "Noam Shpancer",
    },
    {
      text: "Self-care is how you take your power back.",
      author: "Lalah Delia",
    },
    {
      text: "Recovery is not one and done. It is a lifelong journey that takes place one day, one step at a time.",
      author: "Unknown",
    },
    {
      text: "There is hope, even when your brain tells you there isn't.",
      author: "John Green",
    },
    {
      text: "You are not your illness. You have an individual story to tell. You have a name, a history, a personality. Staying yourself is part of the battle.",
      author: "Julian Seifter",
    },
    {
      text: "Happiness can be found even in the darkest of times, if one only remembers to turn on the light.",
      author: "Albus Dumbledore",
    },
    {
      text: "Just because no one else can heal or do your inner work for you doesn't mean you can, should, or need to do it alone.",
      author: "Lisa Olivera",
    },
  ]

  const [currentQuote, setCurrentQuote] = useState(quotes[0])

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length)
    setCurrentQuote(quotes[randomIndex])
  }, [])

  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date))
  }

  const today = formatDate(new Date())

  if (!username) {
    return (
      <div className="access-denied">
        <h1>Access Denied</h1>
        <p>Please login to access this page.</p>
        <a href="/login" className="login-link">
          Login
        </a>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <button onClick={toggleSidebar} className="sidebar-toggle">
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <div className="profile-section">
          <div className="profile-image">
            {avatar ? (
              <img src={avatar || "/placeholder.svg"} alt="User Avatar" className="avatar-image" />
            ) : (
              <div className="profile-initial">{profileInitial}</div>
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="profile-info">
              <h3>{username}</h3>
              <p>Wellness Journey</p>
            </div>
          )}
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <a onClick={() => handleNavClick("home")} className={`nav-item ${activeView === "home" ? "active" : ""}`}>
                <LayoutDashboard size={20} />
                {!sidebarCollapsed && <span>Dashboard</span>}
              </a>
            </li>
            <li>
              <a
                onClick={() => handleNavClick("journal")}
                className={`nav-item ${activeView === "journal" ? "active" : ""}`}
              >
                <BookOpen size={20} />
                {!sidebarCollapsed && <span>Journal</span>}
              </a>
            </li>
            <li>
              <a onClick={() => handleNavClick("user")} className={`nav-item ${activeView === "user" ? "active" : ""}`}>
                <Download size={20} />
                {!sidebarCollapsed && <span>Reports</span>}
              </a>
            </li>
            <li>
              <a
                onClick={() => handleNavClick("notifications")}
                className={`nav-item ${activeView === "notifications" ? "active" : ""}`}
              >
                <Bell size={20} />
                {!sidebarCollapsed && <span>Notifications</span>}
              </a>
            </li>
            <li>
              <a
                onClick={() => handleNavClick("profile")}
                className={`nav-item ${activeView === "profile" ? "active" : ""}`}
              >
                <UserCircle size={20} />
                {!sidebarCollapsed && <span>Profile</span>}
              </a>
            </li>
          </ul>
        </nav>
        <div className="logout-container">
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={20} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
      <div className="main-content">
        {activeView === "home" && (
          <div className="home-dashboard-content">
            <div className="date-display">
              <Calendar size={20} />
              <span>{today}</span>
            </div>
            {welcomeVisible && (
              <div className={`welcome-message ${!welcomeVisible ? "fade-out" : ""}`}>
                <h2>Welcome back, {username1}</h2>
                <p>How are you feeling today? Take a moment to check in with yourself.</p>
              </div>
            )}
            <div className="dashboard-grid">
              <div className="dashboard-card breathing-card">
                <h3>Breathing Exercise</h3>
                <p className="breathing-instructions">Take a moment to breathe deeply and center yourself.</p>
                <div className="breathing-circle">{breathingActive ? "Breathe" : "Start"}</div>
                {breathingActive ? (
                  <div className="breathing-timer">{breathingTime} seconds</div>
                ) : (
                  <button className="action-button" onClick={startBreathingExercise}>
                    Begin Exercise
                  </button>
                )}
              </div>
              <div className="dashboard-card quote-card">
                <h3>Today's Inspiration</h3>
                <div className="quote-content">
                  <p className="quote-text">{currentQuote.text}</p>
                  <p className="quote-author">— {currentQuote.author}</p>
                </div>
              </div>
              <div className="dashboard-card wellness-tips-card">
                <h3>Wellness Tips</h3>
                <div className="tip-content">
                  <div className="tip-icon">
                    <div className="tip-icon-inner"></div>
                  </div>
                  <p className="tip-text">{wellnessTips[currentTipIndex]}</p>
                </div>
                <div className="tip-actions">
                  <button className="tip-button" onClick={prevTip}>
                    Previous Tip
                  </button>
                  <button className="tip-button active" onClick={nextTip}>
                    Next Tip
                  </button>
                </div>
              </div>
              <div className="dashboard-card goals-card">
                <h3>
                  <Target size={20} /> Daily Goals
                </h3>
                <div className="goals-content">
                  <div className="goal-item">
                    <input type="checkbox" id="goal1" className="goal-checkbox" />
                    <label htmlFor="goal1" className="goal-label">
                      Meditate for 10 minutes
                    </label>
                  </div>
                  <div className="goal-item">
                    <input type="checkbox" id="goal2" className="goal-checkbox" />
                    <label htmlFor="goal2" className="goal-label">
                      Take a 15-minute walk
                    </label>
                  </div>
                  <div className="goal-item">
                    <input type="checkbox" id="goal3" className="goal-checkbox" />
                    <label htmlFor="goal3" className="goal-label">
                      Write in journal
                    </label>
                  </div>
                  <div className="goal-item">
                    <input type="checkbox" id="goal4" className="goal-checkbox" />
                    <label htmlFor="goal4" className="goal-label">
                      Practice gratitude
                    </label>
                  </div>
                </div>
                <button className="action-button small">Add New Goal</button>
              </div>
            </div>
          </div>
        )}
        {activeView === "journal" && (
          <div className="home-dashboard-content">
            <h2 className="page-title">Your Journal</h2>
            <div className="dashboard-card">
              <h3>New Entry</h3>
              <textarea
                placeholder="Write your thoughts for today..."
                className="journal-textarea large"
                value={journalEntry}
                onChange={handleJournalChange}
              ></textarea>
              <div className="mood-selector">
                <p>How are you feeling?</p>
                <div className="mood-options">
                  <button
                    className={`mood-button ${selectedMood === "great" ? "selected" : ""}`}
                    onClick={() => handleMoodSelect("great")}
                  >
                    Great
                  </button>
                  <button
                    className={`mood-button ${selectedMood === "good" ? "selected" : ""}`}
                    onClick={() => handleMoodSelect("good")}
                  >
                    Good
                  </button>
                  <button
                    className={`mood-button ${selectedMood === "okay" ? "selected" : ""}`}
                    onClick={() => handleMoodSelect("okay")}
                  >
                    Okay
                  </button>
                  <button
                    className={`mood-button ${selectedMood === "low" ? "selected" : ""}`}
                    onClick={() => handleMoodSelect("low")}
                  >
                    Low
                  </button>
                </div>
              </div>
              <button className="action-button" onClick={handleJournalSubmit}>
                Save Journal Entry
              </button>
            </div>
            <div className="dashboard-card" style={{ marginTop: "20px" }}>
              <h3>Previous Entries</h3>
              {previousEntries.length > 0 ? (
                previousEntries.map((entry) => (
                  <div key={entry._id} className="journal-entry-item">
                    <div className="journal-entry-header">
                      <p className="journal-date">{formatDate(entry.date)}</p>
                      <span className={`mood-tag ${entry.mood.toLowerCase()}`}>{entry.mood}</span>
                    </div>
                    <p className="journal-content">{entry.content}</p>
                  </div>
                ))
              ) : (
                <p>No previous entries found.</p>
              )}
            </div>
          </div>
        )}
        {activeView === "user" && <User />}
        {activeView === "notifications" && <NotificationComponent />}
        {activeView === "profile" && <ProfilePage />}
      </div>
    </div>
  )
}

export default Dashboard