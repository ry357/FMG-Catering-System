import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  EVENT_TYPES,
  MENU_OFFERS,
  MENU_TIERS,
  BOOKING_CATEGORIES,
  MENU_CHOICES,
  PLATTER_MENU,
} from '../../data/landingData';
import {
  validateBookingForm,
  validateCategoryStep,
  validateMenuStep,
  validateFoodStep,
  validateDropOffFoodStep,
  getFoodLimits,
} from '../../utils/bookingHelpers';
import {
  calculateBookingTotal,
  calculateDepositAmount,
  generateBookingRef,
  getSelectedPackageName,
  buildMenuItems,
} from '../../utils/paymentHelpers';
import { formatCurrency } from '../../utils/helpers';
import { getPaymentConfig } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import SectionHeading from '../ui/SectionHeading';
import Button from '../ui/Button';
import PaymentSummary from '../payment/PaymentSummary';
import PaymentMethodSelector from '../payment/PaymentMethodSelector';
import GCashCheckout from '../payment/GCashCheckout';

const INITIAL_FORM = {
  name: '',
  contactNumber: '',
  email: '',
  address: '',
  eventType: '',
  eventDate: '',
  numberOfGuests: '',
  budget: '',
  preferredPackageId: '',
  additionalRequests: '',
  packageBooking: false,
};

const INITIAL_SELECTIONS = { appetizers: [], mains: [], addons: [] };

const INITIAL_DROP_OFF_SELECTIONS = { mains: [], sides: [], drinks: [], fruits: [] };

const INITIAL_PLATTERS = { mains: {}, sides: {}, drinks: {}, fruits: {} };

const PLATTER_GROUPS = [
  { id: 'mains', label: 'Main Dishes', unit: '₱1,300 per platter · ₱1,500 w/ chafer' },
  { id: 'sides', label: 'Side Dishes', unit: '₱500 per platter · ₱600 w/ chafer' },
  { id: 'drinks', label: 'Drinks', unit: '₱200 per jar' },
  { id: 'fruits', label: 'Fresh Fruits', unit: '₱300 per platter' },
];

const STEPS = [
  { id: 'category', label: 'Booking Type' },
  { id: 'menu', label: 'Menu & Set' },
  { id: 'details', label: 'Event Details' },
  { id: 'food', label: 'Choose Food' },
  { id: 'payment', label: 'Payment' },
  { id: 'confirmation', label: 'Confirmation' },
];

const STEP_ORDER = ['category', 'menu', 'details', 'food', 'payment', 'confirmation'];

const FOOD_CATEGORIES = [
  { key: 'appetizers', label: 'Appetizers', choices: MENU_CHOICES.appetizers },
  { key: 'mains', label: 'Main Dishes', choices: MENU_CHOICES.mains },
  { key: 'addons', label: 'Add-ons & Sides', choices: MENU_CHOICES.addons },
];

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

