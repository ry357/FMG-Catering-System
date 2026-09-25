import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import SalesAnalyticsDashboard from '../components/admin/SalesAnalyticsDashboard';
import Trendnalytics from '../components/admin/TrendAnalytics';
import BookingDetailModal from '../components/BookingDetailModal';
import { formatCurrency } from '../utils/helpers';
import DashboardSkeleton from '../components/ui/DashboardSkeleton';

const renderInline = (text) => {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index} className="font-bold text-gray-900" style={{ fontFamily: 'Cambria, Georgia, serif' }}>{part.slice(2, -2)}</strong>
      : part
  );
};

const isSeparatorRow = (line) => /^\s*\|[\s\:-]+\|\s*$/.test(line);

const parseCells = (row) =>
  row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());

const renderMarkdown = (md) => {
  const lines = String(md || '').split('\n');
  const elements = [];
  let pipeRun = [];

  const flushPipeRun = (key) => {
    if (!pipeRun.length) return;
    const rows = pipeRun;
    const isTable = rows.some(isSeparatorRow);
    if (isTable) {
      const header = parseCells(rows[0]);
      const body = rows.filter((r) => !isSeparatorRow(r)).slice(1).map(parseCells);
      elements.push(
        <table key={key} className="w-full mb-6 border-collapse font-serif" style={{ fontSize: '11pt' }}>
          <thead>
            <tr>
              {header.map((cell, i) => (
                <th key={i} className="text-left py-2 px-3 font-bold text-gray-900 border border-gray-600 bg-gray-100" style={{ fontFamily: 'Cambria, Georgia, serif' }}>{renderInline(cell)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((cells, j) => (
              <tr key={j}>
                {cells.map((cell, i) => (
                  <td key={i} className="py-2 px-3 text-gray-800 border border-gray-600">{renderInline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else {
      elements.push(<p key={key} className="mb-3 text-gray-800 leading-relaxed font-serif" style={{ fontSize: '11pt', textAlign: 'justify' }}>{rows.map(renderInline)}</p>);
    }
    pipeRun = [];
  };

  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (line.startsWith('|')) {
      pipeRun.push(line);
      return;
    }
    flushPipeRun(`table-${index}`);
    if (!line) return;
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={index} className="font-serif text-gray-900 mb-4 mt-2 pb-2 text-center" style={{ fontSize: '18pt', fontFamily: 'Cambria, Georgia, serif', fontWeight: 700 }}>
          {renderInline(line.slice(2))}
        </h2>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={index} className="font-serif text-gray-900 mb-3 mt-5 border-b border-gray-300 pb-1" style={{ fontSize: '14pt', fontFamily: 'Cambria, Georgia, serif', fontWeight: 700 }}>
          {renderInline(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      elements.push(
        <p key={index} className="mb-2 text-gray-800 font-serif pl-8 relative leading-relaxed" style={{ fontSize: '11pt' }}>
          <span className="absolute left-2 text-gray-700">&#8226;</span>
          {renderInline(line.slice(2))}
        </p>
      );
    } else if (line === '---') {
      elements.push(<hr key={index} className="my-6 border-t border-gray-400" />);
    } else if (line.startsWith('_') && line.endsWith('_')) {
      elements.push(
        <p key={index} className="text-gray-500 italic font-serif mb-2" style={{ fontSize: '9pt' }}>
          {renderInline(line.slice(1, -1))}
        </p>
      );
    } else {
      elements.push(
        <p key={index} className="mb-3 text-gray-800 leading-relaxed font-serif" style={{ fontSize: '11pt', textAlign: 'justify', textIndent: '0.5em' }}>
          {renderInline(line)}
        </p>
      );
    }
  });
  flushPipeRun('table-end');
  return elements;
};

const reportBadgeClass = (type) =>
  type === 'monthly_summary' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300';

const statusBadge = (status) => {
  const map = {
    pending: { label: 'Pending', cls: 'bg-amber-400/10 text-amber-300 border border-amber-400/30' },
    approved: { label: 'Approved', cls: 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/30' },
    rejected: { label: 'Rejected', cls: 'bg-red-400/10 text-red-300 border border-red-400/30' },
    completed: { label: 'Completed', cls: 'bg-blue-400/10 text-blue-300 border border-blue-400/30' },
  };
  const config = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${config.cls}`}>
      {config.label}
    </span>
  );
};

const paymentBadge = (status) => {
  const map = {
    pending: { label: 'Pending', cls: 'bg-slate-700/40 text-slate-300 border border-slate-500/30' },
    partial: { label: 'Balance Due', cls: 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/30' },
    full: { label: 'Fully Paid', cls: 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/30' },
    failed: { label: 'Failed', cls: 'bg-red-400/10 text-red-300 border border-red-400/30' },
  };
  const config = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${config.cls}`}>
      {config.label}
    </span>
  );
};

const BOOKING_STATUS_META = [
  { status: 'pending', label: 'Pending', dot: 'bg-amber-400', ring: 'border-amber-400/20' },
  { status: 'approved', label: 'Approved', dot: 'bg-emerald-400', ring: 'border-emerald-400/20' },
  { status: 'rejected', label: 'Rejected', dot: 'bg-red-400', ring: 'border-red-400/20' },
  { status: 'completed', label: 'Completed', dot: 'bg-blue-400', ring: 'border-blue-400/20' },
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reports, setReports] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [googleDocsConfigured, setGoogleDocsConfigured] = useState(false);
  const [googleDocsMethod, setGoogleDocsMethod] = useState(null);
  const [googleDoc, setGoogleDoc] = useState(null);
  const [googleDocBusy, setGoogleDocBusy] = useState(false);
  const [googleDocError, setGoogleDocError] = useState('');
  const [googleDocMessage, setGoogleDocMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff',
    full_name: ''
  });

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsCategory, setLogsCategory] = useState('all');
  const [logsSearch, setLogsSearch] = useState('');
  const [logsSearchInput, setLogsSearchInput] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchData = async () => {
    try {
      const [
        usersRes,
        reportListRes,
        monthlySummaryRes,
        googleDocsConfigRes,
        bookingsRes
      ] = await Promise.all([
        axios.get('/api/users', authHeader()),
        axios.get('/api/reports', authHeader()),
        axios.get('/api/reports/monthly-summary', authHeader()),
        axios.get('/api/reports/google-docs/config', authHeader()),
        axios.get('/api/bookings', authHeader())
      ]);
      setUsers(usersRes.data.users);
      setBookings(bookingsRes.data.bookings || []);
      setReports(reportListRes.data.reports || []);
      setMonthlySummary(monthlySummaryRes.data.data || null);
      setGoogleDocsConfigured(Boolean(googleDocsConfigRes.data.configured));
      setGoogleDocsMethod(googleDocsConfigRes.data.method || null);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async ({ page = 1, category = 'all', search = '' } = {}) => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 50, category, search });
      const res = await axios.get(`/api/activity-logs?${params}`, authHeader());
      setActivityLogs(res.data.logs || []);
      setLogsTotal(res.data.total || 0);
      setLogsPage(res.data.page || 1);
      setLogsTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleGenerateMonthly = async () => {
    setReportBusy(true);
    setGoogleDocError('');
    try {
      const response = await axios.post('/api/reports/monthly-summary', {}, authHeader());
      setGoogleDoc(response.data.googleDoc?.webViewLink || null);
      await fetchData();
    } catch (error) {
      console.error('Error generating monthly summary:', error);
      alert('Failed to generate monthly summary');
    } finally {
      setReportBusy(false);
    }
  };

  const handleUploadToGoogleDocs = async () => {
    if (!monthlySummary?.report?.id) return;
    setGoogleDocBusy(true);
    setGoogleDocError('');
    try {
      const response = await axios.post(`/api/reports/${monthlySummary.report.id}/google-doc`, {}, authHeader());
      setGoogleDoc(response.data.googleDoc?.webViewLink || null);
    } catch (error) {
      console.error('Upload to Google Docs error:', error);
      const code = error.response?.data?.code;
      const message =
        code === 'GOOGLE_NOT_CONFIGURED'
          ? 'Google Docs upload is not connected. Click "Connect Google Account" below to authorize it.'
          : error.response?.data?.error || 'Failed to upload report to Google Docs';
      setGoogleDocError(message);
    } finally {
      setGoogleDocBusy(false);
    }
  };

  const handleConnectGoogleDocs = async () => {
    setGoogleDocError('');
    try {
      const response = await axios.get('/api/reports/google-docs/auth-url', authHeader());
      if (response.data.message) {
        setGoogleDocMessage(response.data.message);
        return;
      }
      window.open(response.data.url, '_blank', 'noopener');
      setGoogleDocMessage(
        'Approve access in the new tab, then copy the token it shows and add it as GOOGLE_OAUTH_REFRESH_TOKEN in the Vercel server env vars, then redeploy.'
      );
    } catch (error) {
      setGoogleDocError(error.response?.data?.error || 'Failed to start Google connection');
    }
  };

  const downloadReport = async (report) => {
    try {
      const response = await axios.get(`/api/reports/${report.id}/download`, {
        ...authHeader(),
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const disposition = response.headers['content-disposition'];
      link.download = disposition
        ? disposition.match(/filename="([^"]+)"/)?.[1]
        : report?.file_path || `report-${report?.id || ''}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download report error:', error);
      alert('Failed to download report');
    }
  };

  const downloadDocx = async (report) => {
    try {
      const response = await axios.get(`/api/reports/${report.id}/download-docx`, {
        ...authHeader(),
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }));
      const link = document.createElement('a');
      link.href = url;
      const disposition = response.headers['content-disposition'];
      const baseName = (report?.file_path || `report-${report?.id || ''}`).replace(/\.md$/, '');
      link.download = disposition
        ? disposition.match(/filename="([^"]+)"/)?.[1]
        : `${baseName}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download docx error:', error);
      alert('Word document not found. Please click "Generate / Refresh" first to create it.');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/users', newUser, authHeader());
      setShowAddUser(false);
      setNewUser({ username: '', email: '', password: '', role: 'staff', full_name: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`/api/users/${userId}`, authHeader());
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await axios.patch(`/api/bookings/${bookingId}/status`, { status }, authHeader());
      const bookingsRes = await axios.get('/api/bookings', authHeader());
      setBookings(bookingsRes.data.bookings || []);
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking status');
    }
  };

  const groupedBookings = {
    pending: [],
    approved: [],
    rejected: [],
    completed: [],
  };
  (bookings || []).forEach((booking) => {
    const key = groupedBookings[booking.status] ? booking.status : 'pending';
    groupedBookings[key].push(booking);
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(1200px 560px at 85% -12%, rgba(34,211,238,0.12), transparent 60%), radial-gradient(1000px 520px at -5% 110%, rgba(255,45,120,0.09), transparent 55%), #0B1220',
      }}
    >
      <nav className="bg-[#0B1220]/95 backdrop-blur border-b border-[#1E2A45] sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 py-3.5 flex justify-between items-center">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-cyan-300 via-white to-pink-400 bg-clip-text text-transparent">
            FMG Catering · Admin
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Welcome, {user?.full_name}</span>
            <button
              onClick={logout}
              className="text-sm text-cyan-300 border border-cyan-400/40 px-3 py-1.5 rounded hover:bg-cyan-400/10 hover:shadow-[0_0_14px_-4px_rgba(34,211,238,0.7)] transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-4 py-5">
        <div className="flex gap-1 mb-4 border-b border-[#1E2A45]">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'bookings'
                ? 'text-cyan-300 border-b-2 border-cyan-400 -mb-px'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'text-cyan-300 border-b-2 border-cyan-400 -mb-px'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-cyan-300 border-b-2 border-cyan-400 -mb-px'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'reports'
                ? 'text-cyan-300 border-b-2 border-cyan-400 -mb-px'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab('trendnalytics')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'trendnalytics'
                ? 'text-cyan-300 border-b-2 border-cyan-400 -mb-px'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Trendnalytics
          </button>
          <button
            onClick={() => {
              setActiveTab('activity-logs');
              fetchActivityLogs({ page: 1, category: logsCategory, search: logsSearch });
            }}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'activity-logs'
                ? 'text-cyan-300 border-b-2 border-cyan-400 -mb-px'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Activity Logs
          </button>
        </div>

        {activeTab === 'analytics' && (
          <SalesAnalyticsDashboard />
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-5">
            <div className="rounded-xl border border-[#1E2A45] bg-[#101A2E] p-4 shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-white">Booking Status Overview</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    All bookings grouped by status — pending, approved, rejected, and completed
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {BOOKING_STATUS_META.map((meta) => (
                  <div key={meta.status} className="rounded-xl border border-[#1E2A45] bg-[#0B1220] p-4 text-center">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">{meta.label}</p>
                    <p className="text-2xl font-semibold text-white mt-1">{groupedBookings[meta.status].length}</p>
                  </div>
                ))}
              </div>
            </div>

            {BOOKING_STATUS_META.map((meta) => (
              <section
                key={meta.status}
                className={`rounded-xl border bg-[#101A2E] p-4 shadow-[0_0_40px_-12px_rgba(34,211,238,0.2)] ${meta.ring}`}
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E2A45]">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                    <h3 className="text-base font-semibold text-white">
                      {meta.label} <span className="text-slate-500 font-normal">({groupedBookings[meta.status].length})</span>
                    </h3>
                  </div>
                </div>

                {groupedBookings[meta.status].length === 0 ? (
                  <p className="text-slate-500 text-center py-8 text-sm">
                    No {meta.label.toLowerCase()} bookings.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-slate-200">
                      <thead>
                        <tr className="border-b border-[#1E2A45]">
                          <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Event Date</th>
                          <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Client</th>
                          <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Event Type</th>
                          <th className="text-right py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Guests</th>
                          <th className="text-right py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Budget</th>
                          <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Payment</th>
                          <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Status</th>
                          <th className="text-right py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedBookings[meta.status].map((booking) => (
                          <tr
                            key={booking.id}
                            className="border-b border-[#17233C] hover:bg-cyan-400/5 align-top cursor-pointer"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <td className="py-3 px-4 whitespace-nowrap text-white font-medium">
                              {new Date(booking.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-white font-medium">{booking.customer_name}</p>
                              <p className="text-[11px] text-slate-500">{booking.customer_email}</p>
                              <p className="text-[11px] text-slate-500">{booking.customer_phone}</p>
                            </td>
                            <td className="py-3 px-4 text-slate-300">{booking.event_type}</td>
                            <td className="py-3 px-4 text-right text-slate-300 tabular-nums">
                              {booking.number_of_guests?.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-cyan-300 tabular-nums">
                              {booking.budget ? formatCurrency(booking.budget) : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1.5">
                                <div>{paymentBadge(booking.payment_status)}</div>
                                <p className="text-[11px] text-slate-500 capitalize">
                                  {booking.payment_type === 'down_payment' ? 'Down Payment' : 'Full Payment'}
                                  {booking.payment_type === 'down_payment' && booking.down_payment_amount
                                    ? ` · ${formatCurrency(booking.down_payment_amount)}`
                                    : ''}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4">{statusBadge(booking.status)}</td>
                            <td className="py-3 px-4 text-right">
                              {booking.status === 'pending' && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); updateBookingStatus(booking.id, 'approved'); }}
                                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/20 transition cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); updateBookingStatus(booking.id, 'rejected'); }}
                                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-400/10 text-red-300 border border-red-400/30 hover:bg-red-400/20 transition cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}
                              {booking.status === 'approved' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateBookingStatus(booking.id, 'completed'); }}
                                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-400/10 text-blue-300 border border-blue-400/30 hover:bg-blue-400/20 transition cursor-pointer"
                                >
                                  Mark Complete
                                </button>
                              )}
                              {booking.status === 'completed' && (
                                <select
                                  defaultValue="completed"
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => { e.stopPropagation(); updateBookingStatus(booking.id, e.target.value); }}
                                  className="appearance-none bg-[#101A2E] border border-[#1E2A45] text-white text-xs font-medium pl-2.5 pr-6 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400/60 cursor-pointer bg-no-repeat"
                                  style={{
                                    backgroundImage:
                                      "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2322D3EE%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')",
                                    backgroundPosition: 'right 0.5rem center',
                                  }}
                                >
                                  <option value="completed">Completed</option>
                                  <option value="approved">Reopen · Approved</option>
                                  <option value="pending">Back to Pending</option>
                                  <option value="rejected">Mark Rejected</option>
                                </select>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl p-4 shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)]">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold text-white">Monthly Summary Report</h2>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-400/10 text-emerald-300 border border-emerald-400/30">
                      Automated
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    A summary of the month's happenings with a rule-based conclusion. Generated
                    automatically at the start of each month, or refresh it manually below.
                  </p>
                </div>
                <button
                  onClick={handleGenerateMonthly}
                  disabled={reportBusy}
                  className="text-sm border border-gold-400/60 text-gold-300 px-4 py-2 rounded hover:bg-gold-400/10 disabled:opacity-50 transition-all"
                >
                  {reportBusy ? 'Generating...' : 'Generate / Refresh'}
                </button>
              </div>

              {monthlySummary && monthlySummary.markdown ? (
                <div className="border border-[#2A3A5C] rounded shadow-2xl mx-auto" style={{ maxWidth: '816px', fontFamily: 'Cambria, Georgia, serif', background: '#fff' }}>
                  <div className="px-20 py-16">
                    {renderMarkdown(monthlySummary.markdown)}
                  </div>
                  <div className="border-t border-gray-200 px-8 py-3 bg-gray-50">
                    <div className="flex flex-wrap items-center gap-4">
                      <button
                        onClick={() => downloadDocx(monthlySummary.report)}
                        className="text-sm bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                      >
                        <span>📄</span> Download Word (.docx)
                      </button>
                      <button
                        onClick={() => downloadReport(monthlySummary.report)}
                        className="text-xs border border-slate-500/60 text-slate-400 px-3 py-1.5 rounded hover:bg-slate-700/40 transition-all"
                      >
                        Download (.md)
                      </button>
                      <button
                        onClick={handleUploadToGoogleDocs}
                        disabled={googleDocBusy}
                        className="text-sm border border-cyan-400/60 text-cyan-300 px-4 py-2 rounded hover:bg-cyan-400/10 disabled:opacity-50 transition-all"
                      >
                        {googleDocBusy ? 'Uploading to Google Docs...' : 'Upload to Google Docs'}
                      </button>
                      {googleDoc && (
                        <a
                          href={googleDoc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-cyan-300 hover:text-cyan-100 underline"
                        >
                          Open in Google Docs →
                        </a>
                      )}
                      <span className="text-xs text-gray-500">
                        Generated {new Date(monthlySummary.report.created_at).toLocaleString()} ·{' '}
                        {monthlySummary.report.generated_by_name || 'Automated'}
                      </span>
                    </div>
                    {!googleDocsConfigured && (
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <button
                          onClick={handleConnectGoogleDocs}
                          className="text-xs border border-red-400/60 text-red-300 px-3 py-1.5 rounded hover:bg-red-400/10 transition-all"
                        >
                          Connect Google Account (OAuth)
                        </button>
                        <span className="text-xs text-amber-300">
                          Google Docs upload is not connected yet. Connect it to auto-upload reports as Word docs.
                        </span>
                      </div>
                    )}
                    {googleDocsConfigured && (
                      <p className="text-xs text-emerald-300 mt-2">
                        Connected via {googleDocsMethod === 'oauth' ? 'Google account (OAuth)' : 'service account'} —
                        reports auto-upload to Google Docs.
                      </p>
                    )}
                    {googleDocMessage && (
                      <p className="text-xs text-cyan-300 mt-2">{googleDocMessage}</p>
                    )}
                    {googleDocError && (
                      <p className="text-xs text-red-300 mt-2">{googleDocError}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-[#2A3A5C] rounded-xl p-10 text-center text-slate-500 text-sm">
                  No monthly summary has been generated yet.
                  <br />
                  Click &quot;Generate / Refresh&quot; to create the latest report.
                </div>
              )}
            </div>

            <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl p-4 shadow-[0_0_30px_-14px_rgba(34,211,238,0.2)]">
              <h2 className="text-base font-semibold text-white mb-1">All Reports</h2>
              <p className="text-xs text-slate-400 mb-4">
                Daily, weekly, monthly, and annual reports plus automated monthly summaries.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-200">
                  <thead>
                    <tr className="border-b border-[#1E2A45]">
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500">Type</th>
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500">Period</th>
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500">Generated By</th>
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500">Created</th>
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 text-sm">
                          No reports generated yet.
                        </td>
                      </tr>
                    ) : (
                      reports.map((r) => (
                        <tr key={r.id} className="border-b border-[#17233C] hover:bg-cyan-400/5">
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${reportBadgeClass(r.report_type)}`}>
                              {r.report_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">{r.report_date}</td>
                          <td className="py-2.5 px-4">{r.generated_by_name || 'Automated'}</td>
                          <td className="py-2.5 px-4">{new Date(r.created_at).toLocaleString()}</td>
                          <td className="py-2.5 px-4">
                            <button
                              onClick={() => downloadReport(r)}
                              className="text-cyan-300 hover:text-cyan-100 text-sm font-medium"
                            >
                              Download
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trendnalytics' && (
          <Trendnalytics />
        )}

        {activeTab === 'users' && (
          <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl p-4 shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-semibold text-white">User Management</h2>
              <button
                onClick={() => setShowAddUser(true)}
                className="text-sm bg-gold-500 text-white px-4 py-2 rounded hover:bg-gold-400 transition-colors"
              >
                Add User
              </button>
            </div>

            {showAddUser && (
              <div className="mb-6 p-4 bg-[#0B1220]/60 border border-[#1E2A45] rounded-xl">
                <h3 className="font-medium text-white mb-4">Add New User</h3>
                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                    className="px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white placeholder:text-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white placeholder:text-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white placeholder:text-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white placeholder:text-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    required
                  />
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-400 text-sm transition-colors"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddUser(false)}
                      className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500 text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-200">
                <thead>
                  <tr className="border-b border-[#1E2A45]">
                    <th className="text-left py-2.5 px-4 font-medium text-slate-500">Name</th>
                    <th className="text-left py-2.5 px-4 font-medium text-slate-500">Username</th>
                    <th className="text-left py-2.5 px-4 font-medium text-slate-500">Email</th>
                    <th className="text-left py-2.5 px-4 font-medium text-slate-500">Role</th>
                    <th className="text-left py-2.5 px-4 font-medium text-slate-500">Created</th>
                    <th className="text-left py-2.5 px-4 font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-[#17233C] hover:bg-cyan-400/5">
                      <td className="py-2.5 px-4">{u.full_name}</td>
                      <td className="py-2.5 px-4">{u.username}</td>
                      <td className="py-2.5 px-4">{u.email}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          u.role === 'admin' ? 'bg-purple-400/10 text-purple-300 border border-purple-400/30' : 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/30'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-300 hover:text-red-100 text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'activity-logs' && (() => {
          const CATEGORIES = [
            { key: 'all',      label: 'All',       color: 'text-slate-300  border-slate-500/40  bg-slate-700/30' },
            { key: 'bookings', label: 'Bookings',  color: 'text-cyan-300   border-cyan-400/40   bg-cyan-400/10' },
            { key: 'sales',    label: 'Sales',     color: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10' },
            { key: 'users',    label: 'Users',     color: 'text-purple-300 border-purple-400/40 bg-purple-400/10' },
            { key: 'auth',     label: 'Auth',      color: 'text-amber-300  border-amber-400/40  bg-amber-400/10' },
            { key: 'system',   label: 'System',    color: 'text-slate-400  border-slate-600/40  bg-slate-800/30' },
          ];

          const ACTION_ICONS = {
            booking_created:      '📋',
            booking_status_updated: '🔄',
            booking_deleted:      '🗑️',
            sale_recorded:        '💰',
            sale_status_updated:  '💳',
            user_created:         '👤',
            user_deleted:         '🚫',
            user_login:           '🔑',
          };

          const catMeta = (cat) => CATEGORIES.find((c) => c.key === cat) || CATEGORIES[0];

          const fmtDate = (iso) => {
            const d = new Date(iso);
            return isNaN(d) ? iso : d.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
          };

          return (
            <div className="space-y-4">
              {/* Header */}
              <div className="rounded-xl border border-[#1E2A45] bg-[#101A2E] p-4 shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)]">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">Activity Logs</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Audit trail of all admin, staff, and system actions — {logsTotal.toLocaleString()} total records
                    </p>
                  </div>
                  <button
                    onClick={() => fetchActivityLogs({ page: logsPage, category: logsCategory, search: logsSearch })}
                    disabled={logsLoading}
                    className="text-xs border border-cyan-400/40 text-cyan-300 px-3 py-1.5 rounded hover:bg-cyan-400/10 disabled:opacity-50 transition-all"
                  >
                    {logsLoading ? 'Refreshing…' : '⟳ Refresh'}
                  </button>
                </div>

                {/* Category filter pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => {
                        setLogsCategory(cat.key);
                        setLogsPage(1);
                        fetchActivityLogs({ page: 1, category: cat.key, search: logsSearch });
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                        logsCategory === cat.key
                          ? cat.color
                          : 'text-slate-500 border-slate-700 bg-transparent hover:text-slate-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setLogsSearch(logsSearchInput);
                    setLogsPage(1);
                    fetchActivityLogs({ page: 1, category: logsCategory, search: logsSearchInput });
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={logsSearchInput}
                    onChange={(e) => setLogsSearchInput(e.target.value)}
                    placeholder="Search by description, user, or action…"
                    className="flex-1 px-3 py-2 bg-[#0B1220] border border-[#1E2A45] text-white text-xs placeholder:text-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 text-xs bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 rounded hover:bg-cyan-400/20 transition-all"
                  >
                    Search
                  </button>
                  {logsSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogsSearchInput('');
                        setLogsSearch('');
                        setLogsPage(1);
                        fetchActivityLogs({ page: 1, category: logsCategory, search: '' });
                      }}
                      className="px-3 py-2 text-xs bg-slate-700/30 border border-slate-600/40 text-slate-400 rounded hover:bg-slate-700/60 transition-all"
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>

              {/* Logs table */}
              <div className="rounded-xl border border-[#1E2A45] bg-[#101A2E] overflow-hidden shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)]">
                {logsLoading ? (
                  <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mr-3" />
                    Loading activity logs…
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                    <span className="text-3xl mb-3">📭</span>
                    <p className="text-sm">No activity logs found.</p>
                    {logsSearch && <p className="text-xs mt-1">Try clearing the search filter.</p>}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#1E2A45]">
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 w-8"></th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Description</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Category</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Performed By</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityLogs.map((log) => {
                          const cm = catMeta(log.category);
                          return (
                            <tr key={log.id} className="border-b border-[#17233C] hover:bg-cyan-400/5 transition-colors">
                              <td className="py-3 px-4 text-lg">
                                {ACTION_ICONS[log.action] || '📌'}
                              </td>
                              <td className="py-3 px-4 text-slate-200 max-w-xs lg:max-w-md">
                                <p className="text-xs leading-relaxed">{log.description}</p>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cm.color}`}>
                                  {log.category}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-xs text-slate-400 font-mono">{log.performed_by || '—'}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-xs text-slate-500 whitespace-nowrap">{fmtDate(log.created_at)}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {logsTotalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-[#1E2A45]">
                    <span className="text-xs text-slate-500">
                      Page {logsPage} of {logsTotalPages} · {logsTotal.toLocaleString()} records
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const p = Math.max(1, logsPage - 1);
                          setLogsPage(p);
                          fetchActivityLogs({ page: p, category: logsCategory, search: logsSearch });
                        }}
                        disabled={logsPage <= 1 || logsLoading}
                        className="px-3 py-1 text-xs border border-[#1E2A45] text-slate-400 rounded hover:bg-slate-700/40 disabled:opacity-40 transition-all"
                      >
                        ← Prev
                      </button>
                      <button
                        onClick={() => {
                          const p = Math.min(logsTotalPages, logsPage + 1);
                          setLogsPage(p);
                          fetchActivityLogs({ page: p, category: logsCategory, search: logsSearch });
                        }}
                        disabled={logsPage >= logsTotalPages || logsLoading}
                        className="px-3 py-1 text-xs border border-[#1E2A45] text-slate-400 rounded hover:bg-slate-700/40 disabled:opacity-40 transition-all"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;