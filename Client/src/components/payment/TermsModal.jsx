import { useEffect } from 'react';

export default function TermsModal({ isOpen, onClose, onAccept }) {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-charcoal/60 p-4 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
    >
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-gold-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gold-50 via-white to-gold-50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500 text-white font-bold text-sm shadow-sm">
              FMG
            </div>
            <div>
              <h2 id="terms-title" className="font-display text-lg font-semibold text-charcoal">
                Terms & Conditions
              </h2>
              <p className="text-xs text-charcoal-muted">FMG Catering Services · Client Booking Agreement</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Terms modal"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-charcoal-muted hover:bg-gray-200 hover:text-charcoal transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm text-charcoal leading-relaxed">
          <div className="rounded-xl bg-gold-50/70 border border-gold-200/60 p-4 text-xs text-charcoal-muted">
            <p className="font-semibold text-charcoal text-sm mb-1">Welcome to FMG Catering Services</p>
            Please carefully review our policies and booking terms below before completing your payment. By placing a booking and payment deposit, you acknowledge and agree to these terms.
          </div>

          <section className="space-y-2">
            <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-100 text-gold-700 text-xs font-bold">1</span>
              Reservation & Deposit Policy
            </h3>
            <ul className="list-disc list-inside space-y-1 text-charcoal-muted pl-1">
              <li>A <strong className="text-charcoal">50% down payment</strong> (or full payment) is required upon checkout to officially reserve and secure your event date.</li>
              <li>Booking dates are allocated on a first-confirmed, first-served basis. Dates are not reserved until deposit confirmation is received.</li>
              <li>The remaining balance must be paid in full on or prior to the event date before banquet setup begins.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-100 text-gold-700 text-xs font-bold">2</span>
              Cancellation & Refund Policy
            </h3>
            <ul className="list-disc list-inside space-y-1 text-charcoal-muted pl-1">
              <li><strong className="text-charcoal">14 days or more before the event:</strong> 70% refund of the deposit paid (30% retained as calendar reservation and administrative holding fee).</li>
              <li><strong className="text-charcoal">8 to 13 days before the event:</strong> 50% refund of the deposit paid.</li>
              <li><strong className="text-charcoal">7 days or fewer before the event:</strong> Deposits are strictly non-refundable due to early procurement of fresh ingredients and staff scheduling.</li>
              <li>In case of date postponement, requests must be submitted at least 10 days before the original date and are subject to schedule availability.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-100 text-gold-700 text-xs font-bold">3</span>
              Final Headcount & Menu Finalization
            </h3>
            <ul className="list-disc list-inside space-y-1 text-charcoal-muted pl-1">
              <li>Final guest count and dish selections must be confirmed at least <strong className="text-charcoal">5 business days</strong> prior to the event date.</li>
              <li>Last-minute guest additions may be accommodated depending on ingredient availability and will be billed accordingly.</li>
              <li>Reductions in guest count within 5 days of the event cannot decrease the contracted total.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-100 text-gold-700 text-xs font-bold">4</span>
              Service Duration & Drop-Off Standards
            </h3>
            <ul className="list-disc list-inside space-y-1 text-charcoal-muted pl-1">
              <li><strong className="text-charcoal">Full-Service Catering:</strong> Buffet service is staffed for up to <strong className="text-charcoal">four (4) hours</strong> starting from the agreed serving time. Additional service time incurs an overtime fee per staff member.</li>
              <li><strong className="text-charcoal">Drop-Off Catering:</strong> Food platters and chafer dishes will be delivered at the agreed delivery window. Equipment retrieval will be coordinated with the client for same-day or next-morning pickup.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-100 text-gold-700 text-xs font-bold">5</span>
              Equipment Care & Loss/Damage Liability
            </h3>
            <ul className="list-disc list-inside space-y-1 text-charcoal-muted pl-1">
              <li>All chafing dishes, serving spoons, glassware, chinaware, tablecloths, and catering paraphernalia remain the exclusive property of FMG Catering Services.</li>
              <li>The client assumes financial responsibility for any equipment broken, lost, or damaged by event guests or venue handlers during the booking period.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-100 text-gold-700 text-xs font-bold">6</span>
              Food Safety & Leftovers
            </h3>
            <ul className="list-disc list-inside space-y-1 text-charcoal-muted pl-1">
              <li>All leftover food is the property of the client upon the end of service. FMG staff can assist in packing leftovers into client-provided food containers.</li>
              <li>Due to health and sanitation standards, FMG Catering Services is not liable for foodborne illness resulting from improper post-event storage or consumption of food left unrefrigerated beyond safe food-handling limits.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-charcoal text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-100 text-gold-700 text-xs font-bold">7</span>
              Venue Ingress & Force Majeure
            </h3>
            <ul className="list-disc list-inside space-y-1 text-charcoal-muted pl-1">
              <li>The client is responsible for securing ingress/egress permits, venue power, and water access at least 2 to 3 hours prior to the agreed dining time.</li>
              <li>Neither party shall be held liable for failure to perform due to severe weather (typhoon warnings), natural disasters, road blockages, or acts of God. Rescheduling to an open calendar date will be prioritized without penalty.</li>
            </ul>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50/70">
          <p className="text-xs text-charcoal-muted text-center sm:text-left">
            By clicking &quot;I Agree &amp; Accept&quot;, you confirm you have read and agreed to these terms.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-300 text-charcoal text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
            >
              I Agree &amp; Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
