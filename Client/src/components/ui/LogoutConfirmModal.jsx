import { useEffect } from 'react';

/**
 * LogoutConfirmModal
 * Supports two distinct design variants:
 *  - "client": Elegant white background with warm charcoal text, subtle gold border, gold icon & red confirm button.
 *  - "dashboard": Dark navy backdrop (#101A2E), cyan border (#1E2A45), cyan glowing icon, matching Admin & Booking Manager theme.
 */
export default function LogoutConfirmModal({
  open,
  onClose,
  onConfirm,
  variant = 'dashboard', // 'client' | 'dashboard'
  title = 'Log Out',
  message = 'Are you sure you want to log out of your account?',
  confirmText = 'Yes, Log Out',
  cancelText = 'Cancel',
}) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isClient = variant === 'client';

  return (
    <div
      className={`fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${
        isClient ? 'bg-charcoal/50' : 'bg-black/70'
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
    >
      <div
        className={`relative w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center transition-all ${
          isClient
            ? 'bg-white border border-gold-200 text-charcoal'
            : 'bg-[#101A2E] border border-[#1E2A45] shadow-[0_0_35px_-10px_rgba(34,211,238,0.3)] text-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close "X" button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            isClient
              ? 'bg-gold-50 text-charcoal hover:bg-gold-100'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
            isClient
              ? 'bg-gold-50 border border-gold-200 text-gold-700'
              : 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_-3px_rgba(34,211,238,0.5)]'
          }`}
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </div>

        {/* Title */}
        <h3
          id="logout-confirm-title"
          className={`text-xl font-bold mb-2 ${
            isClient ? 'font-display text-charcoal' : 'text-white'
          }`}
        >
          {title}
        </h3>

        {/* Message */}
        <p
          className={`text-sm mb-6 leading-relaxed ${
            isClient ? 'text-charcoal-light' : 'text-slate-300'
          }`}
        >
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              isClient
                ? 'bg-cream text-charcoal hover:bg-gold-100 border border-gold-200'
                : 'bg-[#0B1220] text-slate-300 hover:bg-[#1E2A45] hover:text-white border border-[#1E2A45]'
            }`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isClient
                ? 'bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/30'
                : 'bg-rose-600 hover:bg-rose-500 shadow-[0_0_20px_-3px_rgba(244,63,94,0.6)]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
