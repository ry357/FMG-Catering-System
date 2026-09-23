import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import logoImage from '../../assets/297896214_112620414877986_8856076360523925875_n.jpg';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm">
      {message}
    </div>
  );
}

export default function AuthCard({ onAuthenticated }) {
  const { loginWithGoogle } = useAuth();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const googleButtonRef = useRef(null);

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
          alt="FMG Catering Services logo"
          className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-[0_0_24px_-6px_rgba(190,149,67,0.6)]"
        />
        <h2 className="mt-4 font-display text-3xl font-semibold text-charcoal">
          Welcome
        </h2>
        <p className="text-sm text-charcoal-muted mt-1">
          Sign in with your Google account to book events and share your experience.
        </p>
      </div>

      <ErrorBox message={error} />

      {busy && (
        <div className="text-center py-4">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
          <p className="mt-2 text-sm text-charcoal-muted">Signing you in…</p>
        </div>
      )}

      {GOOGLE_CLIENT_ID ? (
        <div className="mt-4">
          <div ref={googleButtonRef} className="flex justify-center" />
        </div>
      ) : (
        <div className="mt-4 text-center text-sm text-charcoal-muted">
          Google Sign-In is not configured. Please contact the administrator.
        </div>
      )}
    </>
  );
}