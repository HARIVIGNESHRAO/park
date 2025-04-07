import React, { useState, useEffect } from 'react';
import { User, Mail, Edit, Check, X, Camera, ChevronDown, Calendar } from 'lucide-react';
import styles from './improved-profile.module.css';
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
    age: '',
    avatar: localStorage.getItem('userAvatar') || '/api/placeholder/150/150',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    age: '',
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
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view your profile');
        }
        throw new Error('Failed to fetch profile data');
      }

      const data = await response.json();
      setUserData({
        name: data.name || data.username,
        username: data.username,
        email: data.email,
        age: data.age || '',
        avatar: localStorage.getItem('userAvatar') || '/api/placeholder/150/150',
      });
      setEditFormData({
        name: data.name || data.username,
        email: data.email,
        age: data.age || '',
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
        credentials: 'include',
        body: JSON.stringify({
          name: editFormData.name,
          email: editFormData.email,
          age: editFormData.age,
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
        age: updatedData.age,
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
      age: userData.age,
    });
    setAvatarPreview(userData.avatar);
    setIsEditing(false);
    setShowAvatarSelector(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loader}></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>!</div>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={fetchUserData} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        <div className={styles.headerContent}>
          <h1>My Profile</h1>
          <p>Manage your personal information</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className={styles.editButton}
          >
            <Edit size={18} /> Edit Profile
          </button>
        )}
      </div>

      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              <img src={avatarPreview} alt="Profile Avatar" />
            </div>
            <label
              htmlFor="avatar-upload"
              className={styles.avatarUploadLabel}
            >
              <Camera size={20} />
              <input
                id="avatar-upload"
                type="file"
                className={styles.avatarUpload}
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
          <div className={styles.avatarActions}>
            <button
              onClick={() => setShowAvatarSelector(!showAvatarSelector)}
              className={styles.avatarSelectButton}
            >
              Choose Avatar <ChevronDown size={18} />
            </button>
          </div>

          {showAvatarSelector && (
            <div className={styles.avatarSelector}>
              {whatsappAvatars.map((avatar, index) => (
                <img
                  key={index}
                  src={avatar}
                  alt={`Avatar ${index + 1}`}
                  className={styles.avatarOption}
                  onClick={() => handleAvatarSelect(avatar)}
                />
              ))}
            </div>
          )}
        </div>

        <div className={styles.profileContent}>
          {!isEditing ? (
            <div className={styles.profileInfo}>
              <div className={styles.infoCard}>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <User size={22} />
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Name</div>
                    <div className={styles.infoValue}>{userData.name}</div>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <User size={22} />
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Username</div>
                    <div className={styles.infoValue}>{userData.username}</div>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <Mail size={22} />
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Email</div>
                    <div className={styles.infoValue}>{userData.email}</div>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <Calendar size={22} />
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Age</div>
                    <div className={styles.infoValue}>
                      {userData.age ? `${userData.age} years` : 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.editForm}>
              <div className={styles.formColumns}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.formLabel}>
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={editFormData.name}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="username" className={styles.formLabel}>
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={userData.username}
                    className={`${styles.formInput} ${styles.inputDisabled}`}
                    disabled
                  />
                  <p className={styles.helpText}>Username cannot be changed</p>
                </div>
              </div>

              <div className={styles.formColumns}>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.formLabel}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="age" className={styles.formLabel}>
                    Age
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    min="1"
                    max="120"
                    value={editFormData.age}
                    onChange={handleInputChange}
                    className={`${styles.formInput} ${styles.ageInput}`}
                    placeholder="Enter your age"
                  />
                </div>
              </div>

              {error && <div className={styles.errorMessage}>{error}</div>}

              <div className={styles.buttonsRow}>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={loading}
                >
                  <Check size={18} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className={styles.cancelButton}
                  disabled={loading}
                >
                  <X size={18} /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
