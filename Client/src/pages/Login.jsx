import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/297896214_112620414877986_8856076360523925875_n.jpg';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpId, setOtpId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpUsername, setOtpUsername] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, verifyOTP, sendOTP, adminGoogleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const googleButtonRef = useRef(null);

  const handleSuccessfulLogin = (user) => {
    const roleHome = user.role === 'admin' ? '/admin/dashboard' : '/booking-manager/dashboard';
    const intended = location.state?.from?.pathname;
    const isAllowed = user.role === 'admin'
      ? intended?.startsWith('/admin')
      : (intended?.startsWith('/staff') || intended?.startsWith('/booking-manager'));
    navigate(isAllowed && intended ? intended : roleHome);
  };

  const handleGoogleCredential = async (credential) => {
    setBusy(true);
    setError('');
    setResendMessage('');
    try {
      const data = await adminGoogleLogin(credential);
      if (data.requiresOtp) {
        setRequiresOtp(true);
        setOtpId(data.otpId);
        setOtpUsername(data.username || '');
        // OTP was already sent by the server via /admin-verify
      } else if (data.user) {
        handleSuccessfulLogin(data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (requiresOtp || !GOOGLE_CLIENT_ID) return;
    const scriptId = 'gsi-client-script';
    if (document.getElementById(scriptId)) {
      renderGoogleButton();
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = renderGoogleButton;
    document.body.appendChild(script);
  }, [requiresOtp, GOOGLE_CLIENT_ID]);

  const renderGoogleButton = () => {
    if (!window.google?.accounts?.id || !googleButtonRef.current) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => handleGoogleCredential(response.credential),
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'continue_with',
      shape: 'rectangular',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResendMessage('');
    setBusy(true);
    try {
      if (requiresOtp) {
        const data = await verifyOTP(otpId, otp);
        if (data.user) {
          handleSuccessfulLogin(data.user);
        }
      } else {
        const data = await login(username, password);
        if (data.requiresOtp) {
          setRequiresOtp(true);
          setOtpId(data.otpId);
          setOtpUsername(data.username || username);
        } else if (data.user) {
          handleSuccessfulLogin(data.user);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpUsername || resending) return;
    setResending(true);
    setResendMessage('');
    setError('');
    try {
      const res = await sendOTP(otpUsername);
      if (res?.otpId) setOtpId(res.otpId);
      setResendMessage('A new 6-digit verification code has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(1200px 560px at 85% -12%, rgba(34,211,238,0.12), transparent 60%), radial-gradient(1000px 520px at -5% 110%, rgba(255,45,120,0.09), transparent 55%), #0B1220',
      }}
    >
      <div className="w-full max-w-md">
        <div className="bg-[#101A2E] border border-[#1E2A45] rounded-2xl p-8 shadow-[0_0_35px_-10px_rgba(251,191,36,0.2)]">
          <div className="text-center mb-8">
            <img
              src={logoImage}
              alt="FMG Catering Services Logo"
              className="mx-auto h-20 w-20 rounded-2xl object-cover shadow-[0_0_24px_-4px_rgba(251,191,36,0.6)] border border-amber-400/40 transition-transform hover:scale-105"
            />
            <h2 className="mt-5 font-display text-2xl sm:text-3xl font-semibold text-white">
              {requiresOtp ? 'Security Verification' : 'Booking Manager & Admin Portal'}
            </h2>
            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
              {requiresOtp
                ? 'A 6-digit verification code has been sent to your registered email address.'
                : 'Sign in to manage bookings, sales, reports, and analytics'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 max-w-md mx-auto">
            {!requiresOtp ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  {GOOGLE_CLIENT_ID ? (
                    <div ref={googleButtonRef}></div>
                  ) : (
                    <p className="text-xs text-rose-400">Google Sign-In not configured.</p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">6-Digit Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter the 6-digit code"
                  className="w-full px-4 py-3 bg-[#0B1220] border border-[#1E2A45] text-white placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent transition-all tracking-widest text-center text-lg"
                  required
                  maxLength={6}
                />
              </div>
            )}

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {resendMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-lg text-sm text-center">
                {resendMessage}
              </div>
            )}

            {requiresOtp && (
              <button
                type="submit"
                disabled={busy}
                className={`w-full bg-gradient-to-r from-amber-500 to-amber-400 text-white py-3 rounded-lg font-semibold transition-all ${busy ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 hover:shadow-[0_0_24px_-6px_rgba(251,191,36,0.7)]'}`}
              >
                {busy ? 'Processing...' : 'Verify & Sign In'}
              </button>
            )}

            {requiresOtp && (
              <div className="flex items-center justify-between text-xs text-slate-400 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setRequiresOtp(false);
                    setOtp('');
                    setError('');
                    setResendMessage('');
                  }}
                  className="text-cyan-400 hover:underline"
                >
                  ← Back to Login
                </button>
                {otpUsername && (
                  <button
                    type="button"
                    disabled={resending}
                    onClick={handleResendOtp}
                    className="text-amber-400 hover:underline disabled:opacity-50"
                  >
                    {resending ? 'Sending...' : 'Resend Code'}
                  </button>
                )}
              </div>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">Authorized personnel only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;