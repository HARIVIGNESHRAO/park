import React, { useState } from 'react';
import styles from './login.module.css';
import { FaGooglePlusG } from 'react-icons/fa';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Menu, X } from 'lucide-react';

const Login = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignUpClick = () => setIsRightPanelActive(true);
  const handleSignInClick = () => setIsRightPanelActive(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleGoogleSuccess = async (response) => {
    try {
      const res = await axios.post(
        'http://localhost:5001/google-login',
        { token: response.credential },
        { withCredentials: true }
      );
      Cookies.set('username', res.data.username, {
        expires: 1,
        path: '/',
        secure: false, // For localhost development
        sameSite: 'Lax',
      });
      console.log('Google login cookie set:', Cookies.get('username'));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Google login failed');
      console.error('Google login error:', err);
    }
  };

  const handleGoogleFailure = (error) => {
    setError('Google login failed');
    console.error('Google login failure:', error);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/register', {
        username,
        password,
        email,
        name,
        phoneNumber,
      });
      alert(response.data.message);
      setIsRightPanelActive(false);
      setName('');
      setUsername('');
      setPassword('');
      setEmail('');
      setPhoneNumber('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      // Special case for prashik
      if (username === 'prashik' && password === 'prashik') {
        Cookies.set('username', 'prashik', {
          expires: 1,
          path: '/',
          secure: false, // For localhost development
          sameSite: 'Lax',
        });
        console.log('Cookie set for prashik:', Cookies.get('username'));
        navigate('/admin');
        return;
      }

      // Regular login with MongoDB
      const response = await axios.post(
        'http://localhost:5001/login',
        { username, password },
        { withCredentials: true }
      );
      Cookies.set('username', response.data.username, {
        expires: 1,
        path: '/',
        secure: false, // For localhost development
        sameSite: 'Lax',
      });
      console.log('Cookie set in Login:', Cookies.get('username'));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      console.error('Login error:', err);
    }
  };

  return (
    <GoogleOAuthProvider clientId="423273358250-erqvredg1avk5pr09ugj8uve1rg11m3m.apps.googleusercontent.com">
      <header className="header">
        <div className="logo">
          <h1>
            <img src="../images/prahas.png" style={{ width: '100px' }} alt="Vaidya Vani Logo" />
          </h1>
          <span>Hearing Emotions Hearing Minds</span>
        </div>
        <div className="nav-container">
          <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
            <ul>
              <li ><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="#demo">Try Demo</a></li>
              <li className="active"><a href="/login">Login</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </nav>
          <button className="menu-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      <div className={styles.pageWrapper}>
        <div className={`${styles.container} ${isRightPanelActive ? styles.rightPanelActive : ''}`}>
          <div className={`${styles.formContainer} ${styles.signUpContainer}`}>
            <form onSubmit={handleSignUp}>
              <h1>Create Account</h1>
              <div className={styles.socialContainer}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleFailure}
                  render={(renderProps) => (
                    <a href="#" className={styles.social} onClick={renderProps.onClick}>
                      <FaGooglePlusG />
                    </a>
                  )}
                />
              </div>
              <span>or use your email for registration</span>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
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
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleFailure}
                  render={(renderProps) => (
                    <a href="#" className={styles.social} onClick={renderProps.onClick}>
                      <FaGooglePlusG />
                    </a>
                  )}
                />
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
                <button className={styles.ghost} onClick={handleSignInClick}>
                  Sign In
                </button>
              </div>
              <div className={`${styles.overlayPanel} ${styles.overlayRight}`}>
                <h1>Hello, Friend!</h1>
                <p>Enter your personal details and start your journey with us</p>
                <button className={styles.ghost} onClick={handleSignUpClick}>
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
