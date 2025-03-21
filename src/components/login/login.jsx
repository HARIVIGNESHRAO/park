import React, { useState } from 'react';
import styles from './login.module.css';
import { FaFacebookF, FaGooglePlusG, FaLinkedinIn } from 'react-icons/fa';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [username, setUsername] = useState(''); // Changed from email to username
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Kept for signup form
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignUpClick = () => setIsRightPanelActive(true);
  const handleSignInClick = () => setIsRightPanelActive(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/register', {
        username,
        password
      });
      alert(response.data.message);
      setIsRightPanelActive(false); // Switch to login after signup
      setName('');
      setUsername('');
      setPassword('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };
const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/login', {
        username,
        password
      }, { withCredentials: true });
      Cookies.set('username', response.data.username, {
        expires: 1,
        path: '/',
        domain: 'localhost' // Explicitly set domain
      });
      console.log('Cookie set in Login:', Cookies.get('username')); // Debug
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={`${styles.container} ${isRightPanelActive ? styles.rightPanelActive : ''}`}>
        <div className={`${styles.formContainer} ${styles.signUpContainer}`}>
          <form onSubmit={handleSignUp}>
            <h1>Create Account</h1>
            <div className={styles.socialContainer}>
              <a href="#" className={styles.social}><FaFacebookF /></a>
              <a href="#" className={styles.social}><FaGooglePlusG /></a>
              <a href="#" className={styles.social}><FaLinkedinIn /></a>
            </div>
            <span>or use your email for registration</span>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="text" // Changed to text since backend uses username
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit">Sign Up</button>
          </form>
        </div>
        <div className={`${styles.formContainer} ${styles.signInContainer}`}>
          <form onSubmit={handleSignIn}>
            <h1>Sign In</h1>
            <div className={styles.socialContainer}>
              <a href="#" className={styles.social}><FaFacebookF /></a>
              <a href="#" className={styles.social}><FaGooglePlusG /></a>
              <a href="#" className={styles.social}><FaLinkedinIn /></a>
            </div>
            <span>or use your account</span>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <a href="#">Forgot your password?</a>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit">Sign In</button>
          </form>
        </div>
        <div className={styles.overlayContainer}>
          <div className={styles.overlay}>
            <div className={`${styles.overlayPanel} ${styles.overlayLeft}`}>
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className={styles.ghost} onClick={handleSignInClick}>Sign In</button>
            </div>
            <div className={`${styles.overlayPanel} ${styles.overlayRight}`}>
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start your journey with us</p>
              <button className={styles.ghost} onClick={handleSignUpClick}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;