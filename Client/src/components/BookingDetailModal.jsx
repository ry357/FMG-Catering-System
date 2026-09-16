import { useEffect } from 'react';
import { PACKAGES, MENU_OFFERS } from '../data/landingData';
import { formatCurrency } from '../utils/helpers';

const STATUS_CLS = {
  pending: 'bg-amber-400/10 text-amber-300 border border-amber-400/30',
  approved: 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/30',
  rejected: 'bg-red-400/10 text-red-300 border border-red-400/30',
  completed: 'bg-blue-400/10 text-blue-300 border border-blue-400/30',
};

const STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
};

function parseMenuData(booking) {
  // Prefer the dedicated columns added during the booking-flow restructure,
  // then fall back to the legacy JSON-in-TEXT approach for older rows.
  let menuItems = [];
  let menuPreference = null;
  let additionalNotes = booking?.additional_requests || null;

  if (booking?.menu_items) {
    try { menuItems = JSON.parse(booking.menu_items); } catch { menuItems = []; }
  }
  if (booking?.menu_preference) {
    try { menuPreference = JSON.parse(booking.menu_preference); } catch { menuPreference = null; }
  }

  if (!menuItems.length && !menuPreference) {
    const raw = booking?.additional_requests || '';
    const menuMatch = raw.match(/\|?\s*MENU:\s*(\[[\s\S]*?\])/);
    const prefMatch = raw.match(/\|?\s*MENU PREFERENCE:\s*(\{[\s\S]*?\})/);

    if (menuMatch) {
      try { menuItems = JSON.parse(menuMatch[1]); } catch { menuItems = []; }
    }
    if (prefMatch) {
      try { menuPreference = JSON.parse(prefMatch[1]); } catch { menuPreference = null; }
    }

    const notes = raw
      .split('|')
      .map((part) => part.trim())
      .filter((part) => part && !part.startsWith('MENU:') && !part.startsWith('MENU PREFERENCE:'));
    additionalNotes = notes.length ? notes.join(' ') : null;
  }

  return { menuItems, menuPreference, additionalNotes };
}

function extractDishes(menuItems, menuPreference) {
  if (Array.isArray(menuItems) && menuItems.length > 0) {
    return menuItems.map((item) => ({
      name: item?.name || item || 'Unnamed dish',
      price: item?.price != null ? item.price : null,
    }));
  }

  if (menuPreference?.selections) {
    const { appetizers = [], mains = [], addons = [], sides = [], desserts = [] } = menuPreference.selections;
    const flatten = (list) =>
      list.map((item) =>
        typeof item === 'string' ? { name: item, price: null } : { name: item?.name || 'Unnamed dish', price: item?.price ?? null }
      );
    return [...flatten(appetizers), ...flatten(mains), ...flatten(addons), ...flatten(sides), ...flatten(desserts)];
  }

  return [];
}

function extractInclusions(booking) {
  const { menuPreference } = parseMenuData(booking);
  const inclusions = new Set();

  const packageId = Number(booking?.preferred_package);
  const pkg = Number.isInteger(packageId) && packageId > 0
    ? PACKAGES.find((p) => p.id === packageId)
    : null;
  if (pkg) {
    pkg.features.forEach((f) => inclusions.add(f));
  }

  const offerName = menuPreference?.offer;
  const offer = offerName ? MENU_OFFERS.find((o) => o.name === offerName) : null;
  if (offer) {
    offer.includes.forEach((i) => inclusions.add(i));
  } else if (offerName) {
    inclusions.add(offerName);
  }

  return Array.from(inclusions);
}

function DetailRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-[#17233C] last:border-0">
      <dt className="text-slate-400 text-sm flex-shrink-0">{label}</dt>
      <dd className="text-slate-100 text-sm text-right font-medium">{children || <span className="text-slate-500">—</span>}</dd>
    </div>
  );
}

