import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'partial': return 'text-amber-600';
      case 'full': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };  const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

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
          <h1 className="text-lg font-semibold text-gray-900">FMG Catering · Staff</h1>
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
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2.5 text-sm font-medium ${
              activeTab === 'bookings'
                ? 'text-gray-900 border-b-2 border-gold-500 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2.5 text-sm font-medium ${
              activeTab === 'sales'
                ? 'text-gray-900 border-b-2 border-gold-500 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sales ({sales.length})
          </button>
        </div>

        {activeTab === 'bookings' && (
          <div className="bg-white border border-gray-200 rounded-lg">
            <h2 className="text-sm font-semibold text-gray-700 px-6 py-4 border-b border-gray-200">Booking Management</h2>
            {bookings.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No bookings found</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{booking.event_type}</h3>
                        <p className="text-sm text-gray-500">Customer: {booking.customer_name}</p>
                        <p className="text-sm text-gray-500">Email: {booking.customer_email}</p>
                        <p className="text-sm text-gray-500">Phone: {booking.customer_phone}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500">Event Date:</span>
                        <p className="font-medium">{new Date(booking.event_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Guests:</span>
                        <p className="font-medium">{booking.number_of_guests}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Budget:</span>
                        <p className="font-medium">₱{booking.budget?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Package:</span>
                        <p className="font-medium">{booking.preferred_package || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500">Payment Type:</span>
                        <p className="font-medium capitalize">{booking.payment_type === 'down_payment' ? 'Down Payment' : 'Full Payment'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Payment Status:</span>
                        <p className={`font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                          {capitalizeFirst(booking.payment_status)}
                        </p>
                      </div>
                      {booking.payment_type === 'down_payment' && (
                        <div>
                          <span className="text-gray-500">Down Payment:</span>
                          <p className="font-medium">₱{booking.down_payment_amount?.toLocaleString() || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                    {booking.additional_requests && (
                      <div className="mb-4">
                        <span className="text-gray-500 text-sm">Additional Requests:</span>
                        <p className="text-sm">{booking.additional_requests}</p>
                      </div>
                    )}
                    {booking.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'approved')}
                          className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'rejected')}
                          className="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 text-sm"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'completed')}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-sm"
                        >
                          Mark Complete
                        </button>
                      </div>
                    )}
                    {booking.status === 'approved' && (
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-sm"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="bg-white border border-gray-200 rounded-lg">
            <h2 className="text-sm font-semibold text-gray-700 px-6 py-4 border-b border-gray-200">Sales Records</h2>
            {sales.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No sales records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2.5 px-6 font-medium text-gray-500">Date</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">Customer</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">Event</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">Amount</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">Method</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2.5 px-6">{new Date(sale.sale_date).toLocaleDateString()}</td>
                        <td className="py-2.5 px-4">{sale.customer_name}</td>
                        <td className="py-2.5 px-4">{sale.event_type}</td>
                        <td className="py-2.5 px-4 font-medium">₱{parseFloat(sale.amount).toLocaleString()}</td>
                        <td className="py-2.5 px-4">{sale.payment_method}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            sale.payment_status === 'completed' ? 'bg-green-100 text-green-700' :
                            sale.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            sale.payment_status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {sale.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
