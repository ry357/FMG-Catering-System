import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const MONTH_LABELS = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

const formatMonth = (monthKey) => {
  if (!monthKey) return monthKey;
  const [year, month] = monthKey.split('-');
  return `${MONTH_LABELS[month] || month} ${year}`;
};

const EmptyChart = () => (
  <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
    No data available yet
  </div>
);

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
  type === 'monthly_summary' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sales, setSales] = useState([]);
  const [analytics, setAnalytics] = useState({
    overview: null,
    revenue: [],
    packages: [],
    services: [],
    bookingPeriods: { byMonth: [] },
    leastPopular: { packages: [], foods: [], sides: [], drinks: [] },
  });
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
        bookingsRes,
        salesRes,
        overviewRes,
        revenueRes,
        packagesRes,
        servicesRes,
        periodsRes,
        leastPopularRes,
        reportListRes,
        monthlySummaryRes,
        googleDocsConfigRes
      ] = await Promise.all([
        axios.get('/api/users', authHeader()),
        axios.get('/api/bookings', authHeader()),
        axios.get('/api/sales', authHeader()),
        axios.get('/api/analytics/overview', authHeader()),
        axios.get('/api/analytics/revenue', authHeader()),
        axios.get('/api/analytics/packages', authHeader()),
        axios.get('/api/analytics/services', authHeader()),
        axios.get('/api/analytics/booking-periods', authHeader()),
        axios.get('/api/analytics/least-popular', authHeader()),
        axios.get('/api/reports', authHeader()),
        axios.get('/api/reports/monthly-summary', authHeader()),
        axios.get('/api/reports/google-docs/config', authHeader())
      ]);
      setUsers(usersRes.data.users);
      setBookings(bookingsRes.data.bookings);
      setSales(salesRes.data.sales);
      setAnalytics({
        overview: overviewRes.data.data,
        revenue: revenueRes.data.data,
        packages: packagesRes.data.data,
        services: servicesRes.data.data,
        bookingPeriods: periodsRes.data.data,
        leastPopular: leastPopularRes.data.data,
      });
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

  const overview = analytics.overview || {};

  const totalRevenue = overview.totalRevenue ??
    sales
      .filter(s => s.payment_status === 'completed')
      .reduce((sum, s) => sum + parseFloat(s.amount), 0);

  // Sales count per month (all recorded sales)
  const salesByMonth = {};
  sales.forEach(s => {
    const key = s.sale_date ? String(s.sale_date).slice(0, 7) : 'unknown';
    if (key === 'unknown') return;
    salesByMonth[key] = (salesByMonth[key] || 0) + 1;
  });
  const salesMonths = Object.keys(salesByMonth).sort();

  const revenueChartData = {
    labels: analytics.revenue.map(r => formatMonth(r.month)),
    datasets: [{
      label: 'Revenue (₱)',
      data: analytics.revenue.map(r => r.revenue),
      borderColor: '#D97706',
      backgroundColor: 'rgba(217, 119, 6, 0.15)',
      fill: true,
      tension: 0.3,
    }]
  };

  const salesChartData = {
    labels: salesMonths.map(formatMonth),
    datasets: [{
      label: 'Sales',
      data: salesMonths.map(m => salesByMonth[m]),
      backgroundColor: '#F59E0B',
      borderRadius: 4,
    }]
  };

  const bookingStatusData = {
    labels: ['Pending', 'Approved', 'Rejected', 'Completed'],
    datasets: [{
      data: [
        overview.pendingBookings ?? bookings.filter(b => b.status === 'pending').length,
        overview.approvedBookings ?? bookings.filter(b => b.status === 'approved').length,
        overview.rejectedBookings ?? bookings.filter(b => b.status === 'rejected').length,
        overview.completedBookings ?? bookings.filter(b => b.status === 'completed').length,
      ],
      backgroundColor: ['#FCD34D', '#34D399', '#F87171', '#60A5FA'],
    }]
  };

  const topPackages = analytics.packages.slice(0, 5).reverse();
  const packageChartData = {
    labels: topPackages.map(p => p.packageName),
    datasets: [{
      label: 'Bookings',
      data: topPackages.map(p => p.bookingsCount),
      backgroundColor: '#D97706',
      borderRadius: 4,
    }]
  };

  const topServices = analytics.services.slice(0, 5);
  const servicesChartData = {
    labels: topServices.map(s => s.service),
    datasets: [{
      data: topServices.map(s => s.bookingsCount),
      backgroundColor: ['#FCD34D', '#F59E0B', '#D97706', '#B45309', '#92400E'],
    }]
  };

  const demandByMonth = analytics.bookingPeriods.byMonth || [];
  const demandChartData = {
    labels: demandByMonth.map(p => formatMonth(p.month)),
    datasets: [{
      label: 'Bookings',
      data: demandByMonth.map(p => p.bookingsCount),
      borderColor: '#92400E',
      backgroundColor: 'rgba(146, 64, 14, 0.15)',
      fill: true,
      tension: 0.3,
    }]
  };

  const leastPopularGroups = [
    { key: 'packages', label: 'Package', badgeClass: 'bg-purple-100 text-purple-800' },
    { key: 'foods', label: 'Food', badgeClass: 'bg-amber-100 text-amber-800' },
    { key: 'sides', label: 'Side Dish', badgeClass: 'bg-green-100 text-green-800' },
    { key: 'drinks', label: 'Drink', badgeClass: 'bg-blue-100 text-blue-800' },
  ];

  const leastPopularRows = leastPopularGroups.flatMap(group =>
    (analytics.leastPopular[group.key] || []).map(item => ({
      category: group.label,
      badgeClass: group.badgeClass,
      name: item.packageName || item.name,
      bookingsCount: item.bookingsCount,
    }))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-900">FMG Catering · Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Welcome, {user?.full_name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Revenue</h3>
            <p className="text-2xl font-semibold text-gray-900 mt-2">₱{Number(totalRevenue).toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Bookings</h3>
            <p className="text-2xl font-semibold text-gray-900 mt-2">{overview.totalBookings ?? bookings.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Sales</h3>
            <p className="text-2xl font-semibold text-gray-900 mt-2">{overview.totalSales ?? sales.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Customers</h3>
            <p className="text-2xl font-semibold text-gray-900 mt-2">{overview.totalCustomers ?? '-'}</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 text-sm font-medium ${
              activeTab === 'analytics'
                ? 'text-gray-900 border-b-2 border-gold-500 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-sm font-medium ${
              activeTab === 'users'
                ? 'text-gray-900 border-b-2 border-gold-500 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 text-sm font-medium ${
              activeTab === 'reports'
                ? 'text-gray-900 border-b-2 border-gold-500 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Reports
          </button>
        </div>

        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend</h2>
                {analytics.revenue.length > 0 ? (
                  <div className="h-64">
                    <Line data={revenueChartData} options={{ maintainAspectRatio: false }} />
                  </div>
                ) : <EmptyChart />}
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Sales Per Month</h2>
                {salesMonths.length > 0 ? (
                  <div className="h-64">
                    <Bar data={salesChartData} options={{ maintainAspectRatio: false }} />
                  </div>
                ) : <EmptyChart />}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Booking Status Distribution</h2>
                <div className="h-64">
                  <Doughnut data={bookingStatusData} />
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Top Services by Event Type</h2>
                {topServices.length > 0 ? (
                  <div className="h-64">
                    <Doughnut data={servicesChartData} />
                  </div>
                ) : <EmptyChart />}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Most Popular Packages</h2>
                {topPackages.length > 0 ? (
                  <div className="h-64">
                    <Bar
                      data={packageChartData}
                      options={{ maintainAspectRatio: false, indexAxis: 'y' }}
                    />
                  </div>
                ) : <EmptyChart />}
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Booking Demand by Month</h2>
                {demandByMonth.length > 0 ? (
                  <div className="h-64">
                    <Line data={demandChartData} options={{ maintainAspectRatio: false }} />
                  </div>
                ) : <EmptyChart />}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="mb-2">
                <h2 className="text-sm font-semibold text-gray-700">Least Popular Menu Items</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Packages, foods, side dishes, and drinks ranked from least to most booked.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">Category</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">Item</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">Times Booked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leastPopularRows.map((item, index) => (
                      <tr key={`${item.category}-${item.name}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.badgeClass}`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">{item.name}</td>
                        <td className="py-2.5 px-4">
                          <span className={`font-medium ${item.bookingsCount === 0 ? 'text-gray-400' : 'text-gray-800'}`}>
                            {item.bookingsCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-gray-700">Monthly Summary Report</h2>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      Automated
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    A summary of the month's happenings with a rule-based conclusion. Generated
                    automatically at the start of each month, or refresh it manually below.
                  </p>
                </div>
                <button
                  onClick={handleGenerateMonthly}
                  disabled={reportBusy}
                  className="text-sm border border-gold-500 text-gold-700 px-4 py-2 rounded hover:bg-gold-50 disabled:opacity-50"
                >
                  {reportBusy ? 'Generating...' : 'Generate / Refresh'}
                </button>
              </div>

              {monthlySummary && monthlySummary.markdown ? (
                <div className="border border-gray-300 rounded shadow-lg mx-auto" style={{ maxWidth: '816px', fontFamily: 'Cambria, Georgia, serif', background: '#fff' }}>
                  <div className="px-20 py-16">
                    {renderMarkdown(monthlySummary.markdown)}
                  </div>
                  <div className="border-t border-gray-200 px-8 py-3 bg-gray-50">
                    <div className="flex flex-wrap items-center gap-4">
                      <button
                        onClick={() => downloadReport(monthlySummary.report)}
                        className="text-sm bg-gold-600 text-white px-4 py-2 rounded hover:bg-gold-700"
                      >
                        Download (.md)
                      </button>
                      <button
                        onClick={handleUploadToGoogleDocs}
                        disabled={googleDocBusy}
                        className="text-sm border border-blue-500 text-blue-600 px-4 py-2 rounded hover:bg-blue-50 disabled:opacity-50"
                      >
                        {googleDocBusy ? 'Uploading to Google Docs...' : 'Upload to Google Docs'}
                      </button>
                      {googleDoc && (
                        <a
                          href={googleDoc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
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
                          className="text-xs border border-red-400 text-red-600 px-3 py-1.5 rounded hover:bg-red-50"
                        >
                          Connect Google Account (OAuth)
                        </button>
                        <span className="text-xs text-amber-600">
                          Google Docs upload is not connected yet. Connect it to auto-upload reports as Word docs.
                        </span>
                      </div>
                    )}
                    {googleDocsConfigured && (
                      <p className="text-xs text-green-600 mt-2">
                        Connected via {googleDocsMethod === 'oauth' ? 'Google account (OAuth)' : 'service account'} —
                        reports auto-upload to Google Docs.
                      </p>
                    )}
                    {googleDocMessage && (
                      <p className="text-xs text-blue-600 mt-2">{googleDocMessage}</p>
                    )}
                    {googleDocError && (
                      <p className="text-xs text-red-600 mt-2">{googleDocError}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-400 text-sm">
                  No monthly summary has been generated yet.
                  <br />
                  Click &quot;Generate / Refresh&quot; to create the latest report.
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-1">All Reports</h2>
              <p className="text-xs text-gray-500 mb-4">
                Daily, weekly, monthly, and annual reports plus automated monthly summaries.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">Type</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">Period</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">Generated By</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">Created</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-400 text-sm">
                          No reports generated yet.
                        </td>
                      </tr>
                    ) : (
                      reports.map((r) => (
                        <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                              className="text-gold-700 hover:text-gold-900 text-sm font-medium"
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

        {activeTab === 'users' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-gray-700">User Management</h2>
              <button
                onClick={() => setShowAddUser(true)}
                className="text-sm bg-gold-600 text-white px-4 py-2 rounded hover:bg-gold-700"
              >
                Add User
              </button>
            </div>

            {showAddUser && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-4">Add New User</h3>
                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded"
                    required
                  />
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddUser(false)}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500">Name</th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500">Username</th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500">Email</th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500">Role</th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500">Created</th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2.5 px-4">{u.full_name}</td>
                      <td className="py-2.5 px-4">{u.username}</td>
                      <td className="py-2.5 px-4">{u.email}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
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