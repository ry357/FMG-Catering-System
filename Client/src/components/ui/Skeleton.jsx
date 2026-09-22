export default function Skeleton({ className = '', dark = false }) {
  return (
    <div
      className={`animate-pulse rounded ${dark ? 'bg-slate-700/40' : 'bg-slate-200'} ${className}`}
      aria-hidden="true"
    />
  );
}