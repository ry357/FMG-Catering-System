import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const authHeader = () => ({
  headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
});

const PESO = (value) =>
  `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? String(iso).slice(0, 10)
    : d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const SEGMENTS = {
  returning: { label: 'Returning', cls: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30' },
  new: { label: 'New', cls: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/30' },
  no_bookings: { label: 'No bookings', cls: 'bg-slate-700/40 text-slate-300 border-slate-500/30' },
};

const BOOKING_STATUS = {
  pending: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  approved: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
  rejected: 'bg-red-400/10 text-red-300 border-red-400/30',
  completed: 'bg-blue-400/10 text-blue-300 border-blue-400/30',
};

const Badge = ({ cls, children }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
    {children}
  </span>
);

const COLUMNS = [
  { key: 'name', label: 'Customer' },
  { key: 'bookings_count', label: 'Bookings', align: 'right' },
  { key: 'total_spent', label: 'Total Spent', align: 'right' },
  { key: 'last_event_date', label: 'Last Event', align: 'right' },
  { key: 'segment', label: 'Segment' },
];

const escapeCsv = (value) => {
  const str = String(value ?? '');
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export default function CustomerDirectory() {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('all');
  const [sort, setSort] = useState({ key: 'last_event_date', dir: 'desc' });

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/customers', authHeader());
        setCustomers(res.data.customers || []);
        setSummary(res.data.summary || null);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load customers');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    axios
      .get(`/api/customers/${selectedId}`, authHeader())
      .then((res) => setDetail(res.data))
      .catch(() => setDetail({ error: 'Failed to load booking history' }))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return undefined;
    const onKey = (e) => e.key === 'Escape' && setSelectedId(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedId]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = customers.filter((c) => {
      if (segment !== 'all' && c.segment !== segment) return false;
      if (!term) return true;
      return [c.name, c.email, c.phone].some((v) => String(v || '').toLowerCase().includes(term));
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // nulls always last
      if (bv == null) return -1;
      if (typeof av === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [customers, search, segment, sort]);

  const toggleSort = (key) =>
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }));

  const exportCsv = () => {
    const header = ['Name', 'Email', 'Phone', 'Address', 'Bookings', 'Completed Bookings', 'Total Spent (PHP)', 'Last Event Date', 'Segment', 'Customer Since'];
    const rows = visible.map((c) => [
      c.name,
      c.email,
      c.phone,
      c.address,
      c.bookings_count,
      c.completed_count,
      c.total_spent.toFixed(2),
      c.last_event_date || '',
      SEGMENTS[c.segment]?.label || c.segment,
      c.created_at ? String(c.created_at).slice(0, 10) : '',
    ]);
    const csv = [header, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\r\n');
    // BOM so Excel opens the ₱/accents correctly
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fmg-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="rounded-xl border border-[#1E2A45] bg-[#101A2E] p-8 text-center text-sm text-slate-400">Loading customers…</div>;
  }
  if (error) {
    return <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-6 text-sm text-red-300">{error}</div>;
  }

  const stats = [
    { label: 'Total Customers', value: summary?.total ?? 0 },
    { label: 'Returning (2+ bookings)', value: summary?.returning ?? 0 },
    { label: 'New (1 booking)', value: summary?.new ?? 0 },
    { label: 'Lifetime Revenue', value: PESO(summary?.lifetimeRevenue) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-[#1E2A45] bg-[#101A2E] p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className="mt-1 text-xl font-semibold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#1E2A45] bg-[#101A2E] p-4 shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Customer Directory</h2>
            <p className="mt-0.5 text-xs text-slate-400">Click a customer to view their booking history.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="w-56 rounded border border-[#2A3A5C] bg-[#0B1220] px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="rounded border border-[#2A3A5C] bg-[#0B1220] px-3 py-1.5 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
            >
              <option value="all">All segments</option>
              <option value="returning">Returning</option>
              <option value="new">New</option>
              <option value="no_bookings">No bookings</option>
            </select>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!visible.length}
              className="rounded border border-gold-400/60 px-3 py-1.5 text-sm text-gold-300 transition-all hover:bg-gold-400/10 disabled:opacity-40"
            >
              Export CSV ({visible.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2A45] text-left text-[11px] uppercase tracking-wider text-slate-400">
                {COLUMNS.map((col) => (
                  <th key={col.key} className={`px-3 py-2 font-medium ${col.align === 'right' ? 'text-right' : ''}`}>
                    <button type="button" onClick={() => toggleSort(col.key)} className="inline-flex items-center gap-1 hover:text-white">
                      {col.label}
                      {sort.key === col.key && <span className="text-cyan-300">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-slate-500">No customers match your filters.</td>
                </tr>
              )}
              {visible.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="cursor-pointer border-b border-[#1E2A45]/60 transition-colors hover:bg-cyan-400/5"
                >
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-white">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.email}</p>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-200">{c.bookings_count}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-gold-300">{PESO(c.total_spent)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{formatDate(c.last_event_date)}</td>
                  <td className="px-3 py-2.5">
                    <Badge cls={SEGMENTS[c.segment]?.cls}>{SEGMENTS[c.segment]?.label}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setSelectedId(null)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Customer booking history"
            onClick={(e) => e.stopPropagation()}
            className="h-full w-full max-w-2xl overflow-y-auto border-l border-[#1E2A45] bg-[#0B1220] p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Customer</p>
                <h3 className="text-xl font-semibold text-white">{detail?.customer?.name || '…'}</h3>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} aria-label="Close" className="text-2xl leading-none text-slate-400 hover:text-white">×</button>
            </div>

            {detailLoading && <p className="text-sm text-slate-400">Loading booking history…</p>}
            {detail?.error && <p className="text-sm text-red-300">{detail.error}</p>}

            {detail?.customer && !detailLoading && (
              <>
                <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-[#1E2A45] bg-[#101A2E] p-3">
                    <p className="text-[11px] uppercase text-slate-400">Email</p>
                    <p className="break-all text-slate-200">{detail.customer.email || '—'}</p>
                  </div>
                  <div className="rounded-lg border border-[#1E2A45] bg-[#101A2E] p-3">
                    <p className="text-[11px] uppercase text-slate-400">Phone</p>
                    <p className="text-slate-200">{detail.customer.phone || '—'}</p>
                  </div>
                  <div className="rounded-lg border border-[#1E2A45] bg-[#101A2E] p-3">
                    <p className="text-[11px] uppercase text-slate-400">Total Spent</p>
                    <p className="font-semibold text-gold-300">{PESO(detail.customer.total_spent)}</p>
                  </div>
                  <div className="rounded-lg border border-[#1E2A45] bg-[#101A2E] p-3">
                    <p className="text-[11px] uppercase text-slate-400">Customer Since</p>
                    <p className="text-slate-200">{formatDate(detail.customer.created_at)}</p>
                  </div>
                  {detail.customer.address && (
                    <div className="col-span-2 rounded-lg border border-[#1E2A45] bg-[#101A2E] p-3">
                      <p className="text-[11px] uppercase text-slate-400">Address</p>
                      <p className="text-slate-200">{detail.customer.address}</p>
                    </div>
                  )}
                </div>

                <h4 className="mb-3 text-sm font-semibold text-white">
                  Booking History <span className="font-normal text-slate-400">({detail.bookings.length})</span>
                </h4>

                {detail.bookings.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[#2A3A5C] p-6 text-center text-sm text-slate-500">
                    This customer has an account but hasn&rsquo;t booked yet.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {detail.bookings.map((b) => (
                      <li key={b.id} className="rounded-lg border border-[#1E2A45] bg-[#101A2E] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-white">{b.event_type || 'Event'}</p>
                            <p className="text-xs text-slate-400">
                              {b.booking_ref || `#${b.id}`} · {formatDate(b.event_date)} · {b.number_of_guests} guests
                            </p>
                          </div>
                          <Badge cls={BOOKING_STATUS[b.status] || BOOKING_STATUS.pending}>{b.status}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-300">
                          <span>Package: <span className="text-slate-200">{b.preferred_package || 'Custom'}</span></span>
                          <span>Total: <span className="text-slate-200">{PESO(b.total_amount)}</span></span>
                          <span>Paid: <span className="text-gold-300">{PESO(b.amount_paid)}</span></span>
                          {b.total_amount > b.amount_paid && b.status !== 'rejected' && (
                            <span className="text-amber-300">Balance: {PESO(b.total_amount - b.amount_paid)}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
