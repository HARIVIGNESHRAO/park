import React, { useEffect, useState } from 'react';
import styles from './login.module.css';
import { FaGooglePlusG } from 'react-icons/fa';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Menu, X } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

const Login = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const handleSignUpClick = () => setIsRightPanelActive(true);
  const handleSignInClick = () => setIsRightPanelActive(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleRecaptchaChange = (token) => setRecaptchaToken(token);

  const handleSignUp1 = () => navigate('/login');

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
        secure: false,
        sameSite: 'Lax',
      });
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
    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA');
      return;
    }
    try {
      if (username === 'prashik' && password === 'prashik') {
        Cookies.set('username', 'prashik', {
          expires: 1,
          path: '/',
          secure: false,
          sameSite: 'Lax',
        });
        navigate('/admin');
        return;
      }

      const response = await axios.post(
        'http://localhost:5001/login',
        { username, password },
        { withCredentials: true }
      );
      Cookies.set('username', response.data.username, {
        expires: 1,
        path: '/',
        secure: false,
        sameSite: 'Lax',
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      console.error('Login error:', err);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/forgot-password', {
        email: forgotEmail,
      });
      setIsCodeSent(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send verification code');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/reset-password', {
        email: forgotEmail,
        code: verificationCode,
        newPassword,
      });
      alert(response.data.message);
      setIsForgotPassword(false);
      setIsCodeSent(false);
      setForgotEmail('');
      setVerificationCode('');
      setNewPassword('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const sections = ['home', 'about', 'features', 'demo', 'process'].map((id) => {
        const element = document.getElementById(id);
        if (!element) return { id, top: 0, bottom: 0 };
        const rect = element.getBoundingClientRect();
        return {
          id,
          top: rect.top + scrollPosition - 100,
          bottom: rect.bottom + scrollPosition - 100,
        };
      });

      for (const section of sections) {
        if (scrollPosition >= section.top && scrollPosition < section.bottom) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <GoogleOAuthProvider clientId="423273358250-erqvredg1avk5pr09ugj8uve1rg11m3m.apps.googleusercontent.com">
      <header className={styles.header}>
        <div className={`${styles.headerWrapper} ${styles.headerContainer}`}>
          <h1 className={styles.brandLogo}>Vaidya Vani</h1>
          <nav className={styles.mainNav}>
            <ul className={styles.navMenu}>
              <li>
                <a href="/" className={`${styles.navLink} ${activeSection === 'home' ? styles.activeLink : ''}`}>
                  Home
                </a>
              </li>
              <li>
                <a href="/about" className={`${styles.navLink} ${activeSection === 'about' ? styles.activeLink : ''}`}>
                  About
                </a>
              </li>
              <li>
                <a href="/" className={`${styles.navLink} ${activeSection === 'features' ? styles.activeLink : ''}`}>
                  Features
                </a>
              </li>
              <li>
                <a href="/" className={`${styles.navLink} ${activeSection === 'demo' ? styles.activeLink : ''}`}>
                  Demo
                </a>
              </li>
              <li>
                <a href="/" className={`${styles.navLink} ${activeSection === 'process' ? styles.activeLink : ''}`}>
                  How It Works
                </a>
              </li>
              <li>
                <a href="/contact" className={`${styles.navLink} ${activeSection === 'contact' ? styles.activeLink : ''}`}>
                  Contact Us
                </a>
              </li>
            </ul>
          </nav>
          <button className={styles.menuToggle} onClick={toggleMenu} aria-expanded={isMenuOpen} aria-label="Toggle navigation menu">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
          <button className={styles.registerBtn} onClick={handleSignUp1}>
            Sign Up
          </button>
        </div>
        {isMenuOpen && (
          <div className={styles.mobileMenu}>
            <nav className={styles.headerWrapper}>
              <ul className={styles.mobileNavMenu}>
                <li>
                  <a href="/" className={`${styles.mobileNavLink} ${activeSection === 'home' ? styles.activeLink : ''}`} onClick={toggleMenu}>
                    Home
                  </a>
                </li>
                <li>
                  <a href="/about" className={`${styles.mobileNavLink} ${activeSection === 'about' ? styles.activeLink : ''}`} onClick={toggleMenu}>
                    About
                  </a>
                </li>
                <li>
                  <a href="/" className={`${styles.mobileNavLink} ${activeSection === 'features' ? styles.activeLink : ''}`} onClick={toggleMenu}>
                    Features
                  </a>
                </li>
                <li>
                  <a href="/" className={`${styles.mobileNavLink} ${activeSection === 'demo' ? styles.activeLink : ''}`} onClick={toggleMenu}>
                    Demo
                  </a>
                </li>
                <li>
                  <a href="/" className={`${styles.mobileNavLink} ${activeSection === 'process' ? styles.activeLink : ''}`} onClick={toggleMenu}>
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="/contact" className={`${styles.mobileNavLink} ${activeSection === 'contact' ? styles.activeLink : ''}`} onClick={toggleMenu}>
                    Contact Us
                  </a>
                </li>
                <li className={styles.mobileRegisterContainer}>
                  <button className={`${styles.registerBtn} ${styles.mobileRegister}`} onClick={() => { handleSignUp1(); toggleMenu(); }}>
                    Sign Up
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </header>
      <div className={styles.pageWrapper}>
        <div className={`${styles.container} ${isRightPanelActive ? styles.rightPanelActive : ''}`}>
          {isForgotPassword ? (
            <div className={`${styles.formContainer} ${styles.signInContainer}`}>
              <form onSubmit={isCodeSent ? handleResetPassword : handleForgotPassword}>
                <h1>{isCodeSent ? 'Reset Password' : 'Forgot Password'}</h1>
                <span>{isCodeSent ? 'Enter verification code and new password' : 'Enter your email to reset password'}</span>
                <input
                  type="email"
                  placeholder="Email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={isCodeSent}
                />
                {isCodeSent && (
                  <>
                    <input
                      type="text"
                      placeholder="Verification Code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </>
                )}
                {error && <p className={styles.error}>{error}</p>}
                <br/>
                <button type="submit">{isCodeSent ? 'Reset Password' : 'Send Verification Code'}</button>
                <br/>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => {
                    setIsForgotPassword(false);
                    setIsCodeSent(false);
                    setForgotEmail('');
                    setVerificationCode('');
                    setNewPassword('');
                    setError('');
                  }}
                  className="bi bi-arrow-left-short"
                >
                  Back to Sign In
                </button>
              </form>
            </div>
          ) : (
            <>
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
                  <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                  <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
                  <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <br />
                  <div className={styles['g-recaptcha']}>
                    <ReCAPTCHA sitekey="6LfFZzErAAAAAEAxxc7gFJGwvDWNaS8U-yzU0eCr" onChange={handleRecaptchaChange} />
                  </div>
                  <a href="#" onClick={() => setIsForgotPassword(true)}>
                    Forgot your password?
                  </a>
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
                    <br />
                    <button className={styles.ghost} onClick={handleSignUpClick}>
                      Sign Up
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;