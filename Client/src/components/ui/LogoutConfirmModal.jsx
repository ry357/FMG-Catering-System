import { useEffect } from 'react';

export default function LogoutConfirmModal({
  open,
  onClose,
  onConfirm,
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

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </div>

        <h3 id="logout-confirm-title" className="text-lg font-bold text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
