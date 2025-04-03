import React, { useEffect, useState } from 'react';
import './user.css';

const User = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:5001/users/username', {
          credentials: 'include', // Include cookies in the request
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setUserData(result.data);
        } else {
          setError(result.message || 'Failed to fetch user data');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="container loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          <i className="error-icon">!</i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container empty-state">
        <div className="empty-state-content">
          <i className="login-icon">🔑</i>
          <p>No user data available. Please log in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* User Header */}
      <div className="profile-header">
        <div className="avatar-wrapper">
          <div className="avatar">{userData.username.charAt(0).toUpperCase()}</div>
        </div>
        <div className="user-info">
          <h1 className="username">{userData.username}</h1>
          <p className="user-email">Email: {userData.email}</p> {/* Added email display */}
          <p className="user-id">ID: {userData._id}</p>
        </div>
      </div>

      {/* Analyses Section */}
      <div className="analyses-section">
        <div className="section-header">
          <h2>Your Analyses</h2>
          <span className="count-badge">{userData.analyses.length}</span>
        </div>

        {userData.analyses.length === 0 ? (
          <div className="empty-analyses">
            <p>No analyses available yet.</p>
            <button className="create-analysis-btn">Create Your First Analysis</button>
          </div>
        ) : (
          <div className="analyses-list">
            {userData.analyses.map((analysis) => (
              <div key={analysis._id} className="analysis-card">
                <div className="card-header">
                  <span className="date">{new Date(analysis.createdAt).toLocaleDateString()}</span>
                  <span className="time">{new Date(analysis.createdAt).toLocaleTimeString()}</span>
                </div>

                {/* Transcription */}
                <div className="transcription-section">
                  <h3>Transcription</h3>
                  <blockquote className="transcription-text">"{analysis.transcription}"</blockquote>
                </div>

                <div className="analysis-details">
                  {/* Emotions */}
                  <div className="emotions-section">
                    <h4>Emotions Detected</h4>
                    <div className="emotions-list">
                      {analysis.analysis.Emotions.map((emotion) => (
                        <span key={emotion} className="emotion-tag">{emotion}</span>
                      ))}
                    </div>
                  </div>

                  {/* Reasons */}
                  <div className="reasons-section">
                    <h4>Analysis</h4>
                    <p>{analysis.analysis.Reasons}</p>
                  </div>
                  {/* Suggestions */}
                  <div className="suggestions-section">
                    <h4>Suggestions</h4>
                    <ul className="suggestions-list">
                      {analysis.analysis.Suggestions.map((suggestion, index) => (
                        <li key={index} className="suggestion-item">
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default User;