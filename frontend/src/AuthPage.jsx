import React, { useState, useRef, useEffect } from 'react';
import { Leaf, Mail, Lock, User, ArrowRight, Eye, EyeOff, KeyRound, Wand2, ShieldCheck } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import './AuthPage.css';

const AuthPage = ({ onLogin, onBack, initialIsLogin = true }) => {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('planto_last_email') || ''; } catch { return ''; }
  });
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('farmer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showOTP, setShowOTP] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [forgotState, setForgotState] = useState('none'); // 'none', 'request', 'reset'
  const [newPassword, setNewPassword] = useState('');
  const [resetOtp, setResetOtp] = useState('');

  const otp = otpDigits.join('');

  // Auto-submit when all 6 OTP digits filled
  useEffect(() => {
    if (showOTP && otp.length === 6 && !isLoading) {
      submitOTP(otp);
    }
  }, [otp, showOTP]);

  const handleOtpDigit = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otpDigits];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
    setOtpDigits(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError(null);
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';
      try {
        const res = await fetch(`${BASE_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenResponse.access_token, role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Google Auth Failed');
        onLogin({
          access_token: data.access_token,
          ...data.user
        });
      } catch (err) {
        console.error('Google Auth Error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Google Login Failed');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';
      const endpoint = isLogin ? `${BASE_URL}/login` : `${BASE_URL}/register`;
      const body = isLogin
        ? { email, password, role }
        : { email, password, full_name: name, role };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Authentication failed');

      if (data.requires_otp) {
        try { localStorage.setItem('planto_last_email', email); } catch {}
        setShowOTP(true);
        setOtpDigits(['', '', '', '', '', '']);
        setSuccessMsg("Check your email for the 6-digit code.");
        setTimeout(() => otpRefs.current[0]?.focus(), 80);
      } else {
        onLogin({ access_token: data.access_token, ...data.user });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const submitOTP = async (otpValue) => {
    setIsLoading(true);
    setError(null);
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';
      const response = await fetch(`${BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Invalid verification code');
      onLogin({ access_token: data.access_token, ...data.user });
    } catch (err) {
      setError(err.message);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = (e) => { e.preventDefault(); submitOTP(otp); };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';
      const response = await fetch(`${BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to send reset link');

      setForgotState('reset');
      setSuccessMsg("A password reset code has been sent to your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';
      const response = await fetch(`${BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: resetOtp, new_password: newPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to reset password');

      setForgotState('none');
      setIsLogin(true);
      setResetOtp('');
      setNewPassword('');
      setSuccessMsg("Password reset successfully! You can now log in.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackNavigation = () => {
    if (forgotState !== 'none') {
      setForgotState('none');
      setError(null);
      setSuccessMsg(null);
    } else if (showOTP) {
      setShowOTP(false);
      setError(null);
      setSuccessMsg(null);
    } else {
      onBack();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Left Side - Branding/Visual */}
        <div className="auth-visual">
          <div className="visual-overlay"></div>
          <div className="visual-content">
            <div className="auth-logo" onClick={onBack}>
              <Leaf fill="#2a4335" color="#2a4335" size={32} />
              <span>Planto</span>
            </div>
            <div className="visual-text">
              <h2>{forgotState !== 'none' ? "Reset Password" : isLogin ? "Welcome Back!" : "Join the Future of Farming."}</h2>
              <p>
                {forgotState !== 'none'
                  ? "Don't worry, it happens to the best of us. Let's get you back into your account securely."
                  : isLogin
                    ? "Sign in to access your farm diagnostics, crop health reports, and precision analytics."
                    : "Create an account to start optimizing your yields with AI-driven agricultural insights."}
              </p>
            </div>
            <div className="visual-footer">
              <p>© 2026 Planto Inc. All rights reserved.</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-side">
          <div className="form-wrapper">
            <div className="form-header">
              <button type="button" className="back-link" onClick={handleBackNavigation}>
                <ArrowRight className="rotate-180" size={16} />
                {forgotState !== 'none' ? "Back to Login" : showOTP ? "Back to Login" : "Back to Landing"}
              </button>
              <h1>
                {forgotState === 'request' ? "Forgot Password" :
                  forgotState === 'reset' ? "Create New Password" :
                    showOTP ? "Verify Login" :
                      isLogin ? "Sign In" : "Create Account"}
              </h1>
              <p>
                {forgotState === 'request' ? "Enter your email to receive a reset code" :
                  forgotState === 'reset' ? "Enter the 6-digit code and your new password" :
                    showOTP ? "Enter the 6-digit code sent to your email" :
                      isLogin ? "Enter your credentials to access your account" : "Sign up to start your green revolution today"}
              </p>
            </div>

            {error && (
              <div className="auth-error-alert">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="auth-error-alert" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                {successMsg}
              </div>
            )}

            {forgotState === 'request' ? (
              <form onSubmit={handleForgotPasswordRequest} className="auth-form">
                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={18} />
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Code"} <ArrowRight size={18} />
                </button>
              </form>
            ) : forgotState === 'reset' ? (
              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="form-group">
                  <label>Reset Code</label>
                  <div className="input-wrapper">
                    <KeyRound className="input-icon" size={18} />
                    <input
                      type="text"
                      placeholder="123456"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"} <ArrowRight size={18} />
                </button>
              </form>
            ) : showOTP ? (
              <form onSubmit={handleVerifyOTP} className="auth-form">
                <div className="form-group">
                  <label style={{ textAlign: 'center', display: 'block' }}>Verification Code</label>
                  <div className="otp-boxes" onPaste={handleOtpPaste}>
                    {otpDigits.map((d, i) => (
                      <input
                        key={i}
                        ref={el => otpRefs.current[i] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={e => handleOtpDigit(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        className="otp-box"
                        autoComplete="off"
                      />
                    ))}
                  </div>
                </div>
                <button type="submit" className="submit-btn" disabled={isLoading || otp.length < 6}>
                  {isLoading ? (
                    <span className="otp-verifying"><span className="otp-spinner" />Verifying...</span>
                  ) : (
                    <>Verify & Sign In <ArrowRight size={18} /></>
                  )}
                </button>
              </form>
            ) : (
              <>
                <div className="role-selector-container">
                  <div className={`role-option ${role === 'farmer' ? 'active' : ''}`} onClick={() => setRole('farmer')}>
                    <Leaf size={16} />
                    <span>Farmer</span>
                  </div>
                  <div className={`role-option ${role === 'agronomist' ? 'active' : ''}`} onClick={() => setRole('agronomist')}>
                    <Wand2 size={16} />
                    <span>Agronomist</span>
                  </div>
                  {isLogin && (
                    <div className={`role-option ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>
                      <ShieldCheck size={16} />
                      <span>Admin</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                  {!isLogin && (
                    <div className="form-group">
                      <label>Full Name</label>
                      <div className="input-wrapper">
                        <User className="input-icon" size={18} />
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                      <Mail className="input-icon" size={18} />
                      <input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="label-row">
                      <label>Password</label>
                      {isLogin && <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); setForgotState('request'); }}>Forgot?</a>}
                    </div>
                    <div className="input-wrapper">
                      <Lock className="input-icon" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="submit-btn" disabled={isLoading}>
                    {isLoading ? (
                      <>Authenticating...</>
                    ) : (
                      <>
                        {isLogin ? "Sign In" : "Create Account"}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {forgotState === 'none' && !showOTP && (
              <>
                <div className="divider">
                  <span>Or continue with</span>
                </div>

                <div className="social-btns">
                  <button type="button" className="social-btn" onClick={() => googleLogin()}>
                    <span>Google</span>
                  </button>
                  <button type="button" className="social-btn">
                    <span>GitHub</span>
                  </button>
                </div>

                <p className="switch-auth">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
