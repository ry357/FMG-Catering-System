import { useEffect, useState } from 'react';

// Returns a counter that increments every `intervalMs` while the tab is visible,
// and immediately when the user returns to the tab. Add it to a data-fetching
// effect's dependency list to keep dashboards up to date without manual reloads.
// Polling is used because the API runs on serverless functions (no websockets).
export default function useLiveRefresh(intervalMs = 10000) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => {
      if (document.visibilityState === 'visible') setTick((t) => t + 1);
    };
    const id = setInterval(bump, intervalMs);
    document.addEventListener('visibilitychange', bump);
    window.addEventListener('focus', bump);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', bump);
      window.removeEventListener('focus', bump);
    };
  }, [intervalMs]);

  return tick;
}
