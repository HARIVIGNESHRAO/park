import React, { useEffect, useState, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './user.css';
import jsPDF from 'jspdf'; // Import jsPDF

const User = () => {
  const [userData, setUserData] = useState(null);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
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
      const userResponse = await fetch('http://localhost:5001/users/username', {
        credentials: 'include',
      });
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        throw new Error(`User data fetch failed: HTTP ${userResponse.status}, ${errorText}`);
      }
      const userResult = await userResponse.json();
      if (!userResult.success) {
        throw new Error(userResult.message || 'Failed to fetch user data');
      }

      try {
        const latestResponse = await fetch('http://localhost:5001/api/session/latest_analysis', {
          credentials: 'include',
        });
        if (!latestResponse.ok) {
          console.warn(`Latest analysis fetch failed: HTTP ${latestResponse.status}`);
          setLatestAnalysis(null);
        } else {
          const latestResult = await latestResponse.json();
          console.log('Latest analysis response:', latestResult);
          if (latestResult.analysis) {
            setLatestAnalysis({
              _id: latestResult.analysis._id || 'latest',
              combined_analysis: latestResult.analysis.combined_analysis,
              createdAt: latestResult.analysis.createdAt,
              transcription: latestResult.analysis.transcription || '',
              tags: latestResult.analysis.tags || [],
            });
          } else {
            console.warn('No valid latest analysis data found');
            setLatestAnalysis(null);
          }
        }
      } catch (latestErr) {
        console.error('Latest analysis fetch error:', latestErr);
        setLatestAnalysis(null);
      }

      setUserData(userResult.data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'An error occurred while fetching user data');
      toast.error('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleDelete = async (analysisId, isLatest = false) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;
    setIsDeleting(true);
    try {
      const url = isLatest
        ? 'http://localhost:5001/users/username/latest_analysis'
        : `http://localhost:5001/users/${userData.username}/analyses/${analysisId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete analysis: ${errorText}`);
      }
      const result = await response.json();
      if (result.success) {
        if (isLatest) {
          setLatestAnalysis(null);
        } else {
          setUserData({
            ...userData,
            analyses: userData.analyses.filter((a) => a._id !== analysisId),
          });
        }
        toast.success('Analysis deleted successfully');
      } else {
        throw new Error(result.message || 'Failed to delete analysis');
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

  const handleDownload = (analysis, isLatest = false) => {
    const formattedText = isLatest
      ? `Analysis Report
=================
ID: ${analysis._id}
Timestamp: ${new Date(analysis.createdAt).toLocaleString()}
Transcription: ${analysis.transcription || 'No transcription available'}
Combined Analysis: ${analysis.combined_analysis || 'No analysis provided'}
Tags: ${analysis.tags && analysis.tags.length > 0 ? analysis.tags.join(', ') : 'None'}
=================`
      : `Analysis Report
=================
ID: ${analysis._id}
Timestamp: ${new Date(analysis.createdAt).toLocaleString()}
Transcription: ${analysis.transcription || 'No transcription available'}
Emotions Detected: ${analysis.analysis.Emotions && analysis.analysis.Emotions.length > 0 ? analysis.analysis.Emotions.join(', ') : 'None'}
Reasons: ${analysis.analysis.Reasons || 'No reasons provided'}
Suggestions:
${analysis.analysis.Suggestions && analysis.analysis.Suggestions.length > 0 ? analysis.analysis.Suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n') : 'None'}
Tags: ${analysis.tags && analysis.tags.length > 0 ? analysis.tags.join(', ') : 'None'}
=================`;

    const blob = new Blob([formattedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis_${analysis._id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Analysis downloaded successfully');
  };

  const handleDownloadAllAsPDF = () => {
    const doc = new jsPDF();
    let yOffset = 10;

    // Add user info at the top
    doc.setFontSize(16);
    doc.text('User Analysis Report', 10, yOffset);
    yOffset += 10;
    doc.setFontSize(12);
    doc.text(`Username: ${userData.username}`, 10, yOffset);
    yOffset += 10;
    doc.text(`Email: ${userData.email}`, 10, yOffset);
    yOffset += 10;
    doc.text(`User ID: ${userData._id}`, 10, yOffset);
    yOffset += 10;
    doc.text('====================================', 10, yOffset);
    yOffset += 10;

    // Add latest analysis if available and matches filters
    if (isLatestAnalysisVisible && latestAnalysis) {
      doc.setFontSize(14);
      doc.text('Latest Analysis', 10, yOffset);
      yOffset += 10;
      doc.setFontSize(12);
      doc.text(`ID: ${latestAnalysis._id}`, 10, yOffset);
      yOffset += 7;
      doc.text(`Timestamp: ${new Date(latestAnalysis.createdAt).toLocaleString()}`, 10, yOffset);
      yOffset += 7;
      doc.text(`Transcription: ${latestAnalysis.transcription || 'No transcription available'}`, 10, yOffset, { maxWidth: 190 });
      yOffset += doc.getTextDimensions(latestAnalysis.transcription || 'No transcription available', { maxWidth: 190 }).h + 5;
      doc.text(`Combined Analysis: ${latestAnalysis.combined_analysis || 'No analysis provided'}`, 10, yOffset, { maxWidth: 190 });
      yOffset += doc.getTextDimensions(latestAnalysis.combined_analysis || 'No analysis provided', { maxWidth: 190 }).h + 5;
      doc.text(`Tags: ${latestAnalysis.tags && latestAnalysis.tags.length > 0 ? latestAnalysis.tags.join(', ') : 'None'}`, 10, yOffset);
      yOffset += 10;
      doc.text('====================================', 10, yOffset);
      yOffset += 10;
    }

    // Add historical analyses
    doc.setFontSize(14);
    doc.text('Historical Analyses', 10, yOffset);
    yOffset += 10;

    filteredAnalyses.forEach((analysis, index) => {
      if (yOffset > 270) {
        doc.addPage();
        yOffset = 10;
      }
      doc.setFontSize(12);
      doc.text(`Analysis ${index + 1}`, 10, yOffset);
      yOffset += 7;
      doc.text(`ID: ${analysis._id}`, 10, yOffset);
      yOffset += 7;
      doc.text(`Timestamp: ${new Date(analysis.createdAt).toLocaleString()}`, 10, yOffset);
      yOffset += 7;
      doc.text(`Transcription: ${analysis.transcription || 'No transcription available'}`, 10, yOffset, { maxWidth: 190 });
      yOffset += doc.getTextDimensions(analysis.transcription || 'No transcription available', { maxWidth: 190 }).h + 5;
      doc.text(`Emotions Detected: ${analysis.analysis.Emotions && analysis.analysis.Emotions.length > 0 ? analysis.analysis.Emotions.join(', ') : 'None'}`, 10, yOffset, { maxWidth: 190 });
      yOffset += doc.getTextDimensions(analysis.analysis.Emotions && analysis.analysis.Emotions.length > 0 ? analysis.analysis.Emotions.join(', ') : 'None', { maxWidth: 190 }).h + 5;
      doc.text(`Reasons: ${analysis.analysis.Reasons || 'No reasons provided'}`, 10, yOffset, { maxWidth: 190 });
      yOffset += doc.getTextDimensions(analysis.analysis.Reasons || 'No reasons provided', { maxWidth: 190 }).h + 5;
      doc.text('Suggestions:', 10, yOffset);
      yOffset += 7;
      analysis.analysis.Suggestions && analysis.analysis.Suggestions.length > 0
        ? analysis.analysis.Suggestions.forEach((suggestion, i) => {
            doc.text(`${i + 1}. ${suggestion}`, 15, yOffset, { maxWidth: 185 });
            yOffset += doc.getTextDimensions(`${i + 1}. ${suggestion}`, { maxWidth: 185 }).h + 3;
          })
        : doc.text('None', 15, yOffset);
      yOffset += analysis.analysis.Suggestions && analysis.analysis.Suggestions.length > 0 ? 5 : 7;
      doc.text(`Tags: ${analysis.tags && analysis.tags.length > 0 ? analysis.tags.join(', ') : 'None'}`, 10, yOffset);
      yOffset += 10;
      doc.text('====================================', 10, yOffset);
      yOffset += 10;
    });

    // Save the PDF
    doc.save(`all_analyses_${userData.username}.pdf`);
    toast.success('All analyses downloaded as PDF successfully');
  };

  const toggleTranscription = (analysisId) => {
    setExpandedTranscriptions((prev) => ({
      ...prev,
      [analysisId]: !prev[analysisId],
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchInputRef.current) {
      searchInputRef.current.blur();
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

  const filteredAnalyses = userData.analyses
    .filter((analysis) => {
      const query = searchQuery.toLowerCase().trim();
      const transcription = analysis.transcription || '';
      return (
        (transcription.toLowerCase().includes(query) ||
         analysis._id.toString().toLowerCase().includes(query)) &&
        (selectedTag === 'All' || (analysis.tags && analysis.tags.includes(selectedTag)))
      );
    })
    .sort((a, b) =>
      sortOrder === 'newest'
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt)
    );

  const totalPages = Math.ceil(filteredAnalyses.length / itemsPerPage);
  const paginatedAnalyses = filteredAnalyses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const allTags = ['All', ...new Set(userData.analyses.flatMap((a) => a.tags || []))];

  const isLatestAnalysisVisible = latestAnalysis
    ? (() => {
        const query = searchQuery.toLowerCase().trim();
        const transcription = latestAnalysis.transcription || '';
        return (
          (transcription.toLowerCase().includes(query) ||
           latestAnalysis._id.toString().toLowerCase().includes(query)) &&
          (selectedTag === 'All' || (latestAnalysis.tags && latestAnalysis.tags.includes(selectedTag)))
        );
      })()
    : false;

  return (
    <div className="profile-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <div className="profile-header">
        <div className="avatar-wrapper">
          <div className="avatar">{userData.username.charAt(0).toUpperCase()}</div>
        </div>
        <div className="user-info">
          <h1 className="username">{userData.username}</h1>
          <p className="user-email">Email: {userData.email}</p>
          <p className="user-id">ID: {userData._id}</p>
        </div>
        <button
          className="download-all-btn"
          onClick={handleDownloadAllAsPDF}
          disabled={filteredAnalyses.length === 0 && !isLatestAnalysisVisible}
          tabIndex={0}
        >
          Download All as PDF
        </button>
      </div>

      <div className="analyses-section">
        <div className="section-header">
          <h2>Your Latest Analysis</h2>
          {isLatestAnalysisVisible && latestAnalysis && (
            <span className="count-badge">1</span>
          )}
        </div>
        {isLatestAnalysisVisible && latestAnalysis ? (
          <div className="analysis-card">
            <div className="card-header">
              <div className="header-left">
                <div className="id-wrapper">
                  <button
                    className="copy-btn"
                    onClick={() => handleCopyId(latestAnalysis._id)}
                    tabIndex={0}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="header-right">
                <span className="timestamp">
                  {new Date(latestAnalysis.createdAt).toLocaleString()}
                </span>
                {latestAnalysis.tags && latestAnalysis.tags.length > 0 && (
                  <div className="tags-list">
                    {latestAnalysis.tags.map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="analysis-details">
              <div className="combined-analysis-section">
                <h4>Combined Analysis</h4>
                <p>{latestAnalysis.combined_analysis || 'No analysis provided'}</p>
              </div>
            </div>
            <div className="card-footer">
              <div className="date-time">
                <button
                  className="remove-btn"
                  onClick={() => handleDelete(latestAnalysis._id, true)}
                  disabled={isDeleting}
                  tabIndex={0}
                >
                  {isDeleting ? 'Deleting...' : 'Remove'}
                </button>
                <button
                  className="download-btn"
                  onClick={() => handleDownload(latestAnalysis, true)}
                  tabIndex={0}
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-analyses">
            <p>No latest analysis matches the current filters.</p>
          </div>
        )}
      </div>

      <div className="analyses-section">
        <div className="section-header">
          <h2>Your Historical Analyses</h2>
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
            <p>No historical analyses available yet.</p>
            <button className="create-analysis-btn" tabIndex={0}>
              Create Your First Analysis
            </button>
          </div>
        ) : (
          <>
            <div className="analyses-list">
              {paginatedAnalyses.map((analysis) => {
                const transcription = analysis.transcription || 'No transcription available';
                const isExpanded = expandedTranscriptions[analysis._id];
                const isLong = transcription.length > 100;
                const displayText = isExpanded || !isLong
                  ? transcription
                  : `${transcription.substring(0, 100)}...`;

                return (
                  <div key={analysis._id} className="analysis-card">
                    <div className="card-header">
                      <div className="header-left">
                        <div className="id-wrapper">
                          <span className="analysis-id">ID: ${analysis._id}</span>
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
                      <div className="emotions-section">
                        <h4>Emotions Detected</h4>
                        <div className="emotions-list">
                          {analysis.analysis.Emotions.map((emotion) => (
                            <span key={emotion} className="emotion-tag">{emotion}</span>
                          ))}
                        </div>
                      </div>

                      <div className="reasons-section">
                        <h4>Analysis</h4>
                        <p>{analysis.analysis.Reasons}</p>
                      </div>

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
                        <button
                          className="download-btn"
                          onClick={() => handleDownload(analysis)}
                          tabIndex={0}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="pagination1">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination1-btn"
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
                  className="pagination1-btn"
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
