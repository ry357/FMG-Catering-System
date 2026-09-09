import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-gold-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-elevated p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold text-charcoal">Payment Cancelled</h1>
        <p className="mt-2 text-charcoal-muted">
          Your payment was not completed. No charges were made. You can return to the booking form and try again.
        </p>
        <Button href="/book" className="mt-8">
          Return to Booking
        </Button>
        <Link to="/" className="block mt-3 text-sm text-gold-600 hover:underline">
          Return to homepage
        </Link>
      </div>
    </div>
  );
}
