import { useState, useEffect } from 'react';
import { EVENT_TYPES } from '../../data/landingData';
import { validateBookingForm } from '../../utils/bookingHelpers';
import {
  calculateBookingTotal,
  calculateDepositAmount,
  generateBookingRef,
  getSelectedPackageName,
} from '../../utils/paymentHelpers';
import { formatCurrency } from '../../utils/helpers';
import { getPaymentConfig } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import AuthModal from './AuthModal';
import SectionHeading from '../ui/SectionHeading';
import Button from '../ui/Button';
import PaymentSummary from '../payment/PaymentSummary';
import PaymentMethodSelector from '../payment/PaymentMethodSelector';
import GCashCheckout from '../payment/GCashCheckout';

const INITIAL_FORM = {
  name: '',
  contactNumber: '',
  email: '',
  eventType: '',
  eventDate: '',
  numberOfGuests: '',
  budget: '',
  preferredPackageId: '',
  additionalRequests: '',
  menuPreference: null,
  packageBooking: false,
};

const STEPS = [
  { id: 'details', label: 'Event Details' },
  { id: 'payment', label: 'Payment' },
  { id: 'confirmation', label: 'Confirmation' },
];

const STEP_ORDER = ['details', 'payment', 'confirmation'];

function FormField({ label, error, children, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal mb-1.5">
        {label}
        {required && <span className="text-gold-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-charcoal placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 transition-colors';

function StepIndicator({ currentStep }) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = STEP_ORDER.indexOf(step.id) < currentIndex;

        return (
          <li key={step.id} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  isActive
                    ? 'bg-gold-400 text-white'
                    : isComplete
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-white/50'
                }`}
              >
                {isComplete ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={`hidden sm:inline text-sm font-medium ${
                  isActive ? 'text-white' : isComplete ? 'text-green-300' : 'text-white/50'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`hidden sm:block w-8 h-0.5 ${isComplete ? 'bg-green-500' : 'bg-white/20'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function PaymentSuccessPanel({ paymentResult, onNewBooking }) {
  return (
    <div className="max-w-xl mx-auto text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30">
        <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h3 className="mt-6 font-display text-2xl font-semibold text-white">Booking Confirmed</h3>
      <p className="mt-2 text-white/70">
        Your deposit payment was successful. Our team will review your booking and send a confirmation email.
      </p>

      <dl className="mt-8 rounded-xl bg-white/5 border border-white/10 p-6 text-left text-sm space-y-3">
        <div className="flex justify-between">
          <dt className="text-white/60">Booking reference</dt>
          <dd className="font-mono font-medium text-white">{paymentResult.bookingRef}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-white/60">Payment method</dt>
          <dd className="font-medium text-white uppercase">{paymentResult.method}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-white/60">Amount paid</dt>
          <dd className="font-medium text-gold-300">{formatCurrency(paymentResult.amount)}</dd>
        </div>
        {paymentResult.transactionId && (
          <div className="flex justify-between gap-4">
            <dt className="text-white/60 flex-shrink-0">Transaction ID</dt>
            <dd className="font-mono text-xs text-white text-right break-all">{paymentResult.transactionId}</dd>
          </div>
        )}
      </dl>

      <Button className="mt-8" onClick={onNewBooking}>
        Book Another Event
      </Button>
    </div>
  );
}

export default function BookNow({ initialMenuBooking }) {
  const { customer } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState('details');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentType, setPaymentType] = useState('full'); // 'full' or 'down_payment'
  const [bookingRef, setBookingRef] = useState('');
  const [paymentError, setPaymentError] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState({ gcashEnabled: false });

  useEffect(() => {
    if (customer) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || customer.name,
        email: prev.email || customer.email,
      }));
    }
  }, [customer]);

  useEffect(() => {
    if (!initialMenuBooking) return;
    const { budget, guests, menuPreference } = initialMenuBooking;
    setForm((prev) => ({
      ...prev,
      budget: String(budget),
      numberOfGuests: String(guests),
      preferredPackageId: initialMenuBooking.packageId ? String(initialMenuBooking.packageId) : prev.preferredPackageId,
      packageBooking: Boolean(initialMenuBooking.packageId),
      menuPreference: menuPreference || null,
    }));
  }, [initialMenuBooking]);

  useEffect(() => {
    getPaymentConfig()
      .then((res) => {
        setPaymentConfig(res.data);
      })
      .catch((err) => {
        console.error('Payment config error:', err);
        setPaymentConfig({ gcashEnabled: false });
      });
  }, []);

  useEffect(() => {
    const handleMenuOffer = (e) => {
      const { budget, guests, menuPreference } = e.detail;
      setForm((prev) => ({
        ...prev,
        budget: String(budget),
        numberOfGuests: String(guests),
        menuPreference: menuPreference || prev.menuPreference,
      }));
      setErrors((prev) => ({ ...prev, budget: undefined, numberOfGuests: undefined }));
    };

    window.addEventListener('selectMenuOffer', handleMenuOffer);
    return () => window.removeEventListener('selectMenuOffer', handleMenuOffer);
  }, []);

  useEffect(() => {
    const handleSelectPackage = (e) => {
      setForm((prev) => ({
        ...prev,
        preferredPackageId: String(e.detail.packageId),
      }));
    };

    window.addEventListener('selectPackage', handleSelectPackage);
    return () => window.removeEventListener('selectPackage', handleSelectPackage);
  }, []);

  const bookingTotal = calculateBookingTotal(form);
  const depositAmount = calculateDepositAmount(bookingTotal);
  const packageName = form.menuPreference?.offer || getSelectedPackageName(form);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleContinueToPayment = (e) => {
    e.preventDefault();
    const validationErrors = validateBookingForm(form, 'details');

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (depositAmount <= 0) {
      setErrors({ budget: 'Unable to calculate deposit. Check guest count and package selection.' });
      return;
    }

    setErrors({});
    setPaymentError(null);
    setBookingRef(generateBookingRef());
    setStep('payment');
  };

  const handlePaymentSuccess = (result) => {
    sessionStorage.setItem('fmg_completed_booking', JSON.stringify({ form, ...result, customer }));

    setPaymentResult(result);
    setStep('confirmation');
    setPaymentError(null);
  };

  const handleNewBooking = () => {
    setForm(INITIAL_FORM);
    setStep('details');
    setPaymentMethod(null);
    setBookingRef('');
    setPaymentResult(null);
    setPaymentError(null);
    setErrors({});
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const noPaymentConfigured = !paymentConfig.gcashEnabled;

  return (
    <section id="book" className="section-padding bg-charcoal">
      <div className="section-container">
        <SectionHeading
          label="Book Now"
          title="Book & Pay for Your Event"
          description="Complete your event details, pay your deposit via GCash, and secure your booking date."
          light
        />

        <StepIndicator currentStep={step} />

        {step === 'confirmation' && paymentResult ? (
          <PaymentSuccessPanel paymentResult={paymentResult} onNewBooking={handleNewBooking} />
        ) : !customer ? (
          <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-elevated">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-50">
              <svg className="h-7 w-7 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="mt-4 font-display text-2xl font-semibold text-charcoal">Sign in to complete your booking</h3>
            <p className="mt-2 text-sm text-charcoal-muted">Sign in with Google to proceed with your event details and secure your booking.</p>
            <Button className="mt-6" onClick={() => setShowAuthModal(true)}>Sign In with Google</Button>
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-10">
            <div className="lg:col-span-3 bg-white rounded-2xl p-6 md:p-8 shadow-elevated">
              {step === 'details' && (
                <form onSubmit={handleContinueToPayment} className="space-y-5" noValidate>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <FormField label="Full Name" error={errors.name} required>
                      <input type="text" name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="Juan Dela Cruz" />
                    </FormField>
                    <FormField label="Contact Number" error={errors.contactNumber} required>
                      <input type="tel" name="contactNumber" value={form.contactNumber} onChange={handleChange} className={inputClass} placeholder="+63 912 345 6789" />
                    </FormField>
                  </div>

                  <FormField label="Email Address" error={errors.email} required>
                    <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="you@email.com" />
                  </FormField>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <FormField label="Event Type" error={errors.eventType} required>
                      <select name="eventType" value={form.eventType} onChange={handleChange} className={inputClass}>
                        <option value="">Select event type</option>
                        {EVENT_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Event Date" error={errors.eventDate} required>
                      <input type="date" name="eventDate" value={form.eventDate} onChange={handleChange} min={minDate} className={inputClass} />
                    </FormField>
                  </div>

                  <div className="rounded-xl border border-gold-200 bg-gold-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">Your selected menu plan</p>
                    <p className="mt-2 font-display text-xl font-semibold text-charcoal">{form.menuPreference?.offer || 'FMG custom menu'}</p>
                    <p className="mt-1 text-sm text-charcoal-muted">{form.numberOfGuests} guests · {form.packageBooking ? `${formatCurrency(form.budget)} estimated total` : `${formatCurrency(form.budget)} food budget`}</p>
                    {form.menuPreference?.selections && <p className="mt-3 text-sm text-charcoal-light">{[...form.menuPreference.selections.mains, ...form.menuPreference.selections.sides, ...form.menuPreference.selections.desserts].join(', ')}</p>}
                  </div>

                  <Button type="submit" size="lg" className="w-full sm:w-auto">
                    Continue to Payment
                  </Button>
                </form>
              )}

              {step === 'payment' && (
                <div className="space-y-6">
                  <PaymentSummary
                    form={form}
                    bookingTotal={bookingTotal}
                    depositAmount={depositAmount}
                    bookingRef={bookingRef}
                    packageName={packageName}
                  />

                  {/* Payment Type Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-charcoal">Payment Option</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPaymentType('full')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          paymentType === 'full'
                            ? 'border-gold-400 bg-gold-50'
                            : 'border-gray-200 hover:border-gold-300'
                        }`}
                      >
                        <div className="font-semibold text-charcoal">Full Payment</div>
                        <div className="text-sm text-gray-600">{formatCurrency(bookingTotal)}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentType('down_payment')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          paymentType === 'down_payment'
                            ? 'border-gold-400 bg-gold-50'
                            : 'border-gray-200 hover:border-gold-300'
                        }`}
                      >
                        <div className="font-semibold text-charcoal">Down Payment</div>
                        <div className="text-sm text-gray-600">{formatCurrency(depositAmount)}</div>
                        <div className="text-xs text-gray-500 mt-1">Balance due on event day</div>
                      </button>
                    </div>
                  </div>

                  {noPaymentConfigured ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                      <p className="font-semibold">Payment provider not configured</p>
                      <p className="mt-2">
                        Start the payment server and add your PayMongo (GCash) credentials.
                        See <code className="font-mono bg-amber-100 px-1 rounded">server/.env.example</code>.
                      </p>
                    </div>
                  ) : (
                    <>
                      <PaymentMethodSelector
                        selected={paymentMethod}
                        onSelect={setPaymentMethod}
                        gcashEnabled={paymentConfig.gcashEnabled}
                      />

                      {paymentError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                          {paymentError}
                        </div>
                      )}

                      {paymentMethod === 'gcash' && paymentConfig.gcashEnabled && (
                        <div className="rounded-xl border border-gray-200 p-5">
                          <p className="text-sm font-medium text-charcoal mb-4">
                            Pay {formatCurrency(paymentType === 'full' ? bookingTotal : depositAmount)} {paymentType === 'full' ? 'total' : 'deposit'} with GCash
                          </p>
                          <GCashCheckout
                            amount={paymentType === 'full' ? bookingTotal : depositAmount}
                            bookingRef={bookingRef}
                            customerName={form.name}
                            customerEmail={form.email}
                            description={`FMG Catering ${paymentType === 'full' ? 'payment' : 'deposit'} — ${packageName}`}
                            onError={setPaymentError}
                            bookingData={form}
                            paymentType={paymentType}
                          />
                        </div>
                      )}
                    </>
                  )}

                  <Button type="button" variant="secondary" onClick={() => setStep('details')}>
                    Back to Event Details
                  </Button>
                </div>
              )}
            </div>

            <aside className="lg:col-span-2 space-y-6">
              {step === 'details' && (
                <>
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h3 className="font-display text-xl font-semibold text-white">Selected Menu Plan</h3>
                    <p className="mt-2 text-sm text-white/60">Your offer, guest count, and dishes were set in the menu planner.</p>
                    <dl className="mt-5 space-y-3 text-sm">
                      <div className="flex justify-between gap-4"><dt className="text-white/50">Offer</dt><dd className="font-medium text-white text-right">{form.menuPreference?.offer || 'FMG custom menu'}</dd></div>
                      <div className="flex justify-between gap-4"><dt className="text-white/50">Guests</dt><dd className="font-medium text-white">{form.numberOfGuests}</dd></div>
                      <div className="flex justify-between gap-4"><dt className="text-white/50">{form.packageBooking ? 'Estimated total' : 'Budget'}</dt><dd className="font-medium text-gold-300">{formatCurrency(form.budget)}</dd></div>
                    </dl>
                  </div>

                  <div className="bg-gold-400/10 rounded-2xl p-6 border border-gold-400/20">
                    <h3 className="font-semibold text-gold-200">Secure Payment</h3>
                    <p className="mt-3 text-sm text-white/70">
                      A 30% deposit is required to secure your booking. Pay safely via GCash.
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-white/60">
                      <li className="flex items-center gap-2">
                        <span className="text-[#007DFE] font-bold">GC</span> GCash — Philippines mobile wallet
                      </li>
                    </ul>
                  </div>
                </>
              )}

              {step === 'payment' && (
                <div className="bg-gold-400/10 rounded-2xl p-6 border border-gold-400/20">
                  <h3 className="font-semibold text-gold-200">Payment Security</h3>
                  <ul className="mt-4 space-y-3 text-sm text-white/70 list-disc list-inside">
                    <li>Payments are processed through official PayMongo (GCash) gateway</li>
                    <li>Your card and wallet details are never stored on our servers</li>
                    <li>You will receive a payment receipt via email</li>
                    <li>Remaining balance is due before your event date</li>
                  </ul>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}