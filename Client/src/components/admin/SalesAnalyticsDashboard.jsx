import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ReferenceLine,
} from 'recharts';

const PESO = (value) => `₱${Number(value || 0).toLocaleString(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})}`;

const PESO_CENTS = (value) => `₱${Number(value || 0).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const COMPACT = (value) => {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1000) return `₱${(n / 1000).toFixed(1)}k`;
  return `₱${n}`;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const fullMonthLabel = (key) => {
  const [y, m] = String(key || '').split('-');
  const name = MONTH_NAMES[Number(m) - 1];
  return name ? `${name} ${y}` : key;
};

const MOCK_MONTHLY = [
  { month: '2026-01', label: 'Jan', revenue: 42000, foodCost: 18000, events: 4 },
  { month: '2026-02', label: 'Feb', revenue: 58000, foodCost: 24500, events: 5 },
  { month: '2026-03', label: 'Mar', revenue: 46500, foodCost: 19500, events: 4 },
  { month: '2026-04', label: 'Apr', revenue: 72000, foodCost: 30500, events: 6 },
  { month: '2026-05', label: 'May', revenue: 93500, foodCost: 39800, events: 8 },
  { month: '2026-06', label: 'Jun', revenue: 128000, foodCost: 54400, events: 11 },
  { month: '2026-07', label: 'Jul', revenue: 88000, foodCost: 37400, events: 7 },
  { month: '2026-08', label: 'Aug', revenue: 32000, foodCost: 13600, events: 3 },
  { month: '2026-09', label: 'Sep', revenue: 76000, foodCost: 32300, events: 6 },
  { month: '2026-10', label: 'Oct', revenue: 104500, foodCost: 44400, events: 9 },
  { month: '2026-11', label: 'Nov', revenue: 139000, foodCost: 59100, events: 12 },
  { month: '2026-12', label: 'Dec', revenue: 212000, foodCost: 90100, events: 15 },
];

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

// ---- Icons (inline, stroke-based) ----
const Icon = ({ path, className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {path}
  </svg>
);

const icons = {
  revenue: <Icon path={<><circle cx="12" cy="12" r="9" /><path d="M14.5 8.5h-4a1.5 1.5 0 0 0 0 3h3a1.5 1.5 0 0 1 0 3h-5" /><path d="M12 6.5v11" /></>} />,
  avg: <Icon path={<><path d="M3 21h18" /><path d="M5 21V10" /><path d="M12 21V5" /><path d="M19 21V8" /><path d="M12 8m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" /></>} />,
  cogs: <Icon path={<><path d="m7.5 4.3 2.6.6.6 2.4" /><path d="m16.5 19.7-2.6-.6-.6-2.4" /><path d="M11 5.2 8.3 2.8" /><path d="m16 18.8 2.7 2.4" /><path d="M14 3.5l2 .4" /><path d="m9 20.5-2-.4" /><path d="M5 13h14" /><path d="M8 9v4" /><path d="m11 8-.8 1.4" /><path d="m13 16 .8-1.4" /></>} />,
  events: <Icon path={<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4" /><path d="M16 3v4" /><path d="M3 9h18" /><path d="m9 15 2 2 4-4" /></>} />,
};

const TrendBadge = ({ value, invert = false, className = '' }) => {
  if (value === null || value === undefined) {
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-700/50 text-slate-400 ${className}`}>Baseline</span>;
  }
  const isGood = invert ? value <= 0 : value >= 0;
  const arrow = value >= 0 ? '▲' : '▼';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
        isGood ? 'bg-emerald-400/10 text-emerald-300' : 'bg-red-400/10 text-red-300'
      } ${className}`}
    >
      {arrow} {Math.abs(value)}% {value >= 0 ? 'vs prev' : 'vs prev'}
    </span>
  );
};

const Skeleton = () => (
  <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="bg-[#101A2E] rounded-xl border border-[#1E2A45] p-5 h-32">
        <div className="w-1/2 h-3 bg-slate-700/50 rounded mb-4" />
        <div className="w-2/3 h-7 bg-slate-700/40 rounded" />
      </div>
    ))}
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#0B1220] text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-cyan-400/30">
      <p className="font-semibold mb-1 text-cyan-300">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color || entry.stroke }} />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-medium">{PESO_CENTS(entry.value)}</span>
        </p>
      ))}
    </div>
  );
};

const KpiCard = ({ icon, title, value, trend, invert, note }) => (
  <div className="bg-[#101A2E] rounded-xl border border-[#1E2A45] p-5 flex flex-col gap-3 shadow-[0_0_28px_-14px_rgba(34,211,238,0.25)] hover:border-cyan-400/40 hover:shadow-[0_0_34px_-10px_rgba(34,211,238,0.4)] transition-all">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-400/10 text-cyan-300 shrink-0">{icon}</span>
        <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</h3>
      </div>
    </div>
    <div>
      <p className="font-display text-[28px] leading-none font-semibold text-white">{value}</p>
      <div className="mt-2.5 flex items-center gap-2">
        <TrendBadge value={trend} invert={invert} />
        {note && <span className="text-[11px] text-slate-500">{note}</span>}
      </div>
    </div>
  </div>
);

const PipelineFunnel = ({ data }) => {
  const total = data.reduce((sum, s) => sum + s.count, 0);
  const max = Math.max(...data.map((s) => s.count), 1);
  const widthFor = (count) => (count === 0 ? 0 : Math.max(14, (count / max) * 100));

  return (
    <div className="space-y-3 pt-1">
      {data.map((stage, i) => {
        const conversion = i === 0 ? 100 : data[i - 1].count === 0 ? 0 : Math.round((stage.count / data[i - 1].count) * 100);
        return (
          <div key={stage.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-medium text-slate-200">{stage.label}</span>
              <span className="text-[13px] font-semibold text-white">
                {stage.count} <span className="text-slate-500 font-normal text-[11px]">( {(stage.count / total) * 100 || 0}% )</span>
              </span>
            </div>
            <div className="h-9 rounded-lg overflow-hidden border border-white/5" style={{ width: `${widthFor(stage.count)}%` }}>
              <div
                className="h-full flex items-center justify-end px-2.5 text-[11px] font-semibold text-white transition-all"
                style={{
                  background:
                    stage.key === 'pending'
                      ? 'linear-gradient(90deg, rgba(100,116,139,0.6), #64748B)'
                      : stage.key === 'approved'
                        ? 'linear-gradient(90deg, rgba(34,211,238,0.4), #22D3EE)'
                        : 'linear-gradient(90deg, rgba(255,45,120,0.4), #FF2D78)',
                  boxShadow: `0 0 14px -4px ${stage.key === 'approved' ? 'rgba(34,211,238,0.6)' : stage.key === 'completed' ? 'rgba(255,45,120,0.6)' : 'rgba(100,116,139,0.5)'}`,
                }}
              >
                {stage.count > 0 && <span>{conversion}%</span>}
              </div>
            </div>
          </div>
        );
      })}
      {total === 0 && (
        <p className="text-xs text-slate-500 py-4 text-center">No bookings in the selected range yet.</p>
      )}
    </div>
  );
};

const paymentBadge = (status) => {
  const map = {
    full: { label: 'Fully Paid', cls: 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/30' },
    partial: { label: 'Balance Due', cls: 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/30' },
    pending: { label: 'Pending', cls: 'bg-slate-700/40 text-slate-300 border border-slate-500/30' },
    failed: { label: 'Failed', cls: 'bg-red-400/10 text-red-300 border border-red-400/30' },
  };
  const config = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${config.cls}`}>
      {config.label}
    </span>
  );
};

const SalesAnalyticsDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [months, setMonths] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    axios
      .get('/api/analytics/sales-dashboard', { ...authHeader(), params: { month: selectedMonth } })
      .then((res) => {
        if (cancelled) return;
        setData(res.data.data);
        setMonths(res.data.data.months || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || 'Failed to load analytics');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);

  const kpis = data?.kpis;
  const hasActivity = useMemo(() => {
    if (!data) return false;
    return (
      kpis.totalBookedEvents > 0 ||
      data.monthly.some((m) => m.revenue > 0 || m.foodCost > 0)
    );
  }, [data, kpis]);

  const monthlyLineData = useMemo(() => [...MOCK_MONTHLY], []);

  const peakPoint = useMemo(() => {
    if (!monthlyLineData.length) return null;
    let best = null;
    let maxVal = -Infinity;
    monthlyLineData.forEach((d) => {
      const v = Number(d.revenue) || 0;
      if (v > maxVal) {
        maxVal = v;
        best = { label: d.label, value: v };
      }
    });
    return maxVal > 0 ? best : null;
  }, [monthlyLineData]);

  const leftmostLabel = monthlyLineData[0]?.label || null;

  const peakSeasonLabel = (v) =>
    peakPoint && Number(v) === peakPoint.value ? 'Peak Season' : '';
  const salesDot = ({ cx, cy, payload }) =>
    cx == null ? null : (
      <circle
        cx={cx}
        cy={cy}
        r={peakPoint && Number(payload.revenue) === peakPoint.value ? 7 : 3.5}
        fill={peakPoint && Number(payload.revenue) === peakPoint.value ? '#FF2D78' : '#22D3EE'}
        stroke={peakPoint && Number(payload.revenue) === peakPoint.value ? '#fff' : 'none'}
        strokeWidth={2}
        style={
          peakPoint && Number(payload.revenue) === peakPoint.value
            ? { filter: 'drop-shadow(0 0 6px rgba(255,45,120,0.95))' }
            : undefined
        }
      />
    );

  const leastPopularRows = useMemo(() => {
    if (!leastPopular) return [];
    return LEASY_POPULAR_GROUP.flatMap((group) =>
      (leastPopular[group.key] || []).map((item) => ({
        category: group.label,
        badge: group.badge,
        name: item.packageName || item.name,
        bookingsCount: item.bookingsCount,
      }))
    );
  }, [leastPopular]);

  const rangeLabel = data?.range?.label || fullMonthLabel(selectedMonth);

  return (
    <div className="space-y-6 bg-[#0B1220] rounded-2xl border border-[#1E2A45] p-6 shadow-[0_0_50px_-18px_rgba(34,211,238,0.35)]">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-4 bg-[#0B1220]/95 backdrop-blur border-b border-[#1E2A45] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">Sales Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {data ? `${data.range.label} · ${data.range.start} to ${data.range.end}` : 'Loading range…'}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <span>Event month</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="appearance-none bg-[#101A2E] border border-[#1E2A45] text-white text-sm font-medium pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/60 cursor-pointer bg-no-repeat"
            style={{
              backgroundImage:
                "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2322D3EE%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')",
              backgroundPosition: 'right 0.75rem center',
            }}
          >
            {months.length === 0 && (
              <option value={selectedMonth}>{fullMonthLabel(selectedMonth)}</option>
            )}
            {months.map((m) => (
              <option key={m.month} value={m.month}>
                {fullMonthLabel(m.month)}
                {m.events > 0 ? ` (${m.events} ${m.events === 1 ? 'booking' : 'bookings'})` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <Skeleton />
      ) : error ? (
        <div className="bg-red-400/10 border border-red-400/30 text-red-300 text-sm rounded-xl p-6">{error}</div>
      ) : (
        <>
          {/* KPI cards */}
          {kpis && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <KpiCard
                icon={icons.revenue}
                title="Total Catering Revenue"
                value={PESO(kpis.totalRevenue)}
                trend={kpis.trends.totalRevenue}
              />
              <KpiCard
                icon={icons.avg}
                title="Average Event Value"
                value={PESO(kpis.avgEventValue)}
                trend={kpis.trends.avgEventValue}
              />
              <KpiCard
                icon={icons.events}
                title="Total Booked Events"
                value={kpis.totalBookedEvents.toLocaleString()}
                trend={kpis.trends.totalBookedEvents}
              />
            </div>
          )}

          {/* Middle charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div
                className="lg:col-span-2 rounded-xl border border-[#1C2A44] p-6 shadow-[0_0_40px_-12px_rgba(34,211,238,0.35)] relative overflow-hidden"
                style={{
                  background:
                    'radial-gradient(900px 450px at 85% -15%, rgba(34,211,238,0.16), transparent 60%), radial-gradient(700px 400px at 0% 110%, rgba(255,45,120,0.10), transparent 55%), #0B1220',
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-white">
                      Monthly Sales Performance
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Illustrative sample · Jan–Dec jagged seasonal trend (slow Jan · wedding surge Jun · dip Aug · peak Dec) highlighted as Peak Season</p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 shrink-0 text-[11px] font-semibold tracking-wide uppercase text-cyan-300 border border-cyan-400/30 bg-cyan-400/10 rounded-full px-3 py-1">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#22D3EE', boxShadow: '0 0 8px #22D3EE' }} />
                    Sample Data · Jagged Trend
                  </span>
                </div>
              {hasActivity ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyLineData} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E2A45" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#2A3A5C' }} tick={{ fontSize: 12, fill: '#8FA3BF' }} interval={0} />
                      <YAxis tickFormatter={COMPACT} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#8FA3BF' }} width={64} />
                      <Tooltip content={<ChartTooltip />} />
                      {peakPoint && leftmostLabel && (
                        <ReferenceLine
                          segment={[
                            { x: peakPoint.label, y: peakPoint.value },
                            { x: leftmostLabel, y: peakPoint.value },
                          ]}
                          stroke="#22D3EE"
                          strokeOpacity={0.75}
                          strokeDasharray="2 5"
                          strokeWidth={1.5}
                          style={{ filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.8))' }}
                          label={{
                            value: PESO(peakPoint.value),
                            position: 'insideBottomLeft',
                            fill: '#22D3EE',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        />
                      )}
                      <Legend
                        iconType="plainline"
                        formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                      />
                      <Line
                        type="linear"
                        dot={salesDot}
                        activeDot={{ r: 5 }}
                        dataKey="revenue"
                        name="Monthly Revenue"
                        stroke="#22D3EE"
                        strokeWidth={2.5}
                        style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.7))' }}
                      >
                        <LabelList
                          dataKey="revenue"
                          position="top"
                          formatter={peakSeasonLabel}
                          style={{ fontSize: 12, fontWeight: 800, fill: '#FF2D78', filter: 'drop-shadow(0 0 4px rgba(255,45,120,0.9))' }}
                        />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">
                  No recorded sales activity for the last 12 months.
                </div>
              )}
            </div>

            <div className="bg-[#101A2E] rounded-xl border border-[#1E2A45] p-6 shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)]">
              <h3 className="font-display text-lg font-semibold text-white mb-1">Booking Pipeline</h3>
              <p className="text-xs text-slate-400 mb-5">Inquiries → Confirmed → Closed Won · {rangeLabel}</p>
              <PipelineFunnel data={data.pipeline} />
            </div>
          </div>

          {/* Upcoming high-value events */}
          <div className="bg-[#101A2E] rounded-xl border border-[#1E2A45] shadow-[0_0_30px_-14px_rgba(34,211,238,0.2)]">
            <div className="p-6 pb-3 flex flex-wrap items-start justify-between gap-3 border-b border-[#1E2A45]">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Upcoming High-Value Events</h3>
                <p className="text-xs text-slate-400 mt-0.5">Booked events in the selected range, ranked by invoice value</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-6 font-medium">Event Date</th>
                    <th className="py-3 px-6 font-medium">Client / Event</th>
                    <th className="py-3 px-6 font-medium">Event Type</th>
                    <th className="py-3 px-6 font-medium text-right">Guests</th>
                    <th className="py-3 px-6 font-medium text-right">Invoice Value</th>
                    <th className="py-3 px-6 font-medium">Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.upcomingEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500 text-sm">
                        No upcoming events in the selected range.
                      </td>
                    </tr>
                  ) : (
                    data.upcomingEvents.map((ev) => (
                      <tr key={ev.bookingId} className="border-t border-[#17233C] hover:bg-cyan-400/5">
                        <td className="py-3.5 px-6 whitespace-nowrap text-white font-medium">
                          {new Date(`${ev.eventDate}T00:00:00`).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-6">
                          <p className="text-white font-medium">{ev.customerName}</p>
                          <p className="text-[11px] text-slate-500">{ev.bookingRef || `Booking #${ev.bookingId}`}</p>
                        </td>
                        <td className="py-3.5 px-6 text-slate-300">{ev.eventType}</td>
                        <td className="py-3.5 px-6 text-right text-slate-300">{ev.guests.toLocaleString()}</td>
                        <td className="py-3.5 px-6 text-right font-semibold text-cyan-300">{PESO(ev.invoiceValue)}</td>
                        <td className="py-3.5 px-6">{paymentBadge(ev.paymentStatus)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesAnalyticsDashboard;