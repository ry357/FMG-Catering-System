export default function Skeleton({ className = '', dark = false, variant = 'default' }) {
  const getBgClass = () => {
    if (dark || variant === 'dark') return 'bg-slate-700/40';
    if (variant === 'gold') return 'bg-gold-200/70';
    if (variant === 'warm') return 'bg-amber-100/60';
    return 'bg-slate-200';
  };

  return (
    <div
      className={`animate-pulse rounded ${getBgClass()} ${className}`}
      aria-hidden="true"
    />
  );
}