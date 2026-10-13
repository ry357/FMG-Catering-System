import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLoginModal } from '../context/LoginModalContext';
import { customerService } from '../services/customerService';
import { formatCurrency, formatDate } from '../utils/helpers';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import AddressAutocomplete from '../components/ui/AddressAutocomplete';
import CustomerInvoiceModal from '../components/profile/CustomerInvoiceModal';

export default function CustomerProfilePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'history';

  const { openLogin } = useLoginModal();
  const { customer, customerToken, updateCustomerState, logoutCustomer, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab); // 'history', 'addresses', 'phone'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }

  // Data states
  const [bookings, setBookings] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');

  // Address modal/form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [newAddress, setNewAddress] = useState({
    label: '',
    address: '',
    contactPerson: '',
    contactPhone: '',
    isDefault: false,
  });

  // Invoice modal
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState(null);

  // Sync tab with URL search params whenever query string changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['history', 'addresses', 'phone'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl) {
      setActiveTab('history');
    }
  }, [searchParams]);

  // Pre-seed state from current session so data is visible immediately while revalidating
  useEffect(() => {
    if (customer) {
      if (!fullName) setFullName(customer.name || '');
      if (!phone) setPhone(customer.phone || '');
      if (!address) setAddress(customer.address || '');
      if (Array.isArray(customer.saved_addresses) && customer.saved_addresses.length > 0 && savedAddresses.length === 0) {
        setSavedAddresses(customer.saved_addresses);
      }
    }
  }, [customer]);

  useEffect(() => {
    if (authLoading) return;

    const token = customerToken || localStorage.getItem('customerToken');
    if (!token) {
      setLoading(false);
      return;
    }

    loadProfileAndData();
  }, [customerToken, authLoading]);

  const loadProfileAndData = async () => {
    setLoading(true);
    let profileFetched = false;

    // 1. Fetch Profile
    try {
      const profileRes = await customerService.getProfile();
      if (profileRes.success && profileRes.customer) {
        const c = profileRes.customer;
        setFullName(c.name || '');
        setPhone(c.phone || '');
        setAddress(c.address || '');
        setSavedAddresses(c.saved_addresses || []);
        updateCustomerState(c);
        profileFetched = true;
      }
    } catch (err) {
      console.warn('Profile fetch note:', err.response?.status, err.message);
      if (err.response?.status === 401 || err.response?.status === 403) {
        // Token invalid or expired; clear token so unauthenticated state cleanly renders
        localStorage.removeItem('customerToken');
        localStorage.removeItem('customer');
        updateCustomerState(null);
        setLoading(false);
        return;
      }
    }

    // 2. Fetch Bookings independently so a bookings issue never blocks profile details
    try {
      const bookingsRes = await customerService.getBookings();
      if (bookingsRes.success) {
        setBookings(bookingsRes.bookings || []);
      }
    } catch (err) {
      console.warn('Bookings fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setFeedback(null);
  };

  // ── Contact Phone / Profile Save ─────────────────────────────
  const handleSaveContactInfo = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a valid contact phone number.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const res = await customerService.updateProfile({
        name: fullName,
        phone: phone.trim(),
        address: address.trim(),
      });
      if (res.success) {
        updateCustomerState(res.customer);
        setFeedback({
          type: 'success',
          message: 'Contact details saved! This phone number will be used for delivery coordination.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to update contact info.',
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Add or Update Delivery Address ──────────────────────────
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.address.trim()) {
      setFeedback({ type: 'error', message: 'Address location is required.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      let res;
      if (editingAddressId) {
        res = await customerService.updateAddress(editingAddressId, {
          label: newAddress.label.trim() || 'Venue',
          address: newAddress.address.trim(),
          contactPerson: newAddress.contactPerson.trim() || fullName,
          contactPhone: newAddress.contactPhone.trim() || phone,
          isDefault: newAddress.isDefault,
        });
      } else {
        res = await customerService.addAddress({
          label: newAddress.label.trim() || 'Venue',
          address: newAddress.address.trim(),
          contactPerson: newAddress.contactPerson.trim() || fullName,
          contactPhone: newAddress.contactPhone.trim() || phone,
          isDefault: newAddress.isDefault,
        });
      }

      if (res.success) {
        setSavedAddresses(res.saved_addresses);
        setShowAddressForm(false);
        setEditingAddressId(null);
        setNewAddress({ label: '', address: '', contactPerson: '', contactPhone: '', isDefault: false });
        setFeedback({
          type: 'success',
          message: editingAddressId ? 'Delivery address updated successfully!' : 'New delivery address added successfully!',
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to save address.' });
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setNewAddress({
      label: addr.label || '',
      address: addr.address || '',
      contactPerson: addr.contactPerson || '',
      contactPhone: addr.contactPhone || '',
      isDefault: Boolean(addr.isDefault),
    });
    setShowAddressForm(true);
  };

  // ── Delete Address ───────────────────────────────────────────
  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to remove this saved delivery address?')) return;
    try {
      const res = await customerService.deleteAddress(id);
      if (res.success) {
        setSavedAddresses(res.saved_addresses);
        setFeedback({ type: 'success', message: 'Delivery address removed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to delete address.' });
    }
  };

  // ── Set Default Address ──────────────────────────────────────
  const handleSetDefaultAddress = async (id) => {
    try {
      const res = await customerService.setDefaultAddress(id);
      if (res.success) {
        setSavedAddresses(res.saved_addresses);
        setFeedback({ type: 'success', message: 'Default delivery address updated.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to set default address.' });
    }
  };

  // ── Replicate Order / Buffet ─────────────────────────────────
  const handleReplicateOrder = (booking) => {
    // Store template booking data in sessionStorage so BookNow wizard can initialize with it
    const replicateData = {
      replicate: true,
      bookingCategory: booking.booking_category || 'natural',
      eventType: booking.event_type,
      numberOfGuests: booking.number_of_guests,
      preferredPackageId: booking.preferred_package,
      menuPreference: booking.menu_preference,
      additionalRequests: booking.additional_requests,
      originalRef: booking.booking_ref,
    };

    sessionStorage.setItem('fmg_replicate_order', JSON.stringify(replicateData));
    navigate('/book?replicate=true');
  };

  const token = customerToken || localStorage.getItem('customerToken');

  // If auth is still verifying token from local storage, display a refined skeleton loader
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans text-charcoal">
        <Navbar />
        <main className="flex-grow pt-28 pb-16 flex items-center justify-center">
          <div className="py-20 text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-gold-500 border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-charcoal-muted">Loading your account...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If customer is not authenticated, show a clean luxury invitation card instead of a blank screen
  if (!token && !customer) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans text-charcoal">
        <Navbar />
        <main className="flex-grow pt-28 pb-16 flex items-center justify-center">
          <div className="section-container max-w-lg text-center">
            <div className="rounded-3xl bg-white p-8 sm:p-10 shadow-sm border border-gold-200">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-50 text-gold-600 text-3xl mb-4">
                👤
              </div>
              <h2 className="font-display text-2xl font-bold text-charcoal">
                Customer Account & Orders
              </h2>
              <p className="mt-2 text-sm text-charcoal-muted leading-relaxed">
                Sign in with your Google or customer account to view your past and upcoming catering bookings, manage saved venue addresses, and download official invoices.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={openLogin}
                  className="w-full sm:w-auto"
                >
                  Sign In to View Profile
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/')}
                  className="w-full sm:w-auto"
                >
                  Return to Home
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans text-charcoal">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="section-container max-w-5xl">
          {/* Header Card */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-gold-100 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              {customer?.avatar ? (
                <img
                  src={customer.avatar}
                  alt={customer.name}
                  className="h-20 w-20 rounded-full object-cover border-2 border-gold-400 shadow-md"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-gold-600 to-gold-400 text-white font-display text-2xl font-bold shadow-md">
                  {(customer?.name || 'C').charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-charcoal">
                  {customer?.name || fullName || 'Customer Profile'}
                </h1>
                <p className="text-sm text-charcoal-muted mt-0.5">{customer?.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 border border-gold-200 px-3 py-0.5 text-xs font-medium text-gold-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse" />
                    Verified Customer
                  </span>
                  {phone ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-medium text-emerald-800">
                      📞 {phone}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-0.5 text-xs font-medium text-amber-800">
                      ⚠️ Phone required for day-of coordination
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/book')}
                className="!rounded-xl"
              >
                + Book New Event
              </Button>
            </div>
          </div>

          {/* Feedback message banner */}
          {feedback && (
            <div
              className={`mt-6 rounded-2xl p-4 text-sm font-medium transition-all ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mt-8 flex border-b border-gold-200 gap-2 sm:gap-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleTabChange('history')}
              className={`pb-3.5 px-3 text-sm font-semibold transition-all relative whitespace-nowrap ${
                activeTab === 'history'
                  ? 'text-gold-700 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gold-600'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              📦 Order & Event History
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-charcoal-muted">
                {bookings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('addresses')}
              className={`pb-3.5 px-3 text-sm font-semibold transition-all relative whitespace-nowrap ${
                activeTab === 'addresses'
                  ? 'text-gold-700 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gold-600'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              📍 Saved Delivery Addresses
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-charcoal-muted">
                {savedAddresses.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('phone')}
              className={`pb-3.5 px-3 text-sm font-semibold transition-all relative whitespace-nowrap ${
                activeTab === 'phone'
                  ? 'text-gold-700 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gold-600'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              📞 Contact & Phone Info
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gold-500 border-t-transparent" />
                <p className="mt-3 text-sm text-charcoal-muted">Loading your account details...</p>
              </div>
            ) : (
              <>
                {/* ──────────────── TAB 1: ORDER & EVENT HISTORY ──────────────── */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    {bookings.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-gold-300 bg-white p-12 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-50 text-gold-600 text-2xl">
                          🍽️
                        </div>
                        <h3 className="mt-4 font-display text-lg font-semibold text-charcoal">
                          No bookings or catering events yet
                        </h3>
                        <p className="mt-1 text-sm text-charcoal-muted max-w-md mx-auto">
                          Ready to celebrate your upcoming event? Book a custom full catering package or choose our drop-off platters.
                        </p>
                        <Button
                          className="mt-6 !rounded-xl"
                          onClick={() => navigate('/book')}
                        >
                          Book Your First Event
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-5">
                        {bookings.map((booking) => {
                          let isUpcoming = false;
                          if (booking.event_date) {
                            try {
                              const d = new Date(booking.event_date);
                              if (!isNaN(d.getTime())) {
                                isUpcoming = d.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0);
                              }
                            } catch {
                              isUpcoming = false;
                            }
                          }

                          return (
                            <div
                              key={booking.id}
                              className="rounded-3xl bg-white p-6 shadow-sm border border-gold-100 hover:border-gold-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                            >
                              <div className="space-y-2 flex-grow">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span className="font-mono text-xs font-bold text-gold-700 bg-gold-50 px-2.5 py-1 rounded-lg border border-gold-200">
                                    {booking.booking_ref}
                                  </span>

                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                                      booking.status === 'approved' || booking.status === 'completed'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : booking.status === 'rejected'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    Status: {booking.status}
                                  </span>

                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                      booking.payment_status === 'full'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : booking.payment_status === 'partial'
                                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    Payment: {booking.payment_status || 'pending'}
                                  </span>

                                  {isUpcoming && (
                                    <span className="rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 text-xs font-medium">
                                      🗓️ Upcoming
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <h3 className="font-display text-lg font-bold text-charcoal">
                                    {booking.event_type || 'Catering Event'} —{' '}
                                    <span className="text-gold-600 font-medium">
                                      {booking.preferred_package ||
                                        (booking.booking_category === 'drop-off'
                                          ? 'Drop-off Platters'
                                          : 'Custom Menu')}
                                    </span>
                                  </h3>
                                  <p className="text-xs text-charcoal-muted mt-0.5">
                                    Date: <span className="font-semibold text-charcoal">{formatDate(booking.event_date)}</span>
                                    {booking.booking_category !== 'drop-off' && (
                                      <span> · Guests: {booking.number_of_guests} pax</span>
                                    )}
                                    {booking.customer_address && (
                                      <span> · Venue: {booking.customer_address}</span>
                                    )}
                                  </p>
                                </div>

                                <div className="flex items-center gap-4 text-xs pt-1">
                                  <div>
                                    <span className="text-charcoal-muted">Total: </span>
                                    <span className="font-bold text-charcoal">
                                      {formatCurrency(booking.total_amount)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-charcoal-muted">Paid: </span>
                                    <span className="font-semibold text-emerald-700">
                                      {formatCurrency(booking.amount_paid)}
                                    </span>
                                  </div>
                                  {booking.balance_due > 0 && (
                                    <div>
                                      <span className="text-charcoal-muted">Balance: </span>
                                      <span className="font-semibold text-amber-700">
                                        {formatCurrency(booking.balance_due)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex flex-row md:flex-col gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setSelectedBookingForInvoice(booking)}
                                  className="!rounded-xl text-xs w-full"
                                >
                                  📄 View Invoice
                                </Button>

                                <Button
                                  size="sm"
                                  onClick={() => handleReplicateOrder(booking)}
                                  className="!rounded-xl text-xs w-full whitespace-nowrap"
                                  title="Replicate this menu and order setup for a new event"
                                >
                                  🔁 Replicate Order
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ──────────────── TAB 2: SAVED DELIVERY ADDRESSES ───────────── */}
                {activeTab === 'addresses' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gold-50/50 border border-gold-200 p-5">
                      <div>
                        <h3 className="font-semibold text-charcoal text-base">
                          Manage Venue & Office Delivery Locations
                        </h3>
                        <p className="text-xs text-charcoal-muted mt-0.5 max-w-xl">
                          Save frequent venues, corporate office addresses, and residences so you won't have to re-type them during future event bookings.
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          if (showAddressForm) {
                            setShowAddressForm(false);
                            setEditingAddressId(null);
                          } else {
                            setEditingAddressId(null);
                            setNewAddress({ label: '', address: '', contactPerson: '', contactPhone: '', isDefault: false });
                            setShowAddressForm(true);
                          }
                        }}
                        className="!rounded-xl shrink-0"
                      >
                        {showAddressForm ? 'Cancel' : '+ Add Address'}
                      </Button>
                    </div>

                    {/* New/Edit Address Form Modal/Panel */}
                    {showAddressForm && (
                      <form
                        onSubmit={handleSaveAddress}
                        className="rounded-3xl bg-white p-6 shadow-sm border border-gold-200 space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <h4 className="font-display text-base font-bold text-charcoal">
                            {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                          </h4>
                          <span className="text-xs text-charcoal-muted">
                            {editingAddressId ? 'Update details below' : 'Save for fast booking autofill'}
                          </span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-charcoal mb-1">
                              Location Label <span className="text-gold-600">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Headquarters, Waterfront Hotel, Home"
                              value={newAddress.label}
                              onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-gold-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-charcoal mb-1">
                              On-Site Contact Person
                            </label>
                            <input
                              type="text"
                              placeholder="Name of event coordinator or host"
                              value={newAddress.contactPerson}
                              onChange={(e) =>
                                setNewAddress({ ...newAddress, contactPerson: e.target.value })
                              }
                              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-gold-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-charcoal mb-1">
                            Exact Address / Venue Name <span className="text-gold-600">*</span>
                          </label>
                          <AddressAutocomplete
                            value={newAddress.address}
                            onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                            placeholder="e.g. SM Seaside Sky Hall, South Road Properties, Cebu City"
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-gold-500 focus:outline-none"
                          />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 items-center">
                          <div>
                            <label className="block text-xs font-semibold text-charcoal mb-1">
                              Contact Phone for this Location
                            </label>
                            <input
                              type="tel"
                              placeholder="e.g. 0917 123 4567"
                              value={newAddress.contactPhone}
                              onChange={(e) =>
                                setNewAddress({ ...newAddress, contactPhone: e.target.value })
                              }
                              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-gold-500 focus:outline-none"
                            />
                          </div>

                          <div className="pt-4 sm:pt-0">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newAddress.isDefault}
                                onChange={(e) =>
                                  setNewAddress({ ...newAddress, isDefault: e.target.checked })
                                }
                                className="h-4 w-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                              />
                              <span className="text-xs font-medium text-charcoal">
                                Set as default venue for new bookings
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowAddressForm(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" size="sm" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Address'}
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Address List */}
                    {savedAddresses.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-gold-300 bg-white p-10 text-center">
                        <p className="text-sm text-charcoal-muted">
                          You haven't saved any delivery addresses yet. Add one above to speed up booking!
                        </p>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            className={`rounded-2xl bg-white p-5 shadow-sm border transition-all ${
                              addr.isDefault
                                ? 'border-gold-400 ring-2 ring-gold-400/20'
                                : 'border-gray-200 hover:border-gold-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-charcoal text-sm">{addr.label}</h4>
                                {addr.isDefault && (
                                  <span className="rounded-full bg-gold-100 text-gold-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                    Default
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                                title="Remove address"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>

                            <p className="mt-2 text-xs text-charcoal leading-relaxed">{addr.address}</p>

                            {(addr.contactPerson || addr.contactPhone) && (
                              <div className="mt-3 border-t border-gray-100 pt-2 text-[11px] text-charcoal-muted">
                                {addr.contactPerson && <span>Contact: {addr.contactPerson}</span>}
                                {addr.contactPhone && <span> · 📞 {addr.contactPhone}</span>}
                              </div>
                            )}

                            <div className="mt-4 pt-2 border-t border-gray-100 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleStartEditAddress(addr)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-charcoal hover:text-gold-600 transition-colors"
                              >
                                ✏️ Edit Details
                              </button>

                              {!addr.isDefault && (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultAddress(addr.id)}
                                  className="text-xs font-medium text-gold-600 hover:text-gold-700 underline"
                                >
                                  Make Default
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ──────────────── TAB 3: CONTACT & PHONE INFO ──────────────── */}
                {activeTab === 'phone' && (
                  <div className="max-w-xl">
                    <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-gold-200">
                      <div className="mb-6 rounded-2xl bg-gold-50/60 border border-gold-200 p-4 text-xs text-charcoal-muted leading-relaxed">
                        <span className="font-bold text-charcoal block mb-1">
                          Why is your phone number important?
                        </span>
                        Google Sign-In provides your name and email, but rarely your phone number.
                        Our catering logistics team requires an active phone number to coordinate day-of event delivery, venue gate access, and emergency timing adjustments.
                      </div>

                      <form onSubmit={handleSaveContactInfo} className="space-y-5">
                        <div>
                          <label className="block text-xs font-semibold text-charcoal mb-1.5">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gold-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-charcoal mb-1.5">
                            Email Address <span className="text-gray-400 font-normal">(Linked to Google/Account)</span>
                          </label>
                          <input
                            type="email"
                            value={customer?.email || ''}
                            disabled
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-charcoal mb-1.5">
                            Primary Mobile Phone Number <span className="text-gold-600">*</span>
                          </label>
                          <input
                            type="tel"
                            placeholder="e.g. +63 912 345 6789 or 0912 345 6789"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                          />
                          <p className="mt-1 text-[11px] text-charcoal-muted">
                            Used for SMS updates, day-of catering dispatcher calls, and booking confirmation.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-charcoal mb-1.5">
                            Billing Address (Optional)
                          </label>
                          <AddressAutocomplete
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Your primary billing or home address"
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gold-500 focus:outline-none"
                          />
                        </div>

                        <div className="pt-3">
                          <Button type="submit" size="lg" className="w-full" disabled={saving}>
                            {saving ? 'Saving Information...' : 'Save Contact Details'}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Invoice Modal */}
      {selectedBookingForInvoice && (
        <CustomerInvoiceModal
          booking={selectedBookingForInvoice}
          onClose={() => setSelectedBookingForInvoice(null)}
        />
      )}
    </div>
  );
}
