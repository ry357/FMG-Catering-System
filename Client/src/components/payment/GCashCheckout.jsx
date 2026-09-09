import { useState } from 'react';
import { createGCashCheckout } from '../../services/paymentService';
import Button from '../ui/Button';

export default function GCashCheckout({
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

  const handlePayWithGCash = async () => {
    setLoading(true);
    try {
      const result = await createGCashCheckout({
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
        JSON.stringify({ bookingRef, amount, method: 'gcash', sessionId: result.data.sessionId, paymentType })
      );

      window.location.href = result.data.checkoutUrl;
    } catch (error) {
      onError?.(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#007DFE] text-white font-bold text-sm">
          G
        </div>
        <div>
          <p className="font-semibold text-charcoal">Pay with GCash</p>
          <p className="text-sm text-charcoal-muted">
            You will be redirected to the secure GCash payment page to complete your deposit.
          </p>
        </div>
      </div>

      <Button
        type="button"
        className="w-full !bg-[#007DFE] hover:!bg-[#0066D6] focus-visible:!ring-[#007DFE]"
        size="lg"
        disabled={disabled || loading}
        onClick={handlePayWithGCash}
      >
        {loading ? 'Redirecting to GCash...' : 'Continue to GCash Payment'}
      </Button>
    </div>
  );
}
