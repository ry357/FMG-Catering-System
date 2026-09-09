import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal({ isOpen, onClose, redirectTo = '/book' }) {
  const { customer, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    if (customer) {
      navigate(redirectTo);
      onClose();
    }
  }, [isOpen, customer, navigate, redirectTo, onClose]);

  useEffect(() => {
    if (!isOpen || customer) return;

    const initGoogle = () => {
      if (initializedRef.current) return;

      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        setAuthError('Google Client ID is not configured.');
        return;
      }

      const init = () => {
        if (!window.google || !window.google.accounts) return;
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (buttonRef.current) {
            window.google.accounts.id.renderButton(buttonRef.current, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              type: 'standard',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
            });
          }
          initializedRef.current = true;
        } catch (err) {
          setAuthError('Failed to initialize Google Sign-In.');
        }
      };

      if (window.google && window.google.accounts) {
        init();
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = init;
        script.onerror = () => setAuthError('Failed to load Google Sign-In.');
        document.head.appendChild(script);
      }
    };

    initGoogle();

    return () => {
      initializedRef.current = false;
    };
  }, [isOpen, customer]);

  const handleCredentialResponse = async (response) => {
    try {
      setLoading(true);
      setAuthError(null);
      await loginWithGoogle(response.credential);
      navigate(redirectTo);
      onClose();
    } catch (err) {
      setAuthError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-charcoal/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Sign in to book">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-elevated" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-charcoal-light transition hover:bg-gray-100 hover:text-charcoal" aria-label="Close">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center">
          <h3 className="font-display text-2xl font-semibold text-charcoal">Sign in to Book</h3>
          <p className="mt-2 text-sm text-charcoal-muted">Sign in with Google to proceed with your booking</p>
        </div>

        {authError && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
            {authError}
          </div>
        )}

        {loading && (
          <div className="mt-6 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold-300 border-t-gold-500" />
          </div>
        )}

        <div ref={buttonRef} className="mt-6 flex justify-center" />
      </div>
    </div>
  );
}
