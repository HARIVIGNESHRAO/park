import React, { useState } from 'react';
import { User, History, LogOut, ChevronLeft, ChevronRight, Settings, Bell } from 'lucide-react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './dashboard.css';
import Home from "../home/home";

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [username] = useState(Cookies.get('username') || 'John Doe'); // Get username once
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5001/logout', {}, { withCredentials: true });
      Cookies.remove('username');
      navigate('/login');
    } catch (error) {
      Cookies.remove('username');
      navigate('/login');
    }
  };

  // Get the first letter of the username
  const profileInitial = username.charAt(0).toUpperCase();

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <button onClick={toggleSidebar} className="sidebar-toggle">
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <div className="profile-section">
          <div className="profile-image">
            {/* Replace img with a div showing the initial */}
            <div className="profile-initial">{profileInitial}</div>
          </div>
          {!sidebarCollapsed && (
            <div className="profile-info">
              <h3>{username}</h3>
              <p>Administrator</p>
            </div>
          )}
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <a href="#main" className="nav-item">
                {!sidebarCollapsed && <span>Dashboard</span>}
              </a>
            </li>
            <li>
              <a href="#" className="nav-item">
                <History size={20} />
                {!sidebarCollapsed && <span>User History</span>}
              </a>
            </li>
            <li>
              <a href="#" className="nav-item">
                <Bell size={20} />
                {!sidebarCollapsed && <span>Notifications</span>}
              </a>
            </li>
            <li>
              <a href="#" className="nav-item">
                <Settings size={20} />
                {!sidebarCollapsed && <span>Settings</span>}
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
      <div className="main-content" id="main">
        <header className="content-header">
          <h1>Dashboard</h1>
        </header>
        <main className="content-body">
          <Home />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;