import { formatCurrency } from '../../utils/helpers';

export default function PaymentSummary({ form, bookingTotal, depositAmount, bookingRef, packageName }) {
  return (
    <div className="rounded-xl border border-gold-200 bg-gold-50/50 p-5 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">Booking Reference</p>
        <p className="font-mono text-sm font-medium text-charcoal mt-1">{bookingRef}</p>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-charcoal-muted">Event</dt>
          <dd className="font-medium text-charcoal">{form.eventType}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-charcoal-muted">Date</dt>
          <dd className="font-medium text-charcoal">{form.eventDate}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-charcoal-muted">Guests</dt>
          <dd className="font-medium text-charcoal">{form.numberOfGuests}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-charcoal-muted">Package</dt>
          <dd className="font-medium text-charcoal text-right max-w-[60%]">{packageName}</dd>
        </div>
      </dl>

      <div className="border-t border-gold-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-charcoal-muted">Estimated total</span>
          <span className="font-medium text-charcoal">{formatCurrency(bookingTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-charcoal">Deposit due now (50%)</span>
          <span className="font-display text-xl font-bold text-gold-600">
            {formatCurrency(depositAmount)}
          </span>
        </div>
      </div>

      <p className="text-xs text-charcoal-muted">
        Remaining balance is due before your event date. Deposit secures your booking date.
      </p>
    </div>
  );
}
