import { formatCurrency } from '../../utils/helpers';
import { getPriceBreakdown } from '../../utils/paymentHelpers';

export default function PaymentSummary({
  form,
  bookingTotal,
  depositAmount,
  bookingRef,
  packageName,
  paymentType = 'full',
  category = 'natural',
  selectedOffer = null,
  selections = null,
  platters = null,
  includeChafer = false,
}) {
  const breakdown = getPriceBreakdown({
    category,
    form,
    selectedOffer,
    selections,
    platters,
    includeChafer,
    packageId: form?.preferredPackageId,
  });

  const dueNow = paymentType === 'full' ? bookingTotal : depositAmount;
  const balanceDue = paymentType === 'full' ? 0 : Math.max(0, bookingTotal - depositAmount);

  return (
    <div className="rounded-2xl border border-gold-200 bg-white p-5 md:p-6 shadow-sm space-y-5">
      {/* Header with Reference */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold-100 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">Booking Reference</p>
          <p className="font-mono text-sm md:text-base font-bold text-charcoal">{bookingRef}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-gold-50 px-3 py-1 text-xs font-medium text-gold-700 border border-gold-200/60">
          {category === 'drop-off' ? 'Drop-Off Order' : 'Full-Service Catering'}
        </span>
      </div>

      {/* Event Details Grid */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs md:text-sm bg-gold-50/40 rounded-xl p-3 border border-gold-100/70">
        <div>
          <dt className="text-charcoal-muted text-[11px] uppercase tracking-wider">Event</dt>
          <dd className="font-semibold text-charcoal truncate">{form.eventType || '—'}</dd>
        </div>
        <div>
          <dt className="text-charcoal-muted text-[11px] uppercase tracking-wider">Date</dt>
          <dd className="font-semibold text-charcoal">{form.eventDate || '—'}</dd>
        </div>
        <div>
          <dt className="text-charcoal-muted text-[11px] uppercase tracking-wider">Guests</dt>
          <dd className="font-semibold text-charcoal">{form.numberOfGuests || '—'}</dd>
        </div>
        <div>
          <dt className="text-charcoal-muted text-[11px] uppercase tracking-wider">Package / Menu</dt>
          <dd className="font-semibold text-charcoal truncate">{packageName || '—'}</dd>
        </div>
      </dl>

      {/* Itemized Price Breakdown */}
      <div className="rounded-xl border border-gold-200/80 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-gold-100 pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
            <span className="text-gold-600">🧾</span> Price Breakdown
          </h4>
          <span className="text-[11px] font-medium text-charcoal-muted">
            {breakdown.items.length} item{breakdown.items.length === 1 ? '' : 's'}
          </span>
        </div>

        {breakdown.items.length === 0 ? (
          <p className="text-xs text-charcoal-muted italic py-1">No items selected yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm max-h-64 overflow-y-auto pr-1">
            {breakdown.items.map((item, index) => (
              <li key={index} className="py-2 flex items-start justify-between gap-3 first:pt-1 last:pb-1">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-charcoal text-xs md:text-sm">
                    {item.label}
                  </p>
                  {item.sublabel && (
                    <p className="text-[11px] leading-relaxed text-charcoal-muted">
                      {item.sublabel}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`font-mono font-semibold text-xs md:text-sm ${item.isExtra ? 'text-amber-700' : 'text-charcoal'}`}>
                    {item.isExtra ? `+${formatCurrency(item.amount)}` : formatCurrency(item.amount)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Subtotals if extra dishes or service fee exist */}
        {(breakdown.extraTotal > 0 || breakdown.serviceFee > 0) && (
          <div className="border-t border-gold-100 pt-2 space-y-1 text-xs text-charcoal-muted">
            {breakdown.baseTotal > 0 && (
              <div className="flex justify-between">
                <span>Base package rate:</span>
                <span className="font-mono">{formatCurrency(breakdown.baseTotal)}</span>
              </div>
            )}
            {breakdown.extraTotal > 0 && (
              <div className="flex justify-between text-amber-700 font-medium">
                <span>Extra dishes add-on:</span>
                <span className="font-mono">+{formatCurrency(breakdown.extraTotal)}</span>
              </div>
            )}
            {breakdown.dishesSubtotal > 0 && (
              <div className="flex justify-between">
                <span>Dishes subtotal:</span>
                <span className="font-mono">{formatCurrency(breakdown.dishesSubtotal)}</span>
              </div>
            )}
            {breakdown.serviceFee > 0 && (
              <div className="flex justify-between">
                <span>Service &amp; venue fee:</span>
                <span className="font-mono">+{formatCurrency(breakdown.serviceFee)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Total & Due Now Summary Box */}
      <div className="rounded-xl border border-gold-300 bg-gold-50/60 p-4 space-y-2.5">
        <div className="flex justify-between items-center text-sm">
          <span className="text-charcoal-muted font-medium">Estimated Total</span>
          <span className="font-mono font-bold text-base md:text-lg text-charcoal">
            {formatCurrency(bookingTotal)}
          </span>
        </div>

        <div className="flex justify-between items-center border-t border-gold-200/80 pt-2.5">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-gold-800">
              {paymentType === 'full' ? 'Full Payment Due Now' : 'Deposit Due Now (50%)'}
            </span>
            {paymentType === 'down_payment' && (
              <span className="block text-[11px] text-charcoal-muted">
                Balance due on event day: <strong className="text-charcoal font-semibold">{formatCurrency(balanceDue)}</strong>
              </span>
            )}
          </div>
          <span className="font-display text-xl md:text-2xl font-bold text-gold-600 font-mono">
            {formatCurrency(dueNow)}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-charcoal-muted text-center leading-normal">
        {paymentType === 'full'
          ? 'Full payment secures your catering booking date in full.'
          : 'A 50% deposit secures your reservation. The remaining balance is payable on or before your event date.'}
      </p>
    </div>
  );
}
