import { useState } from 'react';
import { createStripeCheckout } from '../../services/paymentService';
import Button from '../ui/Button';

export default function StripeCheckout({
  amount,
  bookingRef,
  customerName,
  customerEmail,
  description,
  onError,
  disabled,
  bookingData,
  paymentType = 'full',
}) {
  const [loading, setLoading] = useState(false);

  const handlePayWithCard = async () => {
    setLoading(true);
    try {
      const result = await createStripeCheckout({
        amount,
        bookingRef,
        customerName,
        customerEmail,
        description,
        bookingData,
        paymentType,
      });

      sessionStorage.setItem(
        'fmg_pending_booking',
        JSON.stringify({
          bookingRef,
          amount,
          method: 'card',
          sessionId: result.data.sessionId,
          paymentType,
        })
      );

      // Redirect user to Stripe's hosted secure checkout page
      window.location.href = result.data.checkoutUrl;
    } catch (error) {
      onError?.(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start sm:items-center gap-3.5 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#635BFF] text-white shadow-sm">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
            <line x1="2" y1="10" x2="22" y2="10" strokeWidth="2" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-charcoal">Pay with Credit or Debit Card</p>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-[#635BFF]/10 text-[#635BFF] border border-[#635BFF]/20">
              Stripe Secure
            </span>
          </div>
          <p className="text-sm text-charcoal-muted mt-1">
            You will be redirected to Stripe's 256-bit SSL encrypted checkout page. Accepts Visa, Mastercard, AMEX, and JCB.
          </p>
        </div>
      </div>

      <Button
        type="button"
        className="w-full !bg-[#635BFF] hover:!bg-[#5347E8] focus-visible:!ring-[#635BFF] text-white shadow-md hover:shadow-lg transition-all"
        size="lg"
        disabled={disabled || loading}
        onClick={handlePayWithCard}
      >
        {loading ? 'Redirecting to Stripe...' : 'Continue to Card Payment'}
      </Button>
    </div>
  );
}
