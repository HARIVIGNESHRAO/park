import React, { useState, useEffect } from 'react';
import { History, LogOut, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './dashboard.css';
import Home from "../home/home";
import User from "../user/user";
import ProfilePage from "../Profile/ProfilePage";

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [username] = useState(Cookies.get('username') || 'Guest');
  const [activeView, setActiveView] = useState('home'); // Default to 'home'
  const [avatar, setAvatar] = useState(null); // State for avatar
  const navigate = useNavigate();

  // Fetch avatar from localStorage on mount
  useEffect(() => {
    const storedAvatar = localStorage.getItem('userAvatar');
    setAvatar(storedAvatar);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleLogout = async () => {
    try {
      await axios.post('https://salaar1-production.up.railway.app/logout', {}, { withCredentials: true });
      Cookies.remove('username');
      localStorage.removeItem('userAvatar'); // Optional: Clear avatar on logout
      navigate('/login');
    } catch (error) {
      Cookies.remove('username');
      localStorage.removeItem('userAvatar'); // Optional: Clear avatar on logout
      navigate('/login');
    }
  };

  const profileInitial = username.charAt(0).toUpperCase();

  // Handle navigation clicks
  const handleNavClick = (view) => {
    setActiveView(view);
  };

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
                <History size={20} />
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
                <History size={20} /> {/* Consider replacing with a profile icon */}
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
        {activeView === 'notifications' && <p>Notifications (Coming Soon)</p>}
        {activeView === 'profile' && <ProfilePage />}
      </div>
    </div>
  );
};

export default Dashboard;
