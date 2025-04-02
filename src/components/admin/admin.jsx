import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './admin.css';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [minAnalyses, setMinAnalyses] = useState(0);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const itemsPerPage = 10;

  // Emotions indicating depression or suicidal tendencies
  const criticalEmotions = ['Sadness', 'Hopelessness', 'Despair'];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5001/users');
        setUsers(response.data.users || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch users: ' + err.message);
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const bulkDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)) {
      try {
        await Promise.all(
          selectedUsers.map(userId =>
            axios.delete(`http://localhost:5001/users/${userId}`)
          )
        );
        setUsers(users.filter(user => !selectedUsers.includes(user._id)));
        setSelectedUsers([]);
        alert('Selected users deleted successfully!');
      } catch (err) {
        alert('Failed to delete users: ' + (err.response?.data?.message || err.message));
      }
    }
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const exportSelectedToCSV = () => {
    if (selectedUsers.length === 0) return;
    const selectedData = users.filter(user => selectedUsers.includes(user._id));
    const headers = ['Username,Total Analyses,Last Analysis Date'];
    const rows = selectedData.map(user => [
      user.username,
      (user.analyses || []).length,
      (user.analyses || []).length > 0
        ? new Date(user.analyses[user.analyses.length - 1].createdAt).toLocaleString()
        : 'No analyses yet'
    ].join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'selected_users_data.csv';
    link.click();
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (selectedUsers.length > 0) {
      setContextMenu({
        visible: true,
        x: e.pageX,
        y: e.pageY
      });
    }
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const openModal = (analysis) => {
    setSelectedAnalysis(analysis);
  };

  const closeModal = () => {
    setSelectedAnalysis(null);
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await axios.delete(`http://localhost:5001/users/${userId}`);
        if (response.status === 200) {
          setUsers(users.filter(user => user._id !== userId));
          alert('User deleted successfully!');
        }
      } catch (err) {
        alert('Failed to delete user: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const sortUsers = (field) => {
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(order);
    const sorted = [...users].sort((a, b) => {
      if (field === 'username') {
        return order === 'asc'
          ? a.username.localeCompare(b.username)
          : b.username.localeCompare(a.username);
      }
      if (field === 'totalAnalyses') {
        return order === 'asc'
          ? (a.analyses?.length || 0) - (b.analyses?.length || 0)
          : (b.analyses?.length || 0) - (a.analyses?.length || 0);
      }
      if (field === 'lastAnalysisDate') {
        const aDate = (a.analyses?.length || 0) > 0 ? new Date(a.analyses[a.analyses.length - 1].createdAt) : new Date(0);
        const bDate = (b.analyses?.length || 0) > 0 ? new Date(b.analyses[b.analyses.length - 1].createdAt) : new Date(0);
        return order === 'asc' ? aDate - bDate : bDate - aDate;
      }
      return 0;
    });
    setUsers(sorted);
  };

  const exportToCSV = () => {
    const headers = ['Username,Total Analyses,Last Analysis Date'];
    const rows = filteredUsers.map(user => [
      user.username,
      (user.analyses || []).length,
      (user.analyses || []).length > 0
        ? new Date(user.analyses[user.analyses.length - 1].createdAt).toLocaleString()
        : 'No analyses yet'
    ].join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'users_data.csv';
    link.click();
  };

  const getSuggestionsSummary = (analyses) => {
    const suggestionCounts = analyses.reduce((acc, analysis) => {
      (analysis.analysis?.Suggestions || []).forEach(suggestion => {
        acc[suggestion] = (acc[suggestion] || 0) + 1;
      });
      return acc;
    }, {});
    return Object.entries(suggestionCounts).map(([suggestion, count]) => `${suggestion}: ${count}`).join(', ');
  };

  const getEmotionDistribution = (analyses) => {
    const emotionCounts = analyses.reduce((acc, analysis) => {
      (analysis.analysis?.Emotions || []).forEach(emotion => {
        acc[emotion] = (acc[emotion] || 0) + 1;
      });
      return acc;
    }, {});
    const totalEmotions = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);
    return Object.entries(emotionCounts).map(([emotion, count]) => ({
      emotion,
      count,
      percentage: totalEmotions > 0 ? (count / totalEmotions * 100).toFixed(1) : 0,
      isCritical: criticalEmotions.includes(emotion)
    }));
  };

  const getCriticalEmotionCount = (analyses) => {
    const uniqueCriticalEmotions = new Set();
    analyses.forEach(analysis => {
      (analysis.analysis?.Emotions || []).forEach(emotion => {
        if (criticalEmotions.includes(emotion)) {
          uniqueCriticalEmotions.add(emotion);
        }
      });
    });
    return uniqueCriticalEmotions.size;
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (user.analyses || []).length >= minAnalyses
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  if (loading) return <div className="loading"><div className="spinner"></div>Loading users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-container" onClick={closeContextMenu}>
      <h1>Admin Dashboard - User Details</h1>
      <div className="dashboard-controls">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search by username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <input
            type="number"
            placeholder="Min Analyses"
            value={minAnalyses}
            onChange={(e) => setMinAnalyses(Math.max(0, parseInt(e.target.value) || 0))}
            className="min-analyses-input"
            min="0"
          />
        </div>
        <div>
          <button className="export-btn" onClick={exportToCSV}>Export All to CSV</button>
        </div>
      </div>
      <div className="users-table" onContextMenu={handleContextMenu}>
        <table>
          <thead>
            <tr>
              <th onClick={() => sortUsers('username')}>
                Username {sortField === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => sortUsers('totalAnalyses')}>
                Total Analyses {sortField === 'totalAnalyses' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => sortUsers('lastAnalysisDate')}>
                Last Analysis Date {sortField === 'lastAnalysisDate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => {
              const criticalCount = getCriticalEmotionCount(user.analyses || []);
              return (
                <tr
                  key={user._id}
                  className={selectedUsers.includes(user._id) ? 'selected-row' : ''}
                  onClick={() => toggleUserSelection(user._id)}
                >
                  <td>
                    {criticalCount > 0 && (
                      <span className={`critical-indicator ${criticalCount > 1 ? 'red' : 'yellow'}`}></span>
                    )}
                    {user.username}
                  </td>
                  <td>{(user.analyses || []).length}</td>
                  <td>
                    {(user.analyses || []).length > 0
                      ? new Date(user.analyses[user.analyses.length - 1].createdAt).toLocaleString()
                      : 'No analyses yet'}
                  </td>
                  <td>
                    {(user.analyses || []).length > 0 ? (
                      <button className="details-btn" onClick={(e) => { e.stopPropagation(); openModal(user.analyses); }}>
                        View Analyses
                      </button>
                    ) : (
                      <p>No analyses available</p>
                    )}
                  </td>
                  <td>
                    <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteUser(user._id); }}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>Next</button>
      </div>

      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button onClick={exportSelectedToCSV}>Export Selected ({selectedUsers.length})</button>
          <button onClick={bulkDeleteUsers}>Delete Selected ({selectedUsers.length})</button>
        </div>
      )}

      {selectedAnalysis && (
        <div className="modal active" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>Close</button>
            <h2>Analysis Details</h2>
            <div className="emotion-chart">
              <h3>Emotion Distribution</h3>
              <div className="chart-container">
                {getEmotionDistribution(selectedAnalysis).map(({ emotion, percentage, isCritical }) => (
                  <div key={emotion} className={`emotion-bar ${isCritical ? 'critical' : ''}`}>
                    <span className="emotion-label">{emotion}</span>
                    <div className="bar-wrapper">
                      <div
                        className="bar"
                        style={{ width: `${percentage}%` }}
                      ></div>
                      <span className="bar-value">({percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <ul>
              {selectedAnalysis.map((analysis, index) => (
                <li key={index}>
                  <strong>Transcription:</strong> {analysis.transcription || 'N/A'}
                  <br />
                  <strong>Emotions:</strong> {(analysis.analysis?.Emotions || []).join(', ') || 'N/A'}
                  <br />
                  <strong>Reasons:</strong> {analysis.analysis?.Reasons || 'N/A'}
                  <br />
                  <strong>Suggestions:</strong> {(analysis.analysis?.Suggestions || []).join(', ') || 'N/A'}
                  <br />
                  <strong>Date:</strong> {analysis.createdAt ? new Date(analysis.createdAt).toLocaleString() : 'N/A'}
                  <br />
                  <hr />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

//experimental function highlighting emotions which might indicate depression and sucidial tedencies(still in works)
