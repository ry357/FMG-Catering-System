import { useRef } from 'react';
import logoImage from '../../assets/297896214_112620414877986_8856076360523925875_n.jpg';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Button from '../ui/Button';

export default function CustomerInvoiceModal({ booking, onClose }) {
  const printRef = useRef(null);

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const menuItems = Array.isArray(booking.menu_items) ? booking.menu_items : [];
  const menuPref = booking.menu_preference || {};
  const platters = menuPref.platters || {};

  // Flatten platter list if drop-off
  const platterLines = [];
  if (platters && typeof platters === 'object') {
    Object.entries(platters).forEach(([groupKey, groupItems]) => {
      if (groupItems && typeof groupItems === 'object') {
        Object.entries(groupItems).forEach(([dishId, qty]) => {
          if (Number(qty) > 0) {
            platterLines.push({ name: dishId.replace(/_/g, ' '), qty: Number(qty), category: groupKey });
          }
        });
      }
    });
  }

  const selections = menuPref.selections || {};
  const allCustomDishes = [
    ...(selections.appetizers || []),
    ...(selections.mains || []),
    ...(selections.addons || []),
  ];

  const totalAmount = Number(booking.total_amount || 0);
  const amountPaid = Number(booking.amount_paid || 0);
  const balanceDue = Math.max(0, totalAmount - amountPaid);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Booking Invoice"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden my-8">
        {/* Header toolbar (Hidden during print) */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-charcoal text-sm">Official Booking Invoice & Receipt</span>
            <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-semibold text-gold-800">
              {booking.booking_ref}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handlePrint} className="!text-xs">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save PDF
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-charcoal-muted hover:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Invoice Printable Area */}
        <div ref={printRef} className="p-8 text-charcoal print:p-6">
          {/* Brand Header */}
          <div className="flex items-start justify-between border-b border-gold-200 pb-6">
            <div className="flex items-center gap-3">
              <img
                src={logoImage}
                alt="FMG Logo"
                className="h-14 w-14 rounded-xl object-cover border border-gold-300"
              />
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-charcoal">
                  FMG Catering Services
                </h2>
                <p className="text-xs text-charcoal-muted">
                  Premium Food Catering & Event Styling
                </p>
                <p className="text-xs text-charcoal-muted">
                  Cebu, Philippines · Contact: +63 912 345 6789
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="font-display text-lg font-bold text-gold-600 uppercase">
                Invoice / Statement
              </div>
              <div className="mt-1 font-mono text-xs font-semibold text-charcoal">
                Ref: {booking.booking_ref}
              </div>
              <div className="text-xs text-charcoal-muted">
                Issued: {formatDate(booking.created_at || new Date())}
              </div>
              <div className="mt-2">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                    booking.status === 'approved' || booking.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : booking.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Status: {booking.status}
                </span>
              </div>
            </div>
          </div>

          {/* Bill To & Event Details */}
          <div className="grid grid-cols-2 gap-6 py-6 text-sm border-b border-gray-100">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-1">
                Billed To (Client)
              </p>
              <p className="font-semibold text-charcoal">{booking.customer_name || 'Valued Customer'}</p>
              <p className="text-charcoal-light">{booking.customer_email || '—'}</p>
              <p className="text-charcoal-light">{booking.customer_phone || 'No phone provided'}</p>
              {booking.customer_address && (
                <p className="text-xs text-charcoal-muted mt-1">{booking.customer_address}</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-1">
                Event & Delivery Info
              </p>
              <p className="font-medium text-charcoal">
                <span className="text-charcoal-muted">Event:</span> {booking.event_type || 'Catering'}
              </p>
              <p className="font-medium text-charcoal">
                <span className="text-charcoal-muted">Date:</span> {formatDate(booking.event_date)}
              </p>
              {booking.booking_category !== 'drop-off' && (
                <p className="font-medium text-charcoal">
                  <span className="text-charcoal-muted">Guests:</span> {booking.number_of_guests} pax
                </p>
              )}
              <p className="font-medium text-charcoal">
                <span className="text-charcoal-muted">Type:</span>{' '}
                {booking.booking_category === 'drop-off' ? 'Drop-Off Platter Delivery' : 'Full Catering Set'}
              </p>
            </div>
          </div>

          {/* Menu / Items Breakdown */}
          <div className="py-6 border-b border-gray-100">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-3">
              Menu & Services Booked
            </h4>

            {booking.preferred_package && (
              <div className="mb-3 rounded-lg bg-gold-50/60 p-3 text-sm">
                <span className="font-semibold text-charcoal">Package: </span>
                <span className="text-gold-700 font-medium">{booking.preferred_package}</span>
              </div>
            )}

            {menuPref.offer && (
              <div className="mb-3 rounded-lg bg-gold-50/60 p-3 text-sm">
                <span className="font-semibold text-charcoal">Menu Set: </span>
                <span className="text-gold-700 font-medium">{menuPref.offer}</span>
                {menuPref.pricePerPax && (
                  <span className="text-xs text-charcoal-muted ml-2">
                    ({formatCurrency(menuPref.pricePerPax)} / pax)
                  </span>
                )}
              </div>
            )}

            {/* List itemized dishes if available */}
            {menuItems.length > 0 ? (
              <div className="space-y-1.5 text-sm">
                {menuItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-gray-50 text-xs">
                    <span className="text-charcoal">{item.name || item.dish || item}</span>
                    {item.price && (
                      <span className="font-medium text-charcoal">{formatCurrency(item.price)}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : platterLines.length > 0 ? (
              <div className="space-y-1.5 text-sm">
                {platterLines.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-gray-50 text-xs">
                    <span className="text-charcoal font-medium">
                      {item.qty}× {item.name}
                    </span>
                    <span className="text-charcoal-muted capitalize text-[11px]">{item.category}</span>
                  </div>
                ))}
              </div>
            ) : allCustomDishes.length > 0 ? (
              <div className="text-xs text-charcoal-light flex flex-wrap gap-1.5">
                {allCustomDishes.map((dish, i) => (
                  <span key={i} className="rounded bg-gray-100 px-2 py-0.5">
                    {dish}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-charcoal-muted">Custom curated catering menu</p>
            )}

            {booking.additional_requests && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-charcoal-muted">
                <span className="font-semibold text-charcoal">Special Notes: </span>
                {booking.additional_requests}
              </div>
            )}
          </div>

          {/* Payment & Balance Summary */}
          <div className="pt-6">
            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-sm">
                <div className="flex justify-between text-charcoal">
                  <span>Grand Total:</span>
                  <span className="font-display font-bold text-base text-charcoal">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Amount Paid:</span>
                  <span className="font-semibold">
                    {formatCurrency(amountPaid)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 font-display text-base font-bold">
                  <span className={balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                    Balance Due:
                  </span>
                  <span className={balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-gold-200 bg-gold-50/50 p-4 text-center text-xs text-charcoal-muted">
              <p className="font-semibold text-charcoal">Thank you for choosing FMG Catering Services!</p>
              <p className="mt-1">
                For questions regarding delivery, final setup, or payments, kindly contact our coordination team at fmgcateringservices@gmail.com.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
