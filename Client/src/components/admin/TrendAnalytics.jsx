import { useState, useEffect } from 'react';
import axios from 'axios';

const FOOD_GROUPS = [
  { key: 'foods', label: 'Food', badge: 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/30' },
  { key: 'sides', label: 'Side Dish', badge: 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/30' },
  { key: 'drinks', label: 'Drink', badge: 'bg-blue-400/10 text-blue-300 border border-blue-400/30' },
];

const PACKAGE_BADGE = 'bg-purple-400/10 text-purple-300 border border-purple-400/30';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const monthLabel = (key) => {
  const [y, m] = String(key || '').split('-');
  const name = MONTH_NAMES[Number(m) - 1];
  return name ? `${name} ${y}` : key;
};

const TrendBar = ({ label, value, max, barClass, countClass }) => {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0 text-sm text-slate-300 truncate" title={label}>{label}</div>
      <div className="flex-1 h-2.5 rounded-full bg-slate-700/40 overflow-hidden">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className={`w-12 shrink-0 text-right text-sm font-medium ${countClass}`}>
        {value}
      </div>
    </div>
  );
};

const EmptyHint = ({ text }) => (
  <p className="text-xs text-slate-500 py-4 text-center">{text}</p>
);

const Trendnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [packages, setPackages] = useState([]);
  const [services, setServices] = useState([]);
  const [bookingPeriods, setBookingPeriods] = useState({ peakPeriods: [], lowDemandPeriods: [] });
  const [leastPopular, setLeastPopular] = useState({ packages: [], foods: [], sides: [], drinks: [] });

  useEffect(() => {
    let cancelled = false;
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

    Promise.all([
      axios.get('/api/analytics/packages', { headers }),
      axios.get('/api/analytics/services', { headers }),
      axios.get('/api/analytics/booking-periods', { headers }),
      axios.get('/api/analytics/least-popular', { headers }),
    ])
      .then(([packagesRes, servicesRes, periodsRes, leastPopularRes]) => {
        if (cancelled) return;
        setPackages(packagesRes.data.data || []);
        setServices(servicesRes.data.data || []);
        setBookingPeriods(periodsRes.data.data || { peakPeriods: [], lowDemandPeriods: [] });
        setLeastPopular(leastPopularRes.data.data || { packages: [], foods: [], sides: [], drinks: [] });
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || 'Failed to load trends');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const topPackages = [...packages]
    .sort((a, b) => b.bookingsCount - a.bookingsCount)
    .slice(0, 6);
  const topPackagesMax = Math.max(1, ...topPackages.map((p) => p.bookingsCount));

  const topEvents = [...services]
    .sort((a, b) => b.bookingsCount - a.bookingsCount)
    .slice(0, 6);
  const topEventsMax = Math.max(1, ...topEvents.map((s) => s.bookingsCount));

  const packageTrend = [...leastPopular.packages]
    .filter((p) => p.bookingsCount > 0)
    .sort((a, b) => a.bookingsCount - b.bookingsCount);

  const foodTrends = FOOD_GROUPS.flatMap((group) =>
    (leastPopular[group.key] || [])
      .filter((item) => item.bookingsCount > 0)
      .map((item) => ({ ...item, label: group.label, badge: group.badge }))
  ).sort((a, b) => a.bookingsCount - b.bookingsCount);

  if (loading) {
    return (
      <div className="bg-[#101A2E] rounded-xl border border-[#1E2A45] shadow-[0_0_30px_-14px_rgba(34,211,238,0.2)] p-10 flex items-center justify-center text-cyan-300">
        <span className="inline-block w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mr-3" />
        Loading trends…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#101A2E] rounded-xl border border-[#1E2A45] p-6 text-sm text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-[#101A2E] rounded-xl border border-[#1E2A45] shadow-[0_0_30px_-14px_rgba(34,211,238,0.2)]">
      <div className="p-6 pb-4 border-b border-[#1E2A45]">
        <h2 className="font-display text-lg font-semibold bg-gradient-to-r from-cyan-300 via-white to-pink-400 bg-clip-text text-transparent">
          Trendnalytics
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Trend packages, trending events, and food trends — all in one view.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 p-6">
        <div className="bg-[#0B1220] rounded-xl border border-[#1E2A45] p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Trend Packages</h3>
          <p className="text-[11px] text-slate-400 mb-4">Most booked packages across confirmed events.</p>
          <div className="space-y-3">
            {topPackages.length === 0 && <EmptyHint text="No approved bookings yet." />}
            {topPackages.map((p, i) => (
              <TrendBar
                key={`${p.packageId}-${i}`}
                label={p.packageName}
                value={p.bookingsCount}
                max={topPackagesMax}
                barClass={i === 0 ? 'bg-gradient-to-r from-cyan-400 to-pink-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]' : 'bg-cyan-400/70'}
                countClass="text-cyan-300"
              />
            ))}
          </div>
        </div>

        <div className="bg-[#0B1220] rounded-xl border border-[#1E2A45] p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Event Trends</h3>
          <p className="text-[11px] text-slate-400 mb-4">Trending event types and booking demand periods.</p>
          <div className="space-y-3 mb-5">
            {topEvents.length === 0 && <EmptyHint text="No bookings recorded yet." />}
            {topEvents.map((s, i) => (
              <TrendBar
                key={`${s.service}-${i}`}
                label={s.service}
                value={s.bookingsCount}
                max={topEventsMax}
                barClass={i === 0 ? 'bg-gradient-to-r from-cyan-400 to-pink-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]' : 'bg-cyan-400/70'}
                countClass="text-cyan-300"
              />
            ))}
          </div>
          {(bookingPeriods.peakPeriods.length > 0 || bookingPeriods.lowDemandPeriods.length > 0) && (
            <div className="space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-emerald-300 mb-2">Peak demand</p>
                <div className="flex flex-wrap gap-2">
                  {bookingPeriods.peakPeriods.map((p) => (
                    <span key={p.month} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-400/10 text-emerald-300 border border-emerald-400/30">
                      {monthLabel(p.month)} · {p.bookingsCount}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Low demand</p>
                <div className="flex flex-wrap gap-2">
                  {bookingPeriods.lowDemandPeriods.map((p) => (
                    <span key={p.month} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-700/40 text-slate-300 border border-slate-500/30">
                      {monthLabel(p.month)} · {p.bookingsCount}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#0B1220] rounded-xl border border-[#1E2A45] p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Food Trends</h3>
          <p className="text-[11px] text-slate-400 mb-4">Least booked packages, foods, sides & drinks — ranked ascending.</p>
          <div className="space-y-2">
            {packageTrend.length === 0 && foodTrends.length === 0 && (
              <EmptyHint text="Menu picks will appear once bookings with menu items exist." />
            )}
            {packageTrend.map((p) => (
              <div key={p.packageName} className="flex items-center justify-between gap-3 border border-[#17233C] rounded-lg px-3 py-2 bg-[#0B1220]/60">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${PACKAGE_BADGE}`}>
                    Package
                  </span>
                  <span className="text-sm text-white truncate">{p.packageName}</span>
                </div>
                <span className="text-sm font-medium text-cyan-300 shrink-0">{p.bookingsCount}</span>
              </div>
            ))}
            {foodTrends.map((item) => (
              <div key={`${item.label}-${item.name}`} className="flex items-center justify-between gap-3 border border-[#17233C] rounded-lg px-3 py-2 bg-[#0B1220]/60">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${item.badge}`}>
                    {item.label}
                  </span>
                  <span className="text-sm text-white truncate">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-cyan-300 shrink-0">{item.bookingsCount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trendnalytics;