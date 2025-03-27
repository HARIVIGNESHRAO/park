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
  const itemsPerPage = 10; // Changed from 5 to 10

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5001/users');
        console.log('API Response:', response.data);
        setUsers(response.data.users || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch users: ' + err.message);
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const openModal = (analysis) => {
    setSelectedAnalysis(analysis);
  };

  const closeModal = () => {
    setSelectedAnalysis(null);
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`http://localhost:5001/users/${userId}`);
        setUsers(users.filter(user => user._id !== userId));
      } catch (err) {
        alert('Failed to delete user: ' + err.message);
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

  const getEmotionSummary = (analyses) => {
    const emotionCounts = analyses.reduce((acc, analysis) => {
      (analysis.analysis?.Emotions || []).forEach(emotion => {
        acc[emotion] = (acc[emotion] || 0) + 1;
      });
      return acc;
    }, {});
    return Object.entries(emotionCounts).map(([emotion, count]) => `${emotion}: ${count}`).join(', ');
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-container">
      <h1>Admin Dashboard - User Details</h1>
      <div className="dashboard-controls">
        <input
          type="text"
          placeholder="Search by username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button className="export-btn" onClick={exportToCSV}>Export to CSV</button>
      </div>
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th onClick={() => sortUsers('username')}>Username</th>
              <th onClick={() => sortUsers('totalAnalyses')}>Total Analyses</th>
              <th onClick={() => sortUsers('lastAnalysisDate')}>Last Analysis Date</th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{(user.analyses || []).length}</td>
                <td>
                  {(user.analyses || []).length > 0
                    ? new Date(user.analyses[user.analyses.length - 1].createdAt).toLocaleString()
                    : 'No analyses yet'}
                </td>
                <td>
                  {(user.analyses || []).length > 0 ? (
                    <button className="details-btn" onClick={() => openModal(user.analyses)}>
                      View Analyses
                    </button>
                  ) : (
                    <p>No analyses available</p>
                  )}
                </td>
                <td>
                  <button className="delete-btn" onClick={() => deleteUser(user._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>Next</button>
      </div>

      {/* Modal */}
      {selectedAnalysis && (
        <div className="modal active" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>Close</button>
            <h2>Analysis Details</h2>
            <p><strong>Emotion Summary:</strong> {getEmotionSummary(selectedAnalysis) || 'N/A'}</p>
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
