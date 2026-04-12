import React from 'react';
import './LifeTrackAuth.css';

const LifeTrackAuth = () => (
  <div className="auth-container">
    <h1 className="auth-title">LifeTrack</h1>
    <h2 className="auth-subtitle">Master your daily habits</h2>
    <form className="auth-form">
      <label htmlFor="email" className="auth-label">Email Address</label>
      <input id="email" type="email" className="auth-input" autoComplete="email" />
      <label htmlFor="password" className="auth-label">Password</label>
      <input id="password" type="password" className="auth-input" autoComplete="current-password" />
      <div className="auth-links">
        <a href="#" className="auth-link">Forgot password?</a>
      </div>
      <button type="submit" className="auth-button">Sign In</button>
    </form>
    <div className="auth-divider">or continue with</div>
    <div className="auth-social">
      <button className="auth-social-btn google">Google</button>
      <button className="auth-social-btn facebook">Facebook</button>
    </div>
    <div className="auth-footer">
      <span>Don't have an account?</span>
      <a href="#" className="auth-link">Sign Up now</a>
    </div>
  </div>
);

export default LifeTrackAuth;
