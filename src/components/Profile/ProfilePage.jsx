import React, { useState, useEffect } from 'react';
import { User, Mail, Edit, Check, X } from 'lucide-react';
import styles from './profile.module.css';
import boy1 from './avatars/boy-1.jpg';
import boy2 from './avatars/boy-2.jpg';
import boy3 from './avatars/boy-3.jpg';
import boy4 from './avatars/boy-4.jpg';
import girl2 from './avatars/girl-2.jpg';
import girl3 from './avatars/girl-3.jpg';
import girl4 from './avatars/girl-4.jpg';
import girl5 from './avatars/girl-5.jpg';

const whatsappAvatars = [
  boy1, boy2, boy3, boy4,
  girl2, girl3, girl4, girl5,
];

const ProfilePage = () => {
  const [userData, setUserData] = useState({
    name: '',
    username: '',
    email: '',
    avatar: localStorage.getItem('userAvatar') || '/api/placeholder/150/150',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
  });
  const [avatarPreview, setAvatarPreview] = useState(userData.avatar);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5001/api/user/profile', {
        method: 'GET',
        credentials: 'include', // Send cookies for authentication
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view your profile');
        }
        throw new Error('Failed to fetch profile data');
      }

      const data = await response.json();
      setUserData({
        name: data.name || data.username, // Fallback to username if name isn't set
        username: data.username,
        email: data.email,
        avatar: localStorage.getItem('userAvatar') || '/api/placeholder/150/150',
      });
      setEditFormData({
        name: data.name || data.username,
        email: data.email,
      });
      setAvatarPreview(localStorage.getItem('userAvatar') || '/api/placeholder/150/150');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        localStorage.setItem('userAvatar', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSelect = (avatarUrl) => {
    setAvatarPreview(avatarUrl);
    localStorage.setItem('userAvatar', avatarUrl);
    setShowAvatarSelector(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5001/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies for authentication
        body: JSON.stringify({
          name: editFormData.name,
          email: editFormData.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedData = await response.json();
      setUserData({
        ...userData,
        name: updatedData.name,
        email: updatedData.email,
        avatar: avatarPreview,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditFormData({
      name: userData.name,
      email: userData.email,
    });
    setAvatarPreview(userData.avatar);
    setIsEditing(false);
    setShowAvatarSelector(false);
    setError(null);
  };

  if (loading) {
    return <div className={styles['profile-container']}>Loading...</div>;
  }

  if (error) {
    return (
      <div className={styles['profile-container']}>
        <div className={styles['error-message']}>{error}</div>
        <button onClick={fetchUserData} className={styles['retry-button']}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles['profile-container']}>
      <div className={styles['profile-card']}>
        <h1 className={styles['page-title']}>Profile</h1>

        <div className={styles['avatar-container']}>
          <div className={styles['avatar-wrapper']}>
            <div className={styles.avatar}>
              <img src={avatarPreview} alt="Profile Avatar" />
            </div>
            <label
              htmlFor="avatar-upload"
              className={styles['avatar-upload-label']}
            >
              <Edit size={16} />
              <input
                id="avatar-upload"
                type="file"
                className={styles['avatar-upload']}
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>
            <button
              onClick={() => setShowAvatarSelector(!showAvatarSelector)}
              className={styles['avatar-select-button']}
            >
              Select Avatar
            </button>
          </div>

          {showAvatarSelector && (
            <div className={styles['avatar-selector']}>
              {whatsappAvatars.map((avatar, index) => (
                <img
                  key={index}
                  src={avatar}
                  alt={`Avatar ${index + 1}`}
                  className={styles['avatar-option']}
                  onClick={() => handleAvatarSelect(avatar)}
                />
              ))}
            </div>
          )}
        </div>

        {!isEditing ? (
          <div className={styles['profile-info']}>
            <div className={styles['info-item']}>
              <User className={styles['info-icon']} size={20} />
              <div className={styles['info-content']}>
                <div className={styles['info-label']}>Name</div>
                <div className={styles['info-value']}>{userData.name}</div>
              </div>
            </div>

            <div className={styles['info-item']}>
              <User className={styles['info-icon']} size={20} />
              <div className={styles['info-content']}>
                <div className={styles['info-label']}>Username</div>
                <div className={styles['info-value']}>{userData.username}</div>
              </div>
            </div>

            <div className={styles['info-item']}>
              <Mail className={styles['info-icon']} size={20} />
              <div className={styles['info-content']}>
                <div className={styles['info-label']}>Email</div>
                <div className={styles['info-value']}>{userData.email}</div>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className={styles['edit-button']}
            >
              <Edit size={16} className={styles['button-icon']} /> Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles['form-group']}>
              <label htmlFor="name" className={styles['form-label']}>
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={editFormData.name}
                onChange={handleInputChange}
                className={styles['form-input']}
                required
              />
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="username" className={styles['form-label']}>
                Username
              </label>
              <input
                type="text"
                id="username"
                value={userData.username}
                className={styles['form-input']}
                disabled
              />
              <p className={styles['help-text']}>Username cannot be changed</p>
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="email" className={styles['form-label']}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={editFormData.email}
                onChange={handleInputChange}
                className={styles['form-input']}
                required
              />
            </div>

            {error && <div className={styles['error-message']}>{error}</div>}

            <div className={styles['buttons-row']}>
              <button
                type="submit"
                className={styles['save-button']}
                disabled={loading}
              >
                <Check size={16} className={styles['button-icon']} />
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className={styles['cancel-button']}
                disabled={loading}
              >
                <X size={16} className={styles['button-icon']} /> Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;