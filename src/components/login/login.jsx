import React, { useState } from 'react';
import styles from './login.module.css';
import { FaFacebookF, FaGithub, FaGooglePlusG, FaLinkedinIn } from 'react-icons/fa';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import GitHubLogin from 'react-github-login';

const Login = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email,setEmail]=useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignUpClick = () => setIsRightPanelActive(true);
  const handleSignInClick = () => setIsRightPanelActive(false);

  const handleGoogleSuccess = async (response) => {
    try {
      const res = await axios.post('https://salaar1-production.up.railway.app/google-login', {
        token: response.credential
      }, { withCredentials: true });

      Cookies.set('username', res.data.username, {
        expires: 1,
        path: '/',
        secure: true,
        sameSite: 'None',
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Google login failed');
    }
  };

  const handleGoogleFailure = (error) => {
    setError('Google login failed');
    console.error(error);
  };

  const handleGithubSuccess = async (response) => {
    try {
      const res = await axios.post('https://salaar1-production.up.railway.app/github-login', {
        code: response.code
      }, { withCredentials: true });

      Cookies.set('username', res.data.username, {
        expires: 1,
        path: '/',
        secure: true,
        sameSite: 'None',
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'GitHub login failed');
    }
  };

  const handleGithubFailure = (error) => {
    setError('GitHub login failed');
    console.error(error);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/register', {
        username,
        password,
        email
      });
      alert(response.data.message);
      setIsRightPanelActive(false);
      setName('');
      setUsername('');
      setPassword('');
      setEmail('');
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
        secure: true,
        sameSite: 'None',
      });
      console.log('Cookie set in Login:', Cookies.get('username'));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <GoogleOAuthProvider clientId="423273358250-erqvredg1avk5pr09ugj8uve1rg11m3m.apps.googleusercontent.com">
      <div className={styles.pageWrapper}>
        <div className={`${styles.container} ${isRightPanelActive ? styles.rightPanelActive : ''}`}>
          <div className={`${styles.formContainer} ${styles.signUpContainer}`}>
            <form onSubmit={handleSignUp}>
              <h1>Create Account</h1>
              <div className={styles.socialContainer}>
                <GitHubLogin
                  clientId="Ov23liiXOYhc1dxfIBau"
                  redirectUri="https://speech-park.web.app"
                  onSuccess={handleGithubSuccess}
                  onFailure={handleGithubFailure}
                  className={styles.social}
                  buttonText={<FaGithub />}
                />
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleFailure}
                  render={(renderProps) => (
                    <a
                      href="#"
                      className={styles.social}
                      onClick={renderProps.onClick}
                    >
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
              onChange={(e)=>setEmail(e.target.value)}/>
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
                <GitHubLogin
                  clientId="Ov23liiXOYhc1dxfIBau"
                  redirectUri="https://speech-park.web.app"
                  onSuccess={handleGithubSuccess}
                  onFailure={handleGithubFailure}
                  className={styles.social}
                  buttonText={<FaGithub />}
                />
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleFailure}
                  render={(renderProps) => (
                    <a
                      href="#"
                      className={styles.social}
                      onClick={renderProps.onClick}
                    >
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
    </GoogleOAuthProvider>
  );
};

export default Login;
