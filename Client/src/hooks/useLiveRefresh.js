import { useEffect, useState } from 'react';

// Broadcast channel & storage event helper to notify all open tabs immediately
// when a booking or client update occurs, without waiting for the next polling interval.
export function notifyLiveUpdate() {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('fmg_catering_sync');
      channel.postMessage({ type: 'update', timestamp: Date.now() });
      channel.close();
    }
  } catch {
    // ignore
  }
  try {
    localStorage.setItem('fmg_sync_tick', Date.now().toString());
  } catch {
    // ignore
  }
}

// Returns a counter that increments every `intervalMs` while the tab is visible,
// immediately on tab focus/visibility change, and instantly whenever any tab
// calls notifyLiveUpdate(). Add it to a data-fetching effect's dependency list
// to keep dashboards up to date without manual reloads.
export default function useLiveRefresh(intervalMs = 10000) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => {
      if (document.visibilityState === 'visible') setTick((t) => t + 1);
    };
    const id = setInterval(bump, intervalMs);
    document.addEventListener('visibilitychange', bump);
    window.addEventListener('focus', bump);

    let channel;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('fmg_catering_sync');
        channel.onmessage = () => {
          setTick((t) => t + 1);
        };
      }
    } catch {
      // ignore
    }

    const onStorage = (e) => {
      if (e.key === 'fmg_sync_tick') {
        setTick((t) => t + 1);
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', bump);
      window.removeEventListener('focus', bump);
      window.removeEventListener('storage', onStorage);
      if (channel) channel.close();
    };
  }, [intervalMs]);

  return tick;
}
