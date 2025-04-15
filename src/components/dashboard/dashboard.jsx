import React, { useState, useEffect } from 'react';
import { History, LogOut, ChevronLeft, ChevronRight, Bell, UserCircle, LayoutDashboard } from 'lucide-react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './dashboard.css';
import Home from "../home/home";
import User from "../user/user";
import ProfilePage from "../Profile/ProfilePage";
import NotificationComponent from "../notifications/notification";

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [username] = useState(Cookies.get('username') || null); // Set to null if no username
  const [activeView, setActiveView] = useState('home'); // Default to 'home'
  const [avatar, setAvatar] = useState(null); // State for avatar
  const navigate = useNavigate();

  // Check if user is logged in and fetch avatar
  useEffect(() => {
    if (!username) {
    } else {
      // Fetch avatar from localStorage if logged in
      const storedAvatar = localStorage.getItem('userAvatar');
      setAvatar(storedAvatar);
    }
  }, [username, navigate]);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5001/logout', {}, { withCredentials: true });
      Cookies.remove('username');
      localStorage.removeItem('userAvatar'); // Optional: Clear avatar on logout
      navigate('/login');
    } catch (error) {
      Cookies.remove('username');
      localStorage.removeItem('userAvatar'); // Optional: Clear avatar on logout
      navigate('/login');
    }
  };

  const profileInitial = username?.charAt(0).toUpperCase() || '';

  // Handle navigation clicks
  const handleNavClick = (view) => {
    setActiveView(view);
  };

  // Display login message if not logged in
  if (!username) {
    return (
      <div className="profile-section">
        <h1>Access Denied</h1><br/>
        <p>Please login to access this page.</p>
        <a href="/login">Login</a>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <button onClick={toggleSidebar} className="sidebar-toggle">
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <div className="profile-section">
          <div className="profile-image">
            {avatar ? (
              <img src={avatar} alt="User Avatar" className="avatar-image" />
            ) : (
              <div className="profile-initial">{profileInitial}</div>
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="profile-info">
              <h3>{username}</h3>
              <p>User</p>
            </div>
          )}
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <a
                onClick={() => handleNavClick('home')}
                className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
              >
                <LayoutDashboard size={20} />
                {!sidebarCollapsed && <span>Dashboard</span>}
              </a>
            </li>
            <li>
              <a
                onClick={() => handleNavClick('user')}
                className={`nav-item ${activeView === 'user' ? 'active' : ''}`}
              >
                <History size={20} />
                {!sidebarCollapsed && <span>User History</span>}
              </a>
            </li>
            <li>
              <a
                onClick={() => handleNavClick('notifications')}
                className={`nav-item ${activeView === 'notifications' ? 'active' : ''}`}
              >
                <Bell size={20} />
                {!sidebarCollapsed && <span>Notifications</span>}
              </a>
            </li>
            <li>
              <a
                onClick={() => handleNavClick('profile')}
                className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
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
        {activeView === 'home' && <Home />}
        {activeView === 'user' && <User />}
        {activeView === 'notifications' && <NotificationComponent />}
        {activeView === 'profile' && <ProfilePage />}
      </div>
    </div>
  );
};

export default Dashboard;
