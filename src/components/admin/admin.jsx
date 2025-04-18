import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import './admin.css';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [minAnalyses, setMinAnalyses] = useState(0);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, userId: null });
  const itemsPerPage = 10;
  const username = Cookies.get('username');
  const navigate = useNavigate();

  const criticalEmotions = ['Sadness', 'Hopelessness', 'Despair'];

  // Check if user is logged in and fetch users
  useEffect(() => {
    if (!username) {
    } else {
      const fetchUsers = async () => {
        try {
          const response = await axios.get('http://localhost:5001/users');
          // Initialize followUpRequired as false if not present
          const usersWithFollowUp = response.data.users.map(user => ({
            ...user,
            followUpRequired: user.followUpRequired || false,
          }));
          setUsers(usersWithFollowUp || []);
          setLoading(false);
        } catch (err) {
          setError('Failed to fetch users: ' + err.message);
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [username, navigate]);

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

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleFollowUp = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    const confirmChange = window.confirm(
      `Change follow-up status to ${newStatus ? 'Yes' : 'No'} for this user?`
    );

    if (confirmChange) {
      try {
        await axios.patch(`http://localhost:5001/users/${userId}`, {
          followUpRequired: newStatus,
        });
        setUsers(users.map(user =>
          user._id === userId ? { ...user, followUpRequired: newStatus } : user
        ));
      } catch (err) {
        alert('Failed to update follow-up status: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const bulkDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)) {
      try {
        await Promise.all(
          selectedUsers.map((userId) => axios.delete(`http://localhost:5001/users/${userId}`))
        );
        setUsers(users.filter((user) => !selectedUsers.includes(user._id)));
        setSelectedUsers([]);
        setSelectedUser(null);
        alert('Selected users deleted successfully!');
      } catch (err) {
        alert('Failed to delete users: ' + (err.response?.data?.message || err.message));
      }
    }
    setContextMenu({ visible: false, x: 0, y: 0, userId: null });
  };

  const exportSelectedToCSV = () => {
    if (selectedUsers.length === 0) return;
    const selectedData = users.filter((user) => selectedUsers.includes(user._id));
    const headers = [
      'Username',
      'Email',
      'Phone Number',
      'Age',
      'Total Analyses',
      'Last Analysis Date',
      'Follow Up Required',
      'Appointments',
      'Analyses',
    ].join(',');

    const rows = selectedData.map((user) => {
      const analysesDetails = (user.analyses || []).map((analysis) => {
        return [
          `Transcription: ${analysis.transcription || 'N/A'}`,
          `Emotions: ${(analysis.analysis?.Emotions || []).join(', ') || 'N/A'}`,
          `Reasons: ${analysis.analysis?.Reasons || 'N/A'}`,
          `Date: ${analysis.createdAt ? new Date(analysis.createdAt).toLocaleString() : 'N/A'}`,
        ].join('; ');
      }).join(' | ');

      return [
        `"${user.username}"`,
        `"${user.email}"`,
        `"${user.phoneNumber ?? 'Not specified'}"`,
        `"${user.age ?? 'Not specified'}"`,
        (user.analyses || []).length,
        (user.analyses || []).length > 0
          ? `"${new Date(user.analyses[user.analyses.length - 1].createdAt).toLocaleString()}"`
          : '"No analyses yet"',
        user.followUpRequired ? 'Yes' : 'No',
        user.AppointmentApproved && user.appointments?.length > 0
          ? `"${user.appointments.map((appt) => `${appt.date} ${appt.time} with ${appt.doctor}`).join('; ')}"`
          : '"No approved appointments"',
        `"${analysesDetails.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'selected_users_data.csv';
    link.click();
    setContextMenu({ visible: false, x: 0, y: 0, userId: null });
  };

  const handleContextMenu = (e, userId) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      userId,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, userId: null });
  };

  const viewUserDetails = (userId) => {
    const user = users.find((u) => u._id === userId);
    console.log('Opening user details for:', user);
    setSelectedUser(user);
    setContextMenu({ visible: false, x: 0, y: 0, userId: null });
  };

  const closeUserDetails = () => {
    console.log('Closing user details');
    setSelectedUser(null);
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
          setUsers(users.filter((user) => user._id !== userId));
          if (selectedUser && selectedUser._id === userId) setSelectedUser(null);
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
        const aDate =
          (a.analyses?.length || 0) > 0
            ? new Date(a.analyses[a.analyses.length - 1].createdAt)
            : new Date(0);
        const bDate =
          (b.analyses?.length || 0) > 0
            ? new Date(b.analyses[b.analyses.length - 1].createdAt)
            : new Date(0);
        return order === 'asc' ? aDate - bDate : bDate - aDate;
      }
      if (field === 'phoneNumber') {
        const aPhone = a.phoneNumber || '';
        const bPhone = b.phoneNumber || '';
        return order === 'asc'
          ? aPhone.localeCompare(bPhone)
          : bPhone.localeCompare(aPhone);
      }
      if (field === 'followUpRequired') {
        return order === 'asc'
          ? (a.followUpRequired ? 1 : 0) - (b.followUpRequired ? 1 : 0)
          : (b.followUpRequired ? 1 : 0) - (a.followUpRequired ? 1 : 0);
      }
      if (field === 'appointments') {
        const aAppt = a.AppointmentApproved && a.appointments?.length > 0
          ? a.appointments[0].date
          : '';
        const bAppt = b.AppointmentApproved && b.appointments?.length > 0
          ? b.appointments[0].date
          : '';
        return order === 'asc'
          ? aAppt.localeCompare(bAppt)
          : bAppt.localeCompare(aAppt);
      }
      return 0;
    });
    setUsers(sorted);
  };

  const exportToCSV = () => {
    const headers = [
      'Username',
      'Email',
      'Phone Number',
      'Age',
      'Total Analyses',
      'Last Analysis Date',
      'Follow Up Required',
      'Appointments',
      'Analyses',
    ].join(',');

    const rows = filteredUsers.map((user) => {
      const analysesDetails = (user.analyses || []).map((analysis) => {
        return [
          `Transcription: ${analysis.transcription || 'N/A'}`,
          `Emotions: ${(analysis.analysis?.Emotions || []).join(', ') || 'N/A'}`,
          `Reasons: ${analysis.analysis?.Reasons || 'N/A'}`,
          `Date: ${analysis.createdAt ? new Date(analysis.createdAt).toLocaleString() : 'N/A'}`,
        ].join('; ');
      }).join(' | ');

      return [
        `"${user.username}"`,
        `"${user.email}"`,
        `"${user.phoneNumber ?? 'Not specified'}"`,
        `"${user.age ?? 'Not specified'}"`,
        (user.analyses || []).length,
        (user.analyses || []).length > 0
          ? `"${new Date(user.analyses[user.analyses.length - 1].createdAt).toLocaleString()}"`
          : '"No analyses yet"',
        user.followUpRequired ? 'Yes' : 'No',
        user.AppointmentApproved && user.appointments?.length > 0
          ? `"${user.appointments.map((appt) => `${appt.date} ${appt.time} with ${appt.doctor}`).join('; ')}"`
          : '"No approved appointments"',
        `"${analysesDetails.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'users_data.csv';
    link.click();
  };

  const getEmotionDistribution = (analyses) => {
    const emotionCounts = analyses.reduce((acc, analysis) => {
      (analysis.analysis?.Emotions || []).forEach((emotion) => {
        acc[emotion] = (acc[emotion] || 0) + 1;
      });
      return acc;
    }, {});
    const totalEmotions = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);
    return Object.entries(emotionCounts).map(([emotion, count]) => ({
      emotion,
      count,
      percentage: totalEmotions > 0 ? (count / totalEmotions * 100).toFixed(1) : 0,
      isCritical: criticalEmotions.includes(emotion),
    }));
  };

  const getCriticalEmotionCount = (analyses) => {
    const uniqueCriticalEmotions = new Set();
    analyses.forEach((analysis) => {
      (analysis.analysis?.Emotions || []).forEach((emotion) => {
        if (criticalEmotions.includes(emotion)) {
          uniqueCriticalEmotions.add(emotion);
        }
      });
    });
    return uniqueCriticalEmotions.size;
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (user.analyses || []).length >= minAnalyses
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Display login message if not logged in
  if (!username) {
    return (
      <div className="admin-container">
        <h1>Access Denied</h1>
        <p>Only authorized users with restricted access can log in.</p>
      </div>
    );
  }

  if (loading) return <div className="loading"><div className="spinner"></div>Loading users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-container" onClick={closeContextMenu}>
      <div className="admin-header">
        <h1>Dr.Prashik Dashboard - User Details</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
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
          <button className="export-btn" onClick={exportToCSV}>
            Export All to CSV
          </button>
        </div>
      </div>
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th onClick={() => sortUsers('appointments')}>
                Appointments {sortField === 'appointments' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => sortUsers('username')}>
                Username {sortField === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => sortUsers('phoneNumber')}>
                Phone Number {sortField === 'phoneNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => sortUsers('totalAnalyses')}>
                Total Analyses {sortField === 'totalAnalyses' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => sortUsers('lastAnalysisDate')}>
                Last Analysis Date{' '}
                {sortField === 'lastAnalysisDate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => sortUsers('followUpRequired')}>
                Follow Up Required {sortField === 'followUpRequired' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                  onContextMenu={(e) => handleContextMenu(e, user._id)}
                >
                  <td>
                    {user.AppointmentApproved && user.appointments?.length > 0
                      ? user.appointments.map((appt, index) => (
                          <div key={index}>
                            {appt.date} {appt.time} with {appt.doctor}
                          </div>
                        ))
                      : 'No approved appointments'}
                  </td>
                  <td>
                    {criticalCount > 0 && (
                      <span
                        className={`critical-indicator ${criticalCount > 1 ? 'red' : 'yellow'}`}
                      ></span>
                    )}
                    {user.username}
                  </td>
                  <td>{user.phoneNumber ?? 'Not specified'}</td>
                  <td>{(user.analyses || []).length}</td>
                  <td>
                    {(user.analyses || []).length > 0
                      ? new Date(user.analyses[user.analyses.length - 1].createdAt).toLocaleString()
                      : 'No analyses yet'}
                  </td>
                  <td>
                    <span
                      className={`follow-up-status ${user.followUpRequired ? 'yes' : 'No'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFollowUp(user._id, user.followUpRequired);
                      }}
                    >
                      {user.followUpRequired ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    {(user.analyses || []).length > 0 ? (
                      <button
                        className="details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(user.analyses);
                        }}
                      >
                        View Analyses
                      </button>
                    ) : (
                      <p>No analyses available</p>
                    )}
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteUser(user._id);
                      }}
                    >
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
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}>
          Next
        </button>
      </div>

      {contextMenu.visible && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={() => viewUserDetails(contextMenu.userId)}>View Details</button>
          <button onClick={exportSelectedToCSV}>Export Selected ({selectedUsers.length})</button>
          <button onClick={bulkDeleteUsers}>Delete Selected ({selectedUsers.length})</button>
        </div>
      )}

      {selectedAnalysis && (
        <div className="modal active" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              Close
            </button>
            <h2>Analysis Details</h2>
            <div className="emotion-chart">
              <h3>Emotion Distribution</h3>
              <div className="chart-container">
                {getEmotionDistribution(selectedAnalysis).map(
                  ({ emotion, percentage, isCritical }) => (
                    <div
                      key={emotion}
                      className={`emotion-bar ${isCritical ? 'critical' : ''}`}
                    >
                      <span className="emotion-label">{emotion}</span>
                      <div className="bar-wrapper">
                        <div className="bar" style={{ width: `${percentage}%` }}></div>
                        <span className="bar-value">({percentage}%)</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
            <ul>
              {selectedAnalysis.map((analysis, index) => (
                <li key={index}>
                  <strong>Transcription:</strong> {analysis.transcription || 'N/A'}
                  <br />
                  <strong>Emotions:</strong>{' '}
                  {(analysis.analysis?.Emotions || []).join(', ') || 'N/A'}
                  <br />
                  <strong>Reasons:</strong> {analysis.analysis?.Reasons || 'N/A'}
                  <br />
                  <strong>Date:</strong>{' '}
                  {analysis.createdAt ? new Date(analysis.createdAt).toLocaleString() : 'N/A'}
                  <br />
                  <hr />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {selectedUser && (
        <div
          className="modal active"
          onClick={(e) => {
            console.log('Modal background clicked');
            closeUserDetails();
          }}
        >
          <div
            className="modal-content large-modal"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Modal content clicked');
            }}
          >
            <button className="modal-close" onClick={closeUserDetails}>
              Close
            </button>
            <h2>User Profile Details</h2>
            {selectedUser ? (
              <div className="profile-details">
                <div className="avatar-section">
                  <img
                    src={selectedUser.avatar || '/api/placeholder/200/200'}
                    alt="User Avatar"
                    className="avatar-full"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/200/200';
                      console.log('Avatar load failed');
                    }}
                    onLoad={() => console.log('Avatar loaded successfully')}
                  />
                </div>
                <div className="details-list">
                  <div className="detail-item">
                    <strong>Username:</strong> {selectedUser.username || 'N/A'}
                  </div>
                  <div className="detail-item">
                    <strong>Email:</strong> {selectedUser.email || 'N/A'}
                  </div>
                  <div className="detail-item">
                    <strong>Phone Number:</strong> {selectedUser.phoneNumber ?? 'Not specified'}
                  </div>
                  <div className="detail-item">
                    <strong>Age:</strong> {selectedUser.age ?? 'Not specified'}
                  </div>
                  <div className="detail-item">
                    <strong>Follow Up Required:</strong> {selectedUser.followUpRequired ? 'Yes' : 'No'}
                  </div>
                  <div className="detail-item">
                    <strong>Google ID:</strong> {selectedUser.googleId ?? 'N/A'}
                  </div>
                  <div className="detail-item">
                    <strong>GitHub ID:</strong> {selectedUser.githubId ?? 'N/A'}
                  </div>
                  <div className="detail-item">
                    <strong>Total Analyses:</strong> {(selectedUser.analyses || []).length || 0}
                  </div>
                  <div className="detail-item">
                    <strong>Appointments:</strong>
                    {selectedUser.AppointmentApproved && selectedUser.appointments?.length > 0
                      ? selectedUser.appointments.map((appt, index) => (
                          <div key={index}>
                            {appt.date} {appt.time} with {appt.doctor}
                          </div>
                        ))
                      : 'No approved appointments'}
                  </div>
                </div>
              </div>
            ) : (
              <p>Loading user details...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
