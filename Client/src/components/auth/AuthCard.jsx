import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import logoImage from '../../assets/297896214_112620414877986_8856076360523925875_n.jpg';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const MODES = { LOGIN: 'login', REGISTER: 'register', OTP: 'otp' };

const inputClass =
  'w-full px-4 py-3 bg-white border border-gold-200 text-charcoal placeholder:text-charcoal-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-transparent transition-all';

const goldButtonClass =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold-500 text-charcoal px-6 py-3 text-sm font-semibold shadow-[0_8px_20px_rgba(190,149,67,0.28)] hover:-translate-y-0.5 hover:bg-gold-600 hover:text-white hover:shadow-[0_12px_24px_rgba(190,149,67,0.36)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:pointer-events-none disabled:opacity-50';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal-light mb-2">{label}</label>
      {children}
    </div>
  );
}

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm">
      {message}
    </div>
  );
}

function InfoBox({ message }) {
  if (!message) return null;
  return (
    <div className="bg-gold-50 border border-gold-200 text-gold-700 px-4 py-3 rounded-xl text-sm">
      {message}
    </div>
  );
}

export default function AuthCard({ onAuthenticated }) {
  const {
    customerLogin,
    customerRegister,
    sendCustomerOtp,
    verifyCustomerOtp,
    loginWithGoogle,
  } = useAuth();

  const [mode, setMode] = useState(MODES.LOGIN);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpId, setOtpId] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const googleButtonRef = useRef(null);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setInfo('');
    setOtpId('');
    setOtp('');
    setConfirmPassword('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    if (mode === MODES.REGISTER) {
      const passwordPolicy = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;
      if (!passwordPolicy.test(password)) {
        setError('Password must be at least 8 characters and include letters, numbers, and a special character.');
        setBusy(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setBusy(false);
        return;
      }
    }
    try {
      if (mode === MODES.REGISTER) {
        await customerRegister(name, email, password);
      } else {
        await customerLogin(email, password);
      }
      onAuthenticated?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');
    try {
      const data = await sendCustomerOtp(email);
      setOtpId(data.otpId);
      setInfo(data.message || 'A verification code was sent to your email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send verification code.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await verifyCustomerOtp(otpId, otp);
      onAuthenticated?.();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Incorrect code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setBusy(true);
    setError('');
    try {
      await loginWithGoogle(credential);
      onAuthenticated?.();
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GOOGLE_CLIENT_ID]);

  const renderGoogleButton = () => {
    if (!window.google?.accounts?.id) return;
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

  return (
    <>
      <div className="text-center mb-8">
        <img
          src={logoImage}
          alt="FMG Catering logo"
          className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-[0_0_24px_-6px_rgba(190,149,67,0.6)]"
        />
        <h2 className="mt-4 font-display text-3xl font-semibold text-charcoal">
          {mode === MODES.REGISTER ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-sm text-charcoal-muted mt-1">
          {mode === MODES.REGISTER
            ? 'Set up your account to book and leave reviews.'
            : 'Log in to book events and share your experience.'}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl bg-gold-50 p-1 border border-gold-100">
        {[
          { key: MODES.LOGIN, label: 'Log in' },
          { key: MODES.REGISTER, label: 'Sign up' },
          { key: MODES.OTP, label: 'Email code' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => switchMode(tab.key)}
            className={`rounded-lg px-2 py-2 text-sm font-semibold transition-all ${
              mode === tab.key ? 'bg-gold-500 text-white shadow-sm' : 'text-charcoal-muted hover:text-gold-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ErrorBox message={error} />
      <InfoBox message={info} />

      {mode === MODES.OTP ? (
        otpId ? (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
            <Field label="Verification code">
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter the 6-digit code"
                className={`${inputClass} text-center tracking-[0.5em] text-lg font-semibold`}
                required
                maxLength={6}
              />
            </Field>
            <button type="submit" disabled={busy} className={goldButtonClass}>
              {busy ? 'Verifying...' : 'Log in'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpId('');
                setOtp('');
                setInfo('');
              }}
              className="w-full text-sm text-gold-700 hover:text-gold-800"
            >
              Use a different code
            </button>
          </form>
        ) : (
          <form onSubmit={handleSendOtp} className="mt-6 space-y-5">
            <Field label="Email address">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </Field>
            <button type="submit" disabled={busy} className={goldButtonClass}>
              {busy ? 'Sending...' : 'Send verification code'}
            </button>
            <p className="text-xs text-charcoal-muted text-center">
              We&rsquo;ll email you a one-time code. No password needed.
            </p>
          </form>
        )
      ) : (
        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
          {mode === MODES.REGISTER && (
            <Field label="Full name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                required
              />
            </Field>
          )}
          <Field label="Email address">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
              minLength={8}
              pattern="(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}"
              title="Must be at least 8 characters and include letters, numbers, and a special character"
            />
            {mode === MODES.REGISTER && (
              <p className="mt-2 text-xs text-charcoal-muted">
                Use at least 8 characters with a mix of letters, numbers, and a special character.
              </p>
            )}
          </Field>
          {mode === MODES.REGISTER && (
            <Field label="Confirm password">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                required
                minLength={8}
                pattern="(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}"
                title="Must match the password above"
              />
            </Field>
          )}
          <button type="submit" disabled={busy} className={goldButtonClass}>
            {busy
              ? 'Please wait...'
              : mode === MODES.REGISTER
                ? 'Create account'
                : 'Log in'}
          </button>
        </form>
      )}

      {GOOGLE_CLIENT_ID && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gold-200" />
            <span className="text-xs text-charcoal-muted uppercase tracking-wide">or</span>
            <div className="h-px flex-1 bg-gold-200" />
          </div>
          <div ref={googleButtonRef} className="flex justify-center"></div>
        </div>
      )}
    </>
  );
}