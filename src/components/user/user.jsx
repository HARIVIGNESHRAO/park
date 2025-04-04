import React, { useEffect, useState, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './user.css';

const User = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTranscriptions, setExpandedTranscriptions] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedTag, setSelectedTag] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 5;
  const searchInputRef = useRef(null);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/users/username', {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const result = await response.json();
      if (result.success) {
        setUserData(result.data);
      } else {
        setError(result.message || 'Failed to fetch user data');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'An error occurred while fetching user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleDelete = async (analysisId) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `http://localhost:5001/users/${userData.username}/analyses/${analysisId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete analysis: ${errorText}`);
      }
      const result = await response.json();
      if (result.success) {
        setUserData({
          ...userData,
          analyses: userData.analyses.filter((a) => a._id !== analysisId),
        });
        toast.success('Analysis deleted successfully');
      } else {
        setError(result.message || 'Failed to delete analysis');
        toast.error('Failed to delete analysis');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'An error occurred while deleting analysis');
      toast.error('Error deleting analysis');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    toast.success('ID copied to clipboard');
  };

  const toggleTranscription = (analysisId) => {
    setExpandedTranscriptions((prev) => ({
      ...prev,
      [analysisId]: !prev[analysisId],
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchInputRef.current) {
      searchInputRef.current.blur(); // Trigger search on Enter
    }
  };

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
          <button className="retry-btn" onClick={fetchUserData}>Retry</button>
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

  // Filter and sort analyses
  const filteredAnalyses = userData.analyses
    .filter((analysis) => {
      const query = searchQuery.toLowerCase().trim();
      return (
        (analysis.transcription.toLowerCase().includes(query) ||
         analysis._id.toString().toLowerCase().includes(query)) &&
        (selectedTag === 'All' || (analysis.tags && analysis.tags.includes(selectedTag)))
      );
    })
    .sort((a, b) =>
      sortOrder === 'newest'
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt)
    );

  // Pagination
  const totalPages = Math.ceil(filteredAnalyses.length / itemsPerPage);
  const paginatedAnalyses = filteredAnalyses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique tags for filter dropdown
  const allTags = ['All', ...new Set(userData.analyses.flatMap((a) => a.tags || []))];

  return (
    <div className="profile-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {/* User Header */}
      <div className="profile-header">
        <div className="avatar-wrapper">
          <div className="avatar">{userData.username.charAt(0).toUpperCase()}</div>
        </div>
        <div className="user-info">
          <h1 className="username">{userData.username}</h1>
          <p className="user-email">Email: {userData.email}</p>
          <p className="user-id">ID: {userData._id}</p>
        </div>
      </div>

      {/* Analyses Section */}
      <div className="analyses-section">
        <div className="section-header">
          <h2>Your Analyses</h2>
          <span className="count-badge">{filteredAnalyses.length}</span>
          <div className="section-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search by transcription or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="search-bar"
                ref={searchInputRef}
                tabIndex={0}
              />
              {searchQuery && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  tabIndex={0}
                >
                  ×
                </button>
              )}
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="sort-dropdown"
              tabIndex={0}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="tag-filter"
              tabIndex={0}
            >
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredAnalyses.length === 0 ? (
          <div className="empty-analyses">
            <p>No analyses available yet.</p>
            <button className="create-analysis-btn" tabIndex={0}>
              Create Your First Analysis
            </button>
          </div>
        ) : (
          <>
            <div className="analyses-list">
              {paginatedAnalyses.map((analysis) => {
                const isExpanded = expandedTranscriptions[analysis._id];
                const transcription = analysis.transcription;
                const isLong = transcription.length > 100;
                const displayText = isExpanded || !isLong
                  ? transcription
                  : `${transcription.substring(0, 100)}...`;

                return (
                  <div key={analysis._id} className="analysis-card">
                    <div className="card-header">
                      <div className="header-left">
                        <div className="id-wrapper">
                          <span className="analysis-id">ID: {analysis._id}</span>
                          <button
                            className="copy-btn"
                            onClick={() => handleCopyId(analysis._id)}
                            tabIndex={0}
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="header-right">
                        <span className="timestamp">
                          {new Date(analysis.createdAt).toLocaleString()}
                        </span>
                        {analysis.tags && (
                          <div className="tags-list">
                            {analysis.tags.map((tag) => (
                              <span key={tag} className="tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Transcription */}
                    <div className="transcription-section">
                      <h3>Transcription</h3>
                      <blockquote className="transcription-text">"{displayText}"</blockquote>
                      {isLong && (
                        <button
                          className="toggle-btn"
                          onClick={() => toggleTranscription(analysis._id)}
                          tabIndex={0}
                        >
                          {isExpanded ? 'Show Less' : 'Show More'}
                        </button>
                      )}
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

                    {/* Footer */}
                    <div className="card-footer">
                      <div className="date-time">
                        <button
                          className="remove-btn"
                          onClick={() => handleDelete(analysis._id)}
                          disabled={isDeleting}
                          tabIndex={0}
                        >
                          {isDeleting ? 'Deleting...' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                  tabIndex={0}
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                  tabIndex={0}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default User;
