import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import SalesAnalyticsDashboard from '../components/admin/SalesAnalyticsDashboard';
import Trendnalytics from '../components/admin/TrendAnalytics';

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

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
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
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff',
    full_name: ''
  });

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
        googleDocsConfigRes
      ] = await Promise.all([
        axios.get('/api/users', authHeader()),
        axios.get('/api/reports', authHeader()),
        axios.get('/api/reports/monthly-summary', authHeader()),
        axios.get('/api/reports/google-docs/config', authHeader())
      ]);
      setUsers(usersRes.data.users);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'radial-gradient(900px 500px at 50% 0%, rgba(34,211,238,0.10), transparent 60%), #0B1220' }}>
        <div className="flex items-center gap-3 text-cyan-300">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          Loading…
        </div>
      </div>
    );
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
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-1 mb-6 border-b border-[#1E2A45]">
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
        </div>

        {activeTab === 'analytics' && (
          <SalesAnalyticsDashboard />
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl p-6 shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)]">
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
                        onClick={() => downloadReport(monthlySummary.report)}
                        className="text-sm bg-gold-500 text-white px-4 py-2 rounded hover:bg-gold-400 transition-colors"
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

            <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl p-6 shadow-[0_0_30px_-14px_rgba(34,211,238,0.2)]">
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
          <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl p-6 shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)]">
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
      </div>
    </div>
  );
};

export default AdminDashboard;