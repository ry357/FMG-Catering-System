import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyGCashPayment } from '../services/paymentService';
import { formatCurrency } from '../utils/helpers';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const method = searchParams.get('method');
  const ref = searchParams.get('ref');
  const [status, setStatus] = useState('loading');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function verifyPayment() {
      const pendingRaw = sessionStorage.getItem('fmg_pending_booking');

      if (method === 'gcash' && pendingRaw) {
        try {
          const pending = JSON.parse(pendingRaw);
          if (pending.sessionId) {
            const result = await verifyGCashPayment(pending.sessionId);
            const paymentStatus = result.data.paymentStatus || result.data.status;

            if (paymentStatus === 'paid' || paymentStatus === 'succeeded') {
              setPaymentDetails({
                method: 'gcash',
                transactionId: pending.sessionId,
                amount: pending.amount,
                bookingRef: pending.bookingRef || ref,
              });
              setStatus('success');
              sessionStorage.removeItem('fmg_pending_booking');
              return;
            }
          }

          setPaymentDetails({
            method: 'gcash',
            bookingRef: pending.bookingRef || ref,
            amount: pending.amount,
          });
          setStatus('pending');
        } catch (err) {
          setError(err.message);
          setStatus('error');
        }
        return;
      }

      if (ref) {
        setPaymentDetails({ method: method || 'unknown', bookingRef: ref });
        setStatus('success');
        return;
      }

      setStatus('unknown');
    }

    verifyPayment();
  }, [method, ref]);

  return (
    <div className="min-h-screen bg-gold-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-elevated p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto w-fit animate-pulse">
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
            <div className="mt-6 animate-pulse space-y-2">
              <Skeleton className="mx-auto h-6 w-56" />
              <Skeleton className="mx-auto h-4 w-72" />
            </div>
            <div className="mt-6 animate-pulse space-y-3 rounded-xl bg-gold-50 p-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <p className="mt-4 text-sm text-charcoal-muted">Verifying your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-6 font-display text-2xl font-semibold text-charcoal">Payment Successful</h1>
            <p className="mt-2 text-charcoal-muted">
              Your booking deposit has been received. Our team will contact you shortly to confirm details.
            </p>
            {paymentDetails && (
              <dl className="mt-6 rounded-xl bg-gold-50 p-4 text-left text-sm space-y-2">
                <div className="flex justify-between">
                  <dt className="text-charcoal-muted">Reference</dt>
                  <dd className="font-mono font-medium">{paymentDetails.bookingRef}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-charcoal-muted">Method</dt>
                  <dd className="font-medium uppercase">{paymentDetails.method}</dd>
                </div>
                {paymentDetails.amount && (
                  <div className="flex justify-between">
                    <dt className="text-charcoal-muted">Amount paid</dt>
                    <dd className="font-medium">{formatCurrency(paymentDetails.amount)}</dd>
                  </div>
                )}
                {paymentDetails.transactionId && (
                  <div className="flex justify-between">
                    <dt className="text-charcoal-muted">Transaction ID</dt>
                    <dd className="font-mono text-xs">{paymentDetails.transactionId}</dd>
                  </div>
                )}
              </dl>
            )}
          </>
        )}

        {status === 'pending' && (
          <>
            <h1 className="font-display text-2xl font-semibold text-charcoal">Payment Processing</h1>
            <p className="mt-2 text-charcoal-muted">
              Your GCash payment is being confirmed. We will notify you once it is complete.
            </p>
            {paymentDetails?.bookingRef && (
              <p className="mt-4 text-sm">
                Reference: <span className="font-mono font-medium">{paymentDetails.bookingRef}</span>
              </p>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="font-display text-2xl font-semibold text-red-600">Verification Failed</h1>
            <p className="mt-2 text-charcoal-muted">{error}</p>
          </>
        )}

        {status === 'unknown' && (
          <>
            <h1 className="font-display text-2xl font-semibold text-charcoal">Payment Status Unknown</h1>
            <p className="mt-2 text-charcoal-muted">
              If you completed a payment, please contact us with your booking reference.
            </p>
          </>
        )}

        <Button href="/book" className="mt-8">
          Back to Booking
        </Button>
        <Link to="/" className="block mt-3 text-sm text-gold-600 hover:underline">
          Return to homepage
        </Link>
      </div>
    </div>
  );
}
