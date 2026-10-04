import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpId, setOtpId] = useState('');
  const [otp, setOtp] = useState('');
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
    try {
      const data = await adminGoogleLogin(credential);
      if (data.requiresOtp) {
        setRequiresOtp(true);
        setOtpId(data.otpId);
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
    setBusy(true);
    try {
      if (requiresOtp) {
        const data = await verifyOTP(otpId, otp);
        handleSuccessfulLogin(data.user);
      } else {
        const data = await login(username, password);
        if (data.requiresOtp) {
          setRequiresOtp(true);
          setOtpId(data.otpId);
        } else {
          handleSuccessfulLogin(data.user);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
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
      <div className="w-full max-w-5xl">
        <nav className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-cyan-300 via-white to-pink-400 bg-clip-text text-transparent">
            FMG Catering · Portal
          </h1>
          <Link
            to="/"
            className="text-sm text-cyan-300 border border-cyan-400/40 px-3 py-1.5 rounded hover:bg-cyan-400/10 hover:shadow-[0_0_14px_-4px_rgba(34,211,238,0.7)] transition-all"
          >
            ← Back to site
          </Link>
        </nav>

        <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl p-8 shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)]">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-gold-600 text-white font-display text-2xl font-bold shadow-[0_0_24px_-6px_rgba(251,191,36,0.6)]">
              FMG
            </div>
            <h2 className="mt-4 font-display text-3xl font-semibold text-white">
              {requiresOtp ? 'Admin Verification' : 'Booking Manager & Admin Portal'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {requiresOtp
                ? 'An email with a verification code has been sent to the admin address.'
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
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setRequiresOtp(false)}
                  className="text-sm text-cyan-400 hover:underline"
                >
                  ← Back to Login
                </button>
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