function StepIndicator({ currentStep, steps = STEPS }) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < currentIndex;

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
            {index < steps.length - 1 && (
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

function ChoiceGroup({ title, choices, selected, limit, onToggle }) {
  if (!limit) return null;
  return (
    <fieldset>
      <legend className="flex w-full items-center justify-between text-sm font-semibold text-charcoal">
        <span>{title}</span>
        <span className="text-gold-600">Choose {limit} · {selected.length}/{limit}</span>
      </legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {choices.map((choice) => {
          const checked = selected.includes(choice);
          const unavailable = !checked && selected.length >= limit;
          return (
            <label key={choice} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${checked ? 'border-gold-400 bg-gold-50 text-charcoal' : 'border-gray-200 bg-white text-charcoal-light'} ${unavailable ? 'cursor-not-allowed opacity-45' : 'hover:border-gold-300'}`}>
              <input type="checkbox" checked={checked} disabled={unavailable} onChange={() => onToggle(choice)} className="h-4 w-4 rounded border-gray-300 text-gold-500 focus:ring-gold-400" />
              {choice}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function platterItemPrice(item, chafer) {
  return chafer && item.chaferPrice ? item.chaferPrice : item.price;
}

function calculatePlatterTotal(platters, chafer) {
  return PLATTER_GROUPS.reduce((sum, group) => {
    const items = PLATTER_MENU[group.id] || [];
    const quantities = platters?.[group.id] || {};
    return items.reduce((groupSum, item) => {
      const qty = Number(quantities[item.id]) || 0;
      return groupSum + qty * platterItemPrice(item, chafer);
    }, sum);
  }, 0);
}

function countPlatterItems(platters) {
  return Object.values(platters || {}).reduce((total, group) => {
    if (!group || typeof group !== 'object') return total;
    return total + Object.values(group).reduce((groupTotal, qty) => groupTotal + (Number(qty) || 0), 0);
  }, 0);
}

function buildPlatterItems(platters, chafer) {
  const items = [];
  PLATTER_GROUPS.forEach((group) => {
    const catalog = PLATTER_MENU[group.id] || [];
    Object.entries(platters?.[group.id] || {}).forEach(([id, qty]) => {
      if (!Number(qty)) return;
      const item = catalog.find((entry) => entry.id === id);
      if (!item) return;
      items.push({ name: `${qty}× ${item.name}`, category: group.id });
    });
  });
  return items;
}

function DropOffChecklist({ selections, onToggle, total, itemCount }) {
  const categories = [
    { key: 'mains', label: 'Main Dishes', items: PLATTER_MENU.mains, price: '₱1,300/platter · ₱1,500 w/ chafer' },
    { key: 'sides', label: 'Side Dishes', items: PLATTER_MENU.sides, price: '₱500/platter · ₱600 w/ chafer' },
    { key: 'drinks', label: 'Drinks', items: PLATTER_MENU.drinks, price: '₱200/jar' },
    { key: 'fruits', label: 'Fresh Fruits', items: PLATTER_MENU.fruits, price: '₱300/platter' },
  ];

  return (
    <div className="space-y-6">
      {categories.map(({ key, label, items, price }) => (
        <fieldset key={key}>
          <legend className="flex w-full items-center justify-between text-sm font-semibold text-charcoal">
            <span>{label}</span>
            <span className="text-xs font-normal text-charcoal-muted">{price}</span>
          </legend>
          {(() => {
            const grouped = items.reduce((acc, item) => {
              const sub = item.sub || 'Others';
              if (!acc[sub]) acc[sub] = [];
              acc[sub].push(item);
              return acc;
            }, {});
            return Object.entries(grouped).map(([sub, groupItems]) => (
              <div key={sub} className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">{sub}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {groupItems.map((item) => {
                    const checked = selections[key]?.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${checked ? 'border-gold-400 bg-gold-50 text-charcoal' : 'border-gray-200 bg-white text-charcoal-light hover:border-gold-300'}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggle(key, item.id)}
                          className="h-4 w-4 rounded border-gray-300 text-gold-500 focus:ring-gold-400"
                        />
                        <span className="font-medium">{item.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </fieldset>
      ))}
      <div className="flex items-center justify-between rounded-xl border border-gold-200 bg-amber-50 px-5 py-4">
        <span className="text-sm font-semibold text-charcoal">{itemCount} item(s) selected</span>
        <span className="font-display text-2xl font-bold text-gold-600">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

export default function BookNow({ initialMenuBooking }) {
  const { customer } = useAuth();
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get('category');
  const presetCategory = initialMenuBooking?.category || urlCategory || '';

  const [form, setForm] = useState(INITIAL_FORM);
  const [category, setCategory] = useState(presetCategory);
  const [tier, setTier] = useState('');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selections, setSelections] = useState(INITIAL_SELECTIONS);
  const [dropOffSelections, setDropOffSelections] = useState(INITIAL_DROP_OFF_SELECTIONS);
  const [platters, setPlatters] = useState(INITIAL_PLATTERS);
  const [includeChafer, setIncludeChafer] = useState(false);
  const [menuNotes, setMenuNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(() => (presetCategory ? 'menu' : 'category'));
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentType, setPaymentType] = useState('full');
  const [bookingRef, setBookingRef] = useState('');
  const [paymentError, setPaymentError] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState({ gcashEnabled: false });

  const packageBooking = Boolean(form.preferredPackageId);
  const offerId = selectedOffer?.id || null;
  const foodLimits = getFoodLimits({ offerId, packageId: form.preferredPackageId });
  const isDropOff = category === 'drop-off';
  const tierOffers = MENU_OFFERS.filter((offer) => offer.tier === tier && offer.category === 'natural');
  const steps = STEP_ORDER.map((id) => STEPS.find((s) => s.id === id));
  const platterTotal = calculatePlatterTotal(platters, includeChafer);
  const platterItemCount = countPlatterItems(platters);

  useEffect(() => {
    if (customer) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || customer.name,
        email: prev.email || customer.email,
      }));
    }
  }, [customer]);

  // Pre-fill the wizard when a menu set/package is chosen in the planner above.
  useEffect(() => {
    if (!initialMenuBooking) return;
    const { budget, guests, packageId, offer, tier: offerTier, category: plCategory } = initialMenuBooking;
    if (plCategory) setCategory(plCategory);
    setForm((prev) => ({
      ...prev,
      budget: plCategory === 'drop-off' ? '' : String(budget ?? ''),
      numberOfGuests: plCategory === 'drop-off' ? '' : String(guests ?? ''),
      preferredPackageId: packageId ? String(packageId) : prev.preferredPackageId,
      packageBooking: Boolean(packageId),
    }));
    if (offerTier && plCategory !== 'drop-off') setTier(offerTier);
    if (offer) setSelectedOffer(offer);
    setStep((prev) => {
      if (plCategory === 'drop-off') return 'menu';
      return prev === 'category' || prev === 'menu' ? 'details' : prev;
    });
    setErrors((prev) => ({ ...prev, budget: undefined, numberOfGuests: undefined }));
  }, [initialMenuBooking]);

  useEffect(() => {
    getPaymentConfig()
      .then((res) => setPaymentConfig(res.data))
      .catch((err) => {
        console.error('Payment config error:', err);
        setPaymentConfig({ gcashEnabled: false });
      });
  }, []);

  useEffect(() => {
    const handleMenuOffer = (e) => {
      const { budget, guests } = e.detail;
      setForm((prev) => ({ ...prev, budget: String(budget), numberOfGuests: String(guests) }));
      setErrors((prev) => ({ ...prev, budget: undefined, numberOfGuests: undefined }));
    };

    window.addEventListener('selectMenuOffer', handleMenuOffer);
    return () => window.removeEventListener('selectMenuOffer', handleMenuOffer);
  }, []);

  useEffect(() => {
    const handleSelectPackage = (e) => {
      setCategory('natural');
      setForm((prev) => ({
        ...prev,
        preferredPackageId: String(e.detail.packageId),
        packageBooking: true,
      }));
      setTier('');
      setSelectedOffer(null);
    };

    window.addEventListener('selectPackage', handleSelectPackage);
    return () => window.removeEventListener('selectPackage', handleSelectPackage);
  }, []);

  const bookingTotal = isDropOff ? platterTotal : calculateBookingTotal(form, selectedOffer);
  const depositAmount = calculateDepositAmount(bookingTotal);
  const packageName = selectedOffer?.name || getSelectedPackageName(form);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const chooseCategory = (nextCategory) => {
    setCategory(nextCategory);
    setTier('');
    setSelectedOffer(null);
    setSelections(INITIAL_SELECTIONS);
    setDropOffSelections(INITIAL_DROP_OFF_SELECTIONS);
    setPlatters(INITIAL_PLATTERS);
    setIncludeChafer(false);
    setErrors((prev) => ({ ...prev, category: undefined, tier: undefined, offer: undefined, platters: undefined, dropOffSelections: undefined }));
  };

  const chooseTier = (nextTier) => {
    setTier(nextTier);
    setSelectedOffer(null);
    setSelections(INITIAL_SELECTIONS);
    setErrors((prev) => ({ ...prev, tier: undefined, offer: undefined }));
  };

  const toggleChafer = () => setIncludeChafer((current) => !current);

  const toggleChoice = (category, choice) => {
    setSelections((current) => ({
      ...current,
      [category]: current[category].includes(choice)
        ? current[category].filter((item) => item !== choice)
        : [...current[category], choice],
    }));
    if (errors[category]) setErrors((prev) => ({ ...prev, [category]: undefined }));
  };

  const toggleDropOffChoice = (category, itemId) => {
    const nowActive = !(dropOffSelections[category] || []).includes(itemId);
    setDropOffSelections((current) => ({
      ...current,
      [category]: nowActive
        ? [...current[category], itemId]
        : current[category].filter((id) => id !== itemId),
    }));
    setPlatters((current) => ({
      ...current,
      [category]: { ...current[category], [itemId]: nowActive ? 1 : 0 },
    }));
    if (errors.dropOffSelections) setErrors((prev) => ({ ...prev, dropOffSelections: undefined }));
  };

  const handleContinueFromCategory = (e) => {
    e.preventDefault();
    const validationErrors = validateCategoryStep(category);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setStep('menu');
  };

  const handleContinueFromMenu = (e) => {
    e.preventDefault();
    const validationErrors = validateMenuStep({ category, tier, selectedOffer, packageBooking });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setStep('details');
  };

  const handleContinueToFood = (e) => {
    e.preventDefault();
    const validationErrors = validateBookingForm(form, {
      requireBudget: !isDropOff,
      requireGuests: !isDropOff,
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (!isDropOff && bookingTotal <= 0) {
      setErrors({ budget: 'Unable to calculate total. Check guest count and menu selection.' });
      return;
    }
    setErrors({});
    setStep('food');
  };

  const handleContinueToPayment = (e) => {
    e.preventDefault();
    const validationErrors = isDropOff
      ? validateDropOffFoodStep(dropOffSelections)
      : validateFoodStep(selections, foodLimits);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setPaymentError(null);
    setBookingRef(generateBookingRef());
    setStep('payment');
  };

  const menuPreference = {
    category,
    tier: selectedOffer?.tier || null,
    offer: selectedOffer?.name || (isDropOff ? 'Custom Drop-Off Order' : packageName),
    offerId: selectedOffer?.id || null,
    pricePerPax: selectedOffer?.pricePerPax || null,
    chafer: includeChafer,
    platters,
    selections,
    notes: menuNotes.trim(),
  };

  const bookingData = {
    ...form,
    contactNumber: form.contactNumber,
    bookingCategory: category,
    offerId,
    selectedMenuItems: isDropOff ? buildPlatterItems(platters, includeChafer) : buildMenuItems(selections),
    menuPreference,
    totalAmount: bookingTotal,
  };

  const handlePaymentSuccess = (result) => {
    sessionStorage.setItem('fmg_completed_booking', JSON.stringify({ form, ...result, customer }));

    setPaymentResult(result);
    setStep('confirmation');
    setPaymentError(null);
  };

  const handleNewBooking = () => {
    setForm(INITIAL_FORM);
    setCategory(presetCategory || '');
    setTier('');
    setSelectedOffer(null);
    setSelections(INITIAL_SELECTIONS);
    setDropOffSelections(INITIAL_DROP_OFF_SELECTIONS);
    setPlatters(INITIAL_PLATTERS);
    setIncludeChafer(false);
    setMenuNotes('');
    setStep('category');
    setPaymentMethod(null);
    setPaymentType('full');
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
          description="Choose a booking type, pick your menu set, tell us about your event, and secure your booking date with GCash."
          light
        />

        <StepIndicator currentStep={step} steps={steps} />

        {step === 'confirmation' && paymentResult ? (
          <PaymentSuccessPanel paymentResult={paymentResult} onNewBooking={handleNewBooking} />
        ) : (
          <div className="grid lg:grid-cols-5 gap-10">
            <div className="lg:col-span-3 bg-white rounded-2xl p-6 md:p-8 shadow-elevated">
              {step === 'category' && (
                <form onSubmit={handleContinueFromCategory} className="space-y-6" noValidate>
                  <fieldset>
                    <legend className="block text-sm font-semibold text-charcoal mb-3">
                      Choose your booking type <span className="text-gold-500">*</span>
                    </legend>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {BOOKING_CATEGORIES.map((c) => {
                        const active = category === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => chooseCategory(c.id)}
                            className={`rounded-xl border-2 p-5 text-left transition-all ${active ? 'border-gold-400 bg-gold-50' : 'border-gray-200 hover:border-gold-300'}`}
                          >
                            <div className="font-display text-lg font-semibold text-charcoal">{c.shortLabel}</div>
                          </button>
                        );
                      })}
                    </div>
                    {errors.category && <p className="mt-2 text-sm text-red-600" role="alert">{errors.category}</p>}
                  </fieldset>

                  <Button type="submit" size="lg" className="w-full sm:w-auto">
                    Continue to Menu & Set
                  </Button>
                </form>
              )}

              {step === 'menu' && (
                <form onSubmit={handleContinueFromMenu} className="space-y-6" noValidate>
                  {category === 'natural' && !packageBooking && (
                    <>
                      <fieldset>
                        <legend className="block text-sm font-semibold text-charcoal mb-3">
                          Choose your service tier <span className="text-gold-500">*</span>
                        </legend>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {MENU_TIERS.map((t) => {
                            const active = tier === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => chooseTier(t.id)}
                                className={`rounded-xl border-2 p-4 text-left transition-all ${active ? 'border-gold-400 bg-gold-50' : 'border-gray-200 hover:border-gold-300'}`}
                              >
                                <div className="font-semibold text-charcoal">{t.label}</div>
                                <p className="mt-1 text-xs leading-5 text-charcoal-muted">{t.description}</p>
                              </button>
                            );
                          })}
                        </div>
                        {errors.tier && <p className="mt-2 text-sm text-red-600" role="alert">{errors.tier}</p>}
                      </fieldset>

                      {tier && (
                        <fieldset>
                          <legend className="block text-sm font-semibold text-charcoal mb-3">
                            Choose your {tier} menu set <span className="text-gold-500">*</span>
                          </legend>
                          <div className="grid sm:grid-cols-2 gap-4">
                            {tierOffers.map((offer) => {
                              const active = selectedOffer?.id === offer.id;
                              return (
                                <button
                                  key={offer.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedOffer(offer);
                                    setSelections(INITIAL_SELECTIONS);
                                    setErrors((prev) => ({ ...prev, offer: undefined }));
                                  }}
                                  className={`rounded-xl border-2 p-4 text-left transition-all ${active ? 'border-gold-400 bg-gold-50' : 'border-gray-200 hover:border-gold-300'}`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-charcoal">{offer.name}</span>
                                    <span className="font-display text-gold-600 font-bold">{formatCurrency(offer.pricePerPax)}/pax</span>
                                  </div>
                                  <ul className="mt-2 space-y-1 text-xs text-charcoal-muted">
                                    {offer.includes.map((item) => (
                                      <li key={item} className="flex gap-1.5">
                                        <span className="text-gold-500">✓</span>{item}
                                      </li>
                                    ))}
                                  </ul>
                                </button>
                              );
                            })}
                          </div>
                          {errors.offer && <p className="mt-2 text-sm text-red-600" role="alert">{errors.offer}</p>}
                        </fieldset>
                      )}
                    </>
                  )}

{(category === 'drop-off') && (
                  <div className="space-y-5">
                    <button
                      type="button"
                      aria-pressed={includeChafer}
                      onClick={toggleChafer}
                      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${includeChafer ? 'border-gold-400 bg-gold-50' : 'border-gray-200 hover:border-gold-300'}`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-charcoal">{PLATTER_MENU.chafer.label}</span>
                        <span
                          className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${includeChafer ? 'bg-gold-400' : 'bg-gray-300'}`}
                        >
                          <span
                            className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
                            style={{ left: includeChafer ? '22px' : '2px' }}
                          />
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-charcoal-muted">{PLATTER_MENU.chafer.help}</span>
                    </button>
                    <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-charcoal-muted">
                      Next, you will pick your dishes from a simple checklist — main platters ₱1,300, side platters ₱500, drinks ₱200/jar, and fresh fruits ₱300.
                    </p>
                  </div>
                  )}

                  {packageBooking && (
                    <div className="rounded-xl border border-gold-200 bg-gold-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">Selected package</p>
                      <p className="mt-1 font-display text-xl font-semibold text-charcoal">{packageName}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-3">
                      Food requests or dietary notes <span className="font-normal text-charcoal-muted">(optional)</span>
                    </label>
                    <textarea id="food-notes" value={menuNotes} onChange={(event) => setMenuNotes(event.target.value)} rows="3" maxLength="500" placeholder="Example: no spicy food, vegetarian option needed" className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-charcoal focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20" />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {!packageBooking && !presetCategory && (
                      <Button type="button" variant="secondary" onClick={() => setStep('category')}>
                        Back to Booking Type
                      </Button>
                    )}
                    <Button type="submit" size="lg">
                      Continue to Event Details
                    </Button>
                  </div>
                </form>
              )}

              {step === 'details' && (
                <form onSubmit={handleContinueToFood} className="space-y-5" noValidate>
                  {!packageBooking && (
                    <div className="rounded-xl border border-gold-200 bg-gold-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">{isDropOff ? 'Your drop-off order' : 'Your tier & menu set'}</p>
                      <p className="mt-1 font-display text-xl font-semibold text-charcoal">
                        {isDropOff ? 'Custom platter order' : selectedOffer?.name || 'FMG custom menu'}
                      </p>
                      {isDropOff ? (
                        <p className="mt-1 text-sm text-charcoal-muted">
                          {includeChafer ? 'Chafer dish included' : 'No chafer'} · you will pick your dishes in the next step.
                        </p>
                      ) : selectedOffer && (
                        <p className="mt-1 text-sm text-charcoal-muted">
                          {formatCurrency(selectedOffer.pricePerPax)} per pax · {formatCurrency(selectedOffer.pricePerPax * (Number(form.numberOfGuests) || 0))} for {form.numberOfGuests || '—'} guests
                        </p>
                      )}
                    </div>
                  )}

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

                  <FormField label="Complete Address" error={errors.address} required>
                    <input type="text" name="address" value={form.address} onChange={handleChange} className={inputClass} placeholder="House no., Street, Barangay, City" />
                  </FormField>

                  <div className="grid sm:grid-cols-2 gap-5">
                    {!isDropOff && (
                      <FormField label="Event Type" error={errors.eventType} required>
                        <select name="eventType" value={form.eventType} onChange={handleChange} className={inputClass}>
                          <option value="">Select event type</option>
                          {EVENT_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </FormField>
                    )}
                    <FormField label="Event Date" error={errors.eventDate} required>
                      <input type="date" name="eventDate" value={form.eventDate} onChange={handleChange} min={minDate} className={inputClass} />
                    </FormField>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    {!isDropOff && (
                      <FormField label="Number of Guests" error={errors.numberOfGuests} required>
                        <input type="number" name="numberOfGuests" value={form.numberOfGuests} onChange={handleChange} min="1" step="1" className={inputClass} placeholder="50" />
                      </FormField>
                    )}
                    {!isDropOff && (
                      <FormField label={packageBooking ? 'Estimated Total (PHP)' : 'Budget (PHP)'} error={errors.budget} required>
                        <input type="number" name="budget" value={form.budget} onChange={handleChange} min="1" inputMode="numeric" className={inputClass} placeholder="15000" />
                      </FormField>
                    )}
                  </div>

                  <FormField label="Additional Requests" error={errors.additionalRequests} required={false}>
                    <textarea name="additionalRequests" value={form.additionalRequests} onChange={handleChange} rows="3" maxLength="1000" className={inputClass} placeholder="Venue notes, setup details, etc. (optional)" />
                  </FormField>

                  <div className="flex flex-wrap gap-3">
                    {!packageBooking && (
                      <Button type="button" variant="secondary" onClick={() => setStep('menu')}>
                        Back to Menu & Set
                      </Button>
                    )}
                    <Button type="submit" size="lg">
                      Continue to Food Selection
                    </Button>
                  </div>
                </form>
              )}

              {step === 'food' && (
                <form onSubmit={handleContinueToPayment} className="space-y-7" noValidate>
                  <div className="rounded-xl border border-gold-200 bg-gold-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">Your menu</p>
                    <p className="mt-1 font-display text-xl font-semibold text-charcoal">
                      {isDropOff ? 'Custom platter order' : selectedOffer?.name || packageName}
                    </p>
                    <p className="mt-1 text-sm text-charcoal-muted">
                      {isDropOff
                        ? `${platterItemCount} item(s) selected · ${includeChafer ? 'with chafer' : 'no chafer'} · ${formatCurrency(bookingTotal)} total`
                        : `${form.numberOfGuests} guests · ${formatCurrency(bookingTotal)} estimated total`}
                    </p>
                  </div>

                  {isDropOff ? (
                    <>
                      <DropOffChecklist
                        selections={dropOffSelections}
                        onToggle={toggleDropOffChoice}
                        total={platterTotal}
                        itemCount={platterItemCount}
                      />
                      {errors.dropOffSelections && (
                        <p className="text-sm text-red-600" role="alert">{errors.dropOffSelections}</p>
                      )}
                    </>
                  ) : (
                    <>
                      {FOOD_CATEGORIES.map(({ key, label, choices }) => (
                        <ChoiceGroup
                          key={key}
                          title={label}
                          choices={choices}
                          selected={selections[key]}
                          limit={foodLimits[key]}
                          onToggle={(choice) => toggleChoice(key, choice)}
                        />
                      ))}

                      {errors.mains || errors.appetizers || errors.addons ? (
                        <p className="text-sm text-red-600" role="alert">
                          {errors.appetizers || errors.mains || errors.addons}
                        </p>
                      ) : null}
                    </>
                  )}

                  <label htmlFor="food-notes" className="block text-sm font-semibold text-charcoal">
                    Food requests or dietary notes <span className="font-normal text-charcoal-muted">(optional)</span>
                  </label>
                  <textarea id="food-notes" value={menuNotes} maxLength="500" onChange={(event) => setMenuNotes(event.target.value)} rows="3" placeholder="Example: no spicy food, vegetarian option needed" className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-charcoal focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20" />

                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="secondary" onClick={() => setStep('details')}>
                      Back to Event Details
                    </Button>
                    <Button type="submit" size="lg">
                      Continue to Payment
                    </Button>
                  </div>
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

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-charcoal">Payment Option</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPaymentType('full')}
                        className={`p-4 rounded-xl border-2 transition-all ${paymentType === 'full' ? 'border-gold-400 bg-gold-50' : 'border-gray-200 hover:border-gold-300'}`}
                      >
                        <div className="font-semibold text-charcoal">Full Payment</div>
                        <div className="text-sm text-gray-600">{formatCurrency(bookingTotal)}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentType('down_payment')}
                        className={`p-4 rounded-xl border-2 transition-all ${paymentType === 'down_payment' ? 'border-gold-400 bg-gold-50' : 'border-gray-200 hover:border-gold-300'}`}
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
                            bookingData={bookingData}
                            paymentType={paymentType}
                          />
                        </div>
                      )}
                    </>
                  )}

                  <Button type="button" variant="secondary" onClick={() => setStep('food')}>
                    Back to Food Selection
                  </Button>
                </div>
              )}
            </div>

            <aside className="lg:col-span-2 space-y-6">
              {(step === 'menu' || step === 'details' || step === 'food') && (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h3 className="font-display text-xl font-semibold text-white">Your Menu Plan</h3>
                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-white/50">Type</dt><dd className="font-medium text-white text-right">{isDropOff ? 'Drop-Off' : 'Full Service'}</dd></div>
                    {!isDropOff && <div className="flex justify-between gap-4"><dt className="text-white/50">Tier</dt><dd className="font-medium text-white text-right">{selectedOffer?.tier ? MENU_TIERS.find((t) => t.id === selectedOffer.tier)?.label : '—'}</dd></div>}
                    <div className="flex justify-between gap-4"><dt className="text-white/50">Menu set</dt><dd className="font-medium text-white text-right">{isDropOff ? 'Custom platter order' : selectedOffer?.name || packageName}</dd></div>
                    {!isDropOff && <div className="flex justify-between gap-4"><dt className="text-white/50">Guests</dt><dd className="font-medium text-white">{form.numberOfGuests || '—'}</dd></div>}
                    {isDropOff && <div className="flex justify-between gap-4"><dt className="text-white/50">Items</dt><dd className="font-medium text-white">{platterItemCount} · {includeChafer ? 'with chafer' : 'no chafer'}</dd></div>}
                    {(selectedOffer || (isDropOff && platterItemCount > 0)) && <div className="flex justify-between gap-4"><dt className="text-white/50">Estimated total</dt><dd className="font-medium text-gold-300">{formatCurrency(bookingTotal)}</dd></div>}
                    {!packageBooking && !isDropOff && <div className="flex justify-between gap-4"><dt className="text-white/50">Budget</dt><dd className="font-medium text-gold-300">{formatCurrency(form.budget)}</dd></div>}
                  </dl>
                </div>
              )}

              {step === 'category' && (
                <div className="bg-gold-400/10 rounded-2xl p-6 border border-gold-400/20">
                  <h3 className="font-semibold text-gold-200">Which booking type fits you?</h3>
                  <ul className="mt-4 space-y-3 text-sm text-white/70 list-disc list-inside">
                    <li><span className="font-medium text-white">Full-Service</span> — waiters, servers, setup, and on-site coordination. Budget recommendations apply.</li>
                    <li><span className="font-medium text-white">Drop-Off</span> — build a checklist of platter mains, sides, jars of drinks, and fresh fruit. We prepare and deliver, no service staff.</li>
                  </ul>
                </div>
              )}

              {step === 'menu' && (
                <div className="bg-gold-400/10 rounded-2xl p-6 border border-gold-400/20">
                  <h3 className="font-semibold text-gold-200">Pick your menu set</h3>
                  <p className="mt-3 text-sm text-white/70">
                    {isDropOff
                      ? 'Choose whether to include a chafer serving dish, then pick your mains, sides, drinks, and fresh fruits from a checklist in the next step. With chafer, mains go to ₱1,500 and sides to ₱600.'
                      : 'Choose a service tier first, then the menu set that fits your event. Budget recommendations are only available for full-service bookings.'}
                  </p>
                </div>
              )}

              {(step === 'details' || step === 'food') && (
                <div className="bg-gold-400/10 rounded-2xl p-6 border border-gold-400/20">
                  <h3 className="font-semibold text-gold-200">What's next?</h3>
                  {step === 'details' ? (
                    <p className="mt-3 text-sm text-white/70">
                      {isDropOff
                        ? 'After your details, you will pick your dishes from a checklist before payment.'
                        : 'After your details, you will choose your appetizers, main dishes, and add-ons before payment.'}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-white/70">
                      {isDropOff
                        ? 'Tick the boxes to choose at least one dish for your drop-off order.'
                        : 'Complete the required dish selections — the chosen counts are shown next to each category.'}
                    </p>
                  )}
                </div>
              )}

              {step === 'payment' && (
                <div className="bg-gold-400/10 rounded-2xl p-6 border border-gold-400/20">
                  <h3 className="font-semibold text-gold-200">Payment Security</h3>
                  <ul className="mt-4 space-y-3 text-sm text-white/70 list-disc list-inside">
                    <li>Payments are processed through official PayMongo (GCash) gateway</li>
                    <li>Your wallet details are never stored on our servers</li>
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