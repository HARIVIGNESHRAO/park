import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './admin.css'; // Optional: for styling

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5001/users');
        console.log('API Response:', response.data); // Debug the response
        setUsers(response.data.users || []); // Fallback to empty array if no users
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch users: ' + err.message);
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-container">
      <h1>Admin Dashboard - User Details</h1>
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Total Analyses</th>
              <th>Last Analysis Date</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{(user.analyses || []).length}</td> {/* Fallback to empty array */}
                <td>
                  {(user.analyses || []).length > 0
                    ? new Date(
                        (user.analyses || [])[(user.analyses || []).length - 1].createdAt
                      ).toLocaleString()
                    : 'No analyses yet'}
                </td>
                <td>
                  <details>
                    <summary>View Analyses</summary>
                    {(user.analyses || []).length > 0 ? (
                      <ul>
                        {(user.analyses || []).map((analysis, index) => (
                          <li key={index}>
                            <strong>Transcription:</strong> {analysis.transcription || 'N/A'}
                            <br />
                            <strong>Emotions:</strong>{' '}
                            {(analysis.analysis?.Emotions || []).join(', ') || 'N/A'}
                            <br />
                            <strong>Reasons:</strong> {analysis.analysis?.Reasons || 'N/A'}
                            <br />
                            <strong>Suggestions:</strong>{' '}
                            {(analysis.analysis?.Suggestions || []).join(', ') || 'N/A'}
                            <br />
                            <strong>Date:</strong>{' '}
                            {analysis.createdAt
                              ? new Date(analysis.createdAt).toLocaleString()
                              : 'N/A'}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No analyses available</p>
                    )}
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;