export default function BookingDetailModal({ booking, sale, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!booking) return null;

  const { menuItems, menuPreference, additionalNotes } = parseMenuData(booking);
  const dishes = extractDishes(menuItems, menuPreference);
  const inclusions = extractInclusions(booking);

  const selectionCategory = (dish) => {
    if (menuPreference?.selections) {
      if ((menuPreference.selections.appetizers || []).some((item) => item?.name === dish.name || item === dish.name)) return 'appetizers';
      if ((menuPreference.selections.mains || []).some((item) => item?.name === dish.name || item === dish.name)) return 'mains';
      if ((menuPreference.selections.addons || []).some((item) => item?.name === dish.name || item === dish.name)) return 'addons';
      if ((menuPreference.selections.sides || []).some((item) => item?.name === dish.name || item === dish.name)) return 'sides';
      if ((menuPreference.selections.desserts || []).some((item) => item?.name === dish.name || item === dish.name)) return 'desserts';
    }
    return null;
  };
  const categoryLabel = {
    appetizers: 'Appetizer',
    mains: 'Main Dish',
    addons: 'Add-on',
    sides: 'Side',
    desserts: 'Dessert',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-2xl my-6 rounded-2xl border border-[#2A3A5C] bg-[#0B1220] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2A45]">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              {sale ? 'Transaction & Booking Details' : 'Booking Details'}
            </p>
            <h3 className="text-lg font-semibold text-white">{booking.customer_name || 'Customer'}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none px-2 transition-colors cursor-pointer"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5">
          <dl>
            <DetailRow label="Booking Reference">
              <span className="font-mono text-cyan-300">{booking.booking_ref}</span>
            </DetailRow>
            <DetailRow label="Booking Status">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_CLS[booking.status] || STATUS_CLS.pending}`}>
                {STATUS_LABEL[booking.status] || 'Pending'}
              </span>
            </DetailRow>
            <DetailRow label="Booked / Transaction Date">
              {new Date(booking.created_at).toLocaleString()}
            </DetailRow>
            <DetailRow label="Event Date"> {new Date(booking.event_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</DetailRow>
            <DetailRow label="Event Type">{booking.event_type}</DetailRow>
            <DetailRow label="Number of Guests">{booking.number_of_guests?.toLocaleString()}</DetailRow>
            {booking.preferred_package && (
              <DetailRow label="Package">
                {(() => {
                  const pkg = PACKAGES.find((p) => p.id === Number(booking.preferred_package));
                  return pkg?.name || booking.preferred_package;
                })()}
              </DetailRow>
            )}
            <DetailRow label="Budget">{booking.budget ? formatCurrency(booking.budget) : '—'}</DetailRow>
            <DetailRow label="Total Amount">{booking.total_amount ? formatCurrency(booking.total_amount) : '—'}</DetailRow>
            <DetailRow label="Payment Mode">
              {booking.payment_type === 'down_payment'
                ? `Down Payment${booking.down_payment_amount ? ` · ${formatCurrency(booking.down_payment_amount)}` : ''}`
                : 'Full Payment'}
            </DetailRow>
            <DetailRow label="Payment Status">
              {booking.payment_status === 'full'
                ? 'Fully Paid'
                : booking.payment_status === 'partial'
                  ? 'Balance Due'
                  : booking.payment_status === 'failed'
                    ? 'Payment Failed'
                    : 'Pending'}
            </DetailRow>
          </dl>

          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#1E2A45] bg-[#101A2E] p-4">
              <h4 className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Customer</h4>
              <p className="text-sm font-medium text-white">{booking.customer_name}</p>
              <p className="text-xs text-slate-400 mt-1">{booking.customer_phone}</p>
              <p className="text-xs text-slate-400">{booking.customer_email}</p>
              <p className="text-xs text-slate-300 mt-2">
                <span className="text-slate-500">Address: </span>
                {booking.customer_address || '—'}
              </p>
            </div>

            <div className="rounded-xl border border-[#1E2A45] bg-[#101A2E] p-4">
              <h4 className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Menu / Food</h4>
              {dishes.length > 0 ? (
                <ul className="space-y-1.5">
                  {dishes.map((dish, index) => (
                    <li key={index} className="flex justify-between gap-3 text-sm">
                      <span className="text-slate-200">
                        {selectionCategory(dish) ? (
                          <>
                            <span className="text-slate-500 text-xs">[{categoryLabel[selectionCategory(dish)]}] </span>
                          </>
                        ) : null}
                        {dish.name}
                      </span>
                      {dish.price != null && <span className="text-gold-300 text-xs font-medium tabular-nums">{formatCurrency(dish.price)}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-600 text-sm">No menu selections recorded.</p>
              )}
              {menuPreference?.offer && (
                <p className="text-xs text-slate-400 mt-2">
                  Offer: <span className="text-slate-200">{menuPreference.offer}</span>
                </p>
              )}
            </div>
          </div>

          {inclusions.length > 0 && (
            <div className="mt-4 rounded-xl border border-[#1E2A45] bg-[#101A2E] p-4">
              <h4 className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Inclusions</h4>
              <ul className="grid sm:grid-cols-2 gap-1.5">
                {inclusions.map((item, index) => (
                  <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-gold-400 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {additionalNotes && (
            <div className="mt-4 rounded-xl border border-[#1E2A45] bg-[#101A2E] p-4">
              <h4 className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Additional Requests</h4>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{additionalNotes}</p>
            </div>
          )}

          {sale && (
            <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
              <h4 className="text-[11px] uppercase tracking-wider text-cyan-300 mb-2">Transaction</h4>
              <p className="text-sm text-slate-300">
                Paid <span className="text-gold-300 font-medium">{formatCurrency(parseFloat(sale.amount) || 0)}</span> via{' '}
                <span className="uppercase">{sale.payment_method || 'gcash'}</span> · Sale date{' '}
                {new Date(sale.sale_date).toLocaleString()} · {sale.payment_status === 'completed' ? 'Completed' : 'Pending'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}