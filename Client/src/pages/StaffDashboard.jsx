import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { formatCurrency } from '../utils/helpers';
import BookingDetailModal from '../components/BookingDetailModal';
import DashboardSkeleton from '../components/ui/DashboardSkeleton';

const dropOffSummary = (booking) => {
  const parse = (json) => { try { return json ? JSON.parse(json) : null; } catch { return null; } };
  const items = parse(booking.menu_items);
  const preference = parse(booking.menu_preference);

  const totalQty = Array.isArray(items)
    ? items.reduce((sum, item) => {
        const qtyToken = typeof item === 'string' ? item : item?.name;
        const match = qtyToken ? String(qtyToken).match(/^(\d+)\s*×/) : null;
        return sum + (match ? Number(match[1]) : 1);
      }, 0)
    : 0;
  const categories = new Set(
    (Array.isArray(items) ? items : []).map((i) => (typeof i === 'string' ? '' : i?.category)).filter(Boolean)
  );

  return {
    totalQty,
    categories,
    chafer: !!preference?.chafer,
  };
};

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

const saleStatusBadge = (status) => {
  const map = {
    pending: { label: 'Closed', cls: 'bg-slate-700/40 text-slate-300 border border-slate-500/30' },
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

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [bookingsRes, salesRes] = await Promise.all([
        axios.get('/api/bookings', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/sales', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setBookings(bookingsRes.data.bookings);
      setSales(salesRes.data.sales);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/bookings/${bookingId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking status');
    }
  };

  const openBookingDetail = (booking, sale = null) => {
    setSelectedBooking(booking);
    setSelectedSale(sale);
  };

  const openSaleDetail = (sale) => {
    const booking = bookings.find((b) => b.id === sale.booking_id) || {
      ...sale,
      id: sale.booking_id,
      customer_name: sale.customer_name,
      customer_address: sale.customer_address,
      event_date: sale.event_date,
      event_type: sale.event_type,
      created_at: sale.sale_date,
    };
    setSelectedBooking(booking);
    setSelectedSale(sale);
  };

  const dropOffBookings = bookings.filter(
    (b) => (b.booking_category || '').toLowerCase() === 'drop-off'
  );

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
        <div className="max-w-[1600px] mx-auto px-6 py-3.5 flex justify-between items-center">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-cyan-300 via-white to-pink-400 bg-clip-text text-transparent">
            FMG Catering · Staff
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
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'sales'
                ? 'text-cyan-300 border-b-2 border-cyan-400 -mb-px'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Transaction ({sales.length})
          </button>
          <button
            onClick={() => setActiveTab('dropoff')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'dropoff'
                ? 'text-cyan-300 border-b-2 border-cyan-400 -mb-px'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Drop-Off ({dropOffBookings.length})
          </button>
        </div>

        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#1E2A45] p-4 shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)] bg-[#101A2E]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-[#1E2A45] pb-3">
                <div>
                  <h2 className="text-base font-semibold text-white">Booking Management</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Review, approve, decline, or complete customer bookings</p>
                </div>
              </div>

              {bookings.length === 0 ? (
                <p className="text-slate-500 text-center py-10 text-sm">No bookings found</p>
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
                        <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Booking Status</th>
                        <th className="text-right py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className="border-b border-[#17233C] hover:bg-cyan-400/5 align-top cursor-pointer"
                          onClick={() => openBookingDetail(booking)}
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
                                title="Update booking status"
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
            </div>
          </div>
        )}

        {activeTab === 'dropoff' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#1E2A45] p-4 shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)] bg-[#101A2E]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-[#1E2A45] pb-3">
                <div>
                  <h2 className="text-base font-semibold text-white">Drop-Off Order Management</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Inventory, chafer dishes, and platter drop-offs that staff prepare for delivery</p>
                </div>
              </div>

              {dropOffBookings.length === 0 ? (
                <p className="text-slate-500 text-center py-10 text-sm">No drop-off orders found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-slate-200">
                    <thead>
                      <tr className="border-b border-[#1E2A45]">
                        <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Event Date</th>
                        <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Client</th>
                        <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Platters</th>
                        <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Chafer</th>
                        <th className="text-right py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Estimated Total</th>
                        <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Payment</th>
                        <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Booking Status</th>
                        <th className="text-right py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dropOffBookings.map((booking) => {
                        const summary = dropOffSummary(booking);
                        return (
                          <tr
                            key={booking.id}
                            className="border-b border-[#17233C] hover:bg-cyan-400/5 align-top cursor-pointer"
                            onClick={() => openBookingDetail(booking)}
                          >
                            <td className="py-3 px-4 whitespace-nowrap text-white">
                              {new Date(booking.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-white font-medium">{booking.customer_name}</p>
                              <p className="text-[11px] text-slate-500">{booking.customer_email}</p>
                              <p className="text-[11px] text-slate-500">{booking.customer_phone}</p>
                            </td>
                            <td className="py-3 px-4 text-slate-200">
                              <p className="text-white font-medium">{summary.totalQty} platter{summary.totalQty === 1 ? '' : 's'}</p>
                              {summary.categories.size > 0 && (
                                <p className="text-[11px] text-slate-500 mt-0.5">{Array.from(summary.categories).join(', ')}</p>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {summary.chafer ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">Chafer</span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-700/40 text-slate-400 border border-slate-500/30">No chafer</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-cyan-300 tabular-nums">
                              {booking.total_amount ? `${formatCurrency(booking.total_amount)}` : '—'}
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="rounded-xl border border-[#1E2A45] p-4 shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)] bg-[#101A2E]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-[#1E2A45] pb-3">
              <div>
                <h2 className="text-base font-semibold text-white">Transaction Records</h2>
                <p className="text-xs text-slate-400 mt-0.5">Completed and pending payments recorded against bookings</p>
              </div>
            </div>
            {sales.length === 0 ? (
              <p className="text-slate-500 text-center py-10 text-sm">No transaction records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-200">
                  <thead>
                    <tr className="border-b border-[#1E2A45]">
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Date</th>
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Customer</th>
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Event</th>
                      <th className="text-right py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Amount</th>
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Method</th>
                      <th className="text-left py-2.5 px-4 font-medium text-slate-500 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="border-b border-[#17233C] hover:bg-cyan-400/5 cursor-pointer"
                        onClick={() => openSaleDetail(sale)}
                      >
                        <td className="py-2.5 px-4 whitespace-nowrap">{new Date(sale.sale_date).toLocaleDateString()}</td>
                        <td className="py-2.5 px-4">{sale.customer_name}</td>
                        <td className="py-2.5 px-4">{sale.event_type}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-cyan-300 tabular-nums">{formatCurrency(parseFloat(sale.amount) || 0)}</td>
                        <td className="py-2.5 px-4">{sale.payment_method}</td>
                        <td className="py-2.5 px-4">{saleStatusBadge(sale.payment_status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          sale={selectedSale}
          onClose={() => { setSelectedBooking(null); setSelectedSale(null); }}
        />
      )}
    </div>
  );
};

export default StaffDashboard;