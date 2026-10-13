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
  getDishPrice,
  getDishChaferPrice,
} from '../../utils/paymentHelpers';
import { useFoods } from '../../services/foodService';
import { formatCurrency } from '../../utils/helpers';
import { getPaymentConfig } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import SectionHeading from '../ui/SectionHeading';
import Button from '../ui/Button';
import FoodDishCard from '../ui/FoodDishCard';
import AddressAutocomplete from '../ui/AddressAutocomplete';
import PaymentSummary from '../payment/PaymentSummary';
import PaymentMethodSelector from '../payment/PaymentMethodSelector';
import GCashCheckout from '../payment/GCashCheckout';
import TermsModal from '../payment/TermsModal';

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

const INITIAL_DROP_OFF_SELECTIONS = { mains: [], specials: [], sides: [], drinks: [], fruits: [] };

const INITIAL_PLATTERS = { mains: {}, specials: {}, sides: {}, drinks: {}, fruits: {} };

const PLATTER_GROUPS = [
  { id: 'mains', label: 'Main Dishes', unit: '₱1,300 per platter · ₱1,500 w/ chafer' },
  { id: 'specials', label: 'Whole Lechon', unit: '₱8,000 per whole' },
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
        {required && <span className="text-gold-600 ml-0.5">*</span>}
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
  'w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-charcoal placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-colors';

function StepIndicator({ currentStep, steps = STEPS, onStepClick }) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="mb-8 overflow-x-auto pb-2 scrollbar-thin">
      <nav aria-label="Booking Progress" className="flex items-center min-w-max mx-auto justify-between max-w-4xl px-2 gap-2">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isComplete = index < currentIndex;
          const canClick = isComplete && Boolean(onStepClick);

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                disabled={!canClick}
                onClick={() => canClick && onStepClick(step.id)}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left ${
                  isActive
                    ? 'bg-gold-500/15 border border-gold-400/40'
                    : isComplete
                      ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                      : 'bg-transparent border border-transparent'
                } ${canClick ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {isComplete ? (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                ) : (
                  <span
                    className={`h-2 w-2 rounded-full transition-all shrink-0 ${
                      isActive ? 'bg-gold-400 ring-4 ring-gold-400/30' : 'bg-white/20'
                    }`}
                  />
                )}
                <span
                  className={`text-xs font-semibold whitespace-nowrap tracking-wide transition-colors ${
                    isActive ? 'text-gold-300' : isComplete ? 'text-emerald-300' : 'text-white/40'
                  }`}
                >
                  {step.label}
                </span>
              </button>

              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-3 h-0.5 min-w-[20px] rounded-full overflow-hidden bg-white/10">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isComplete ? 'bg-emerald-500 w-full' : isActive ? 'bg-gold-500/50 w-1/2' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
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

function ChoiceGroup({ title, categoryKey, choices, selected, limit, onToggle, onIncrease, onDecrease }) {
  const hasLimit = limit != null && limit > 0;
  return (
    <fieldset>
      <legend className="flex w-full items-baseline justify-between text-black mb-3 pb-1 border-b border-gray-200">
        <span className="text-base sm:text-lg font-bold text-black tracking-tight">{title}</span>
        {hasLimit ? (
          <span className="text-sm sm:text-base font-bold text-black bg-gray-100 px-3 py-1 rounded-full border border-gray-300">
            {selected.length < limit
              ? `${selected.length}/${limit} included in set`
              : `${limit} included in set${selected.length > limit ? ` · +${selected.length - limit} quantity` : ''}`}
          </span>
        ) : (
          <span className="text-sm sm:text-base font-bold text-black bg-gray-100 px-3 py-1 rounded-full border border-gray-300">
            {selected.length} selected
          </span>
        )}
      </legend>
      <div className="mt-2 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {choices.map((choice) => {
          const quantity = selected.filter((item) => item === choice).length;
          const checked = quantity > 0;
          const price = getDishPrice(choice, categoryKey);
          const choiceIndex = selected.indexOf(choice);
          const isExtra = hasLimit && checked && choiceIndex >= limit;

          let sublabel;
          if (hasLimit) {
            if (!checked) {
              sublabel = selected.length < limit ? 'Included in set' : `+${formatCurrency(price)}`;
            } else if (quantity === 1) {
              sublabel = isExtra ? `+${formatCurrency(price)}` : 'Included in set';
            } else {
              sublabel = isExtra
                ? `+${formatCurrency(price * (quantity - Math.max(0, limit - (selected.length - quantity))))}`
                : 'Included in set';
            }
          } else {
            sublabel = quantity > 1 ? formatCurrency(price * quantity) : formatCurrency(price);
          }

          return (
            <FoodDishCard
              key={choice}
              dish={{ name: choice }}
              selectable={true}
              selected={checked}
              quantity={quantity}
              disabled={false}
              onSelect={() => onToggle(choice)}
              onIncrease={() => onIncrease(choice)}
              onDecrease={() => onDecrease(choice)}
              compact={true}
              showPrice={!hasLimit || isExtra}
              price={price}
              sublabel={sublabel}
            />
          );
        })}
      </div>
    </fieldset>
  );
}

function platterItemPrice(item, chafer) {
  const base = getDishPrice(item.name || item.id, item.category) ?? item.price;
  const chaferP = getDishChaferPrice(item.name || item.id, item.chaferPrice);
  return chafer && chaferP ? chaferP : base;
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

function DropOffChecklist({ selections, platters, onToggle, onIncrease, onDecrease, total, itemCount }) {
  const categories = [
    { key: 'mains', label: 'Main Dishes', items: PLATTER_MENU.mains, price: '₱1,300/platter · ₱1,500 w/ chafer' },
    { key: 'specials', label: 'Whole Lechon', items: PLATTER_MENU.specials, price: '₱8,000/whole' },
    { key: 'sides', label: 'Side Dishes', items: PLATTER_MENU.sides, price: '₱500/platter · ₱600 w/ chafer' },
    { key: 'drinks', label: 'Drinks', items: PLATTER_MENU.drinks, price: '₱200/jar' },
    { key: 'fruits', label: 'Fresh Fruits', items: PLATTER_MENU.fruits, price: '₱300/platter' },
  ];

  return (
    <div className="space-y-6">
      {categories.map(({ key, label, items, price }) => (
        <fieldset key={key}>
          <legend className="flex w-full items-baseline justify-between text-black mb-3 pb-1 border-b border-gray-200">
            <span className="text-base sm:text-lg font-bold text-black tracking-tight">{label}</span>
            <span className="text-xs sm:text-sm font-semibold text-black bg-gray-100 px-3 py-1 rounded-full border border-gray-300">{price}</span>
          </legend>
          {(() => {
            const grouped = items.reduce((acc, item) => {
              const sub = item.sub || 'Others';
              if (!acc[sub]) acc[sub] = [];
              acc[sub].push(item);
              return acc;
            }, {});
            const subs = Object.entries(grouped);
            return subs.map(([sub, groupItems], subIndex) => (
              <div key={sub} className="mt-3">
                {subs.length > 1 && (
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">{sub}</p>
                )}
                <div className="mt-2.5 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {groupItems.map((item) => {
                    const qty = Number(platters?.[key]?.[item.id]) || 0;
                    const checked = qty > 0;
                    const unitPrice = platterItemPrice(item, false);
                    return (
                      <FoodDishCard
                        key={item.id}
                        dish={item}
                        price={unitPrice}
                        selectable={true}
                        selected={checked}
                        quantity={qty}
                        onSelect={() => onToggle(key, item.id)}
                        onIncrease={() => onIncrease(key, item.id)}
                        onDecrease={() => onDecrease(key, item.id)}
                        compact={true}
                        showPrice={true}
                        sublabel={qty > 1 ? `${qty} platters · ${formatCurrency(unitPrice * qty)}` : null}
                      />
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </fieldset>
      ))}
      <div className="flex items-center justify-between rounded-xl border border-gold-200 bg-gold-50 px-5 py-4">
        <span className="text-sm font-semibold text-charcoal">{itemCount} item(s) selected</span>
        <span className="font-display text-2xl font-bold text-gold-600">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

export default function BookNow({ initialMenuBooking, onBackToPackages }) {
  const { customer, refreshCustomer } = useAuth();
  const { foods } = useFoods();
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingPaymentAction, setPendingPaymentAction] = useState(null);
  const [customEventType, setCustomEventType] = useState('');
  const [slideDirection, setSlideDirection] = useState('right'); // 'right' (forward) or 'left' (backward)

  const goToStep = (nextStep, customDir) => {
    const currentIdx = STEP_ORDER.indexOf(step);
    const nextIdx = STEP_ORDER.indexOf(nextStep);
    const dir = customDir || (nextIdx >= currentIdx ? 'right' : 'left');
    setSlideDirection(dir);
    setStep(nextStep);
  };

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
      const defaultAddr = Array.isArray(customer.saved_addresses)
        ? customer.saved_addresses.find((a) => a.isDefault)?.address || customer.saved_addresses[0]?.address
        : customer.address;

      setForm((prev) => ({
        ...prev,
        name: prev.name || customer.name,
        email: prev.email || customer.email,
        contactNumber: prev.contactNumber || customer.phone || '',
        address: prev.address || defaultAddr || '',
      }));
    }
  }, [customer]);

  // Handle Order Replication from Customer Profile
  useEffect(() => {
    const replicateRaw = sessionStorage.getItem('fmg_replicate_order');
    if (replicateRaw) {
      try {
        const rep = JSON.parse(replicateRaw);
        if (rep.replicate) {
          if (rep.bookingCategory) setCategory(rep.bookingCategory);
          if (rep.eventType) {
            const isPredefined = EVENT_TYPES.includes(rep.eventType);
            if (isPredefined) {
              setForm((prev) => ({ ...prev, eventType: rep.eventType }));
              setCustomEventType('');
            } else {
              setForm((prev) => ({ ...prev, eventType: 'Other' }));
              setCustomEventType(rep.eventType);
            }
          }
          if (rep.numberOfGuests) setForm((prev) => ({ ...prev, numberOfGuests: String(rep.numberOfGuests) }));
          if (rep.preferredPackageId) {
            setForm((prev) => ({
              ...prev,
              preferredPackageId: String(rep.preferredPackageId),
              packageBooking: true,
            }));
          }
          if (rep.additionalRequests) {
            setForm((prev) => ({ ...prev, additionalRequests: rep.additionalRequests }));
          }

          if (rep.menuPreference) {
            const mp = rep.menuPreference;
            if (mp.tier) setTier(mp.tier);
            if (mp.offerId) {
              const matchedOffer = MENU_OFFERS.find((o) => o.id === mp.offerId);
              if (matchedOffer) setSelectedOffer(matchedOffer);
            }
            if (mp.chafer !== undefined) setIncludeChafer(Boolean(mp.chafer));
            if (mp.platters) setPlatters(mp.platters);
            if (mp.selections) setSelections(mp.selections);
            if (mp.notes) setMenuNotes(mp.notes);
          }

          // Jump directly to event details step to confirm event date
          setStep('details');
        }
      } catch (err) {
        console.error('Failed to parse replicate order data:', err);
      } finally {
        sessionStorage.removeItem('fmg_replicate_order');
      }
    }
  }, []);

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
      if (!offer && !packageId) return prev === 'category' ? 'menu' : prev;
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

  const bookingTotal = isDropOff ? platterTotal : calculateBookingTotal(form, selectedOffer, selections);
  const depositAmount = calculateDepositAmount(bookingTotal);
  const packageName = getSelectedPackageName(form, selectedOffer, tier);

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

  const handleChoiceIncrease = (categoryKey, choice) => {
    setSelections((current) => ({
      ...current,
      [categoryKey]: [...(current[categoryKey] || []), choice],
    }));
    if (errors[categoryKey]) setErrors((prev) => ({ ...prev, [categoryKey]: undefined }));
    if (errors.mains) setErrors((prev) => ({ ...prev, mains: undefined }));
  };

  const handleChoiceDecrease = (categoryKey, choice) => {
    setSelections((current) => {
      const list = current[categoryKey] || [];
      const idx = list.lastIndexOf(choice);
      if (idx === -1) return current;
      const nextList = [...list];
      nextList.splice(idx, 1);
      return {
        ...current,
        [categoryKey]: nextList,
      };
    });
    if (errors[categoryKey]) setErrors((prev) => ({ ...prev, [categoryKey]: undefined }));
    if (errors.mains) setErrors((prev) => ({ ...prev, mains: undefined }));
  };

  const toggleChoice = (categoryKey, choice) => {
    const list = selections[categoryKey] || [];
    const count = list.filter((item) => item === choice).length;
    if (count > 0) {
      setSelections((current) => ({
        ...current,
        [categoryKey]: (current[categoryKey] || []).filter((item) => item !== choice),
      }));
    } else {
      handleChoiceIncrease(categoryKey, choice);
    }
    if (errors[categoryKey]) setErrors((prev) => ({ ...prev, [categoryKey]: undefined }));
    if (errors.mains) setErrors((prev) => ({ ...prev, mains: undefined }));
  };

  const handleDropOffQuantityChange = (categoryKey, itemId, delta) => {
    setPlatters((currentPlatters) => {
      const currentQty = Number(currentPlatters?.[categoryKey]?.[itemId]) || 0;
      const nextQty = Math.max(0, currentQty + delta);

      setDropOffSelections((currentSelections) => {
        const list = currentSelections[categoryKey] || [];
        if (nextQty > 0 && !list.includes(itemId)) {
          return { ...currentSelections, [categoryKey]: [...list, itemId] };
        }
        if (nextQty === 0 && list.includes(itemId)) {
          return { ...currentSelections, [categoryKey]: list.filter((id) => id !== itemId) };
        }
        return currentSelections;
      });

      if (errors.dropOffSelections) {
        setErrors((prev) => ({ ...prev, dropOffSelections: undefined }));
      }

      return {
        ...currentPlatters,
        [categoryKey]: {
          ...(currentPlatters[categoryKey] || {}),
          [itemId]: nextQty,
        },
      };
    });
  };

  const toggleDropOffChoice = (categoryKey, itemId) => {
    const currentQty = Number(platters?.[categoryKey]?.[itemId]) || 0;
    if (currentQty > 0) {
      handleDropOffQuantityChange(categoryKey, itemId, -currentQty);
    } else {
      handleDropOffQuantityChange(categoryKey, itemId, 1);
    }
  };

  const handleContinueFromCategory = (e) => {
    e.preventDefault();
    const validationErrors = validateCategoryStep(category);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    goToStep('menu', 'right');
  };

  const handleContinueFromMenu = (e) => {
    e.preventDefault();
    const validationErrors = validateMenuStep({ category, tier, selectedOffer, packageBooking });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    goToStep('details', 'right');
  };

  const effectiveEventType = form.eventType === 'Other' && customEventType.trim()
    ? customEventType.trim()
    : form.eventType;

  const handleContinueToFood = (e) => {
    e.preventDefault();
    const validationForm = {
      ...form,
      eventType: effectiveEventType,
    };
    const validationErrors = validateBookingForm(validationForm, {
      requireBudget: false,
      requireGuests: !isDropOff,
      requireEventType: !isDropOff,
    });
    if (!isDropOff && form.eventType === 'Other' && !customEventType.trim()) {
      validationErrors.customEventType = 'Please specify your event type';
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (!isDropOff && bookingTotal <= 0) {
      setErrors({ budget: 'Unable to calculate total. Check guest count and menu selection.' });
      return;
    }
    setErrors({});
    goToStep('food', 'right');
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
    goToStep('payment', 'right');
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
    eventType: effectiveEventType,
    contactNumber: form.contactNumber,
    bookingCategory: category,
    offerId,
    selectedMenuItems: isDropOff ? buildPlatterItems(platters, includeChafer) : buildMenuItems(selections),
    menuPreference,
    totalAmount: bookingTotal,
  };

  const handlePaymentSuccess = (result) => {
    sessionStorage.setItem('fmg_completed_booking', JSON.stringify({ form: { ...form, eventType: effectiveEventType }, ...result, customer }));

    setPaymentResult(result);
    setStep('confirmation');
    setPaymentError(null);
    if (refreshCustomer) {
      refreshCustomer();
    }
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
    setCustomEventType('');
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
          description="Pick a booking type, choose your menu, and pay securely with GCash."
          light
        />

        <StepIndicator currentStep={step} steps={steps} onStepClick={(targetStep) => goToStep(targetStep)} />

        {step === 'confirmation' && paymentResult ? (
          <PaymentSuccessPanel paymentResult={paymentResult} onNewBooking={handleNewBooking} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
            <div className="w-full flex-1 bg-white rounded-2xl p-6 sm:p-8 lg:p-10 shadow-elevated border border-gray-100/80 overflow-hidden relative min-w-0">
              <div
                key={step}
                className={slideDirection === 'right' ? 'slide-in-right' : 'slide-in-left'}
              >
                {step === 'category' && (
                <form onSubmit={handleContinueFromCategory} className="space-y-6" noValidate>
                  <fieldset>
                    <legend className="block text-sm font-semibold text-charcoal mb-3">
                      Choose your booking type <span className="text-gold-600">*</span>
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
                            <div className="text-lg font-bold text-charcoal">{c.shortLabel}</div>
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
                        <legend className="block text-sm font-bold text-charcoal mb-3">
                          Choose your service tier <span className="text-gold-600">*</span>
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
                                <div className="font-bold text-charcoal">{t.label}</div>
                                <p className="mt-1 text-xs font-normal leading-5 text-charcoal-muted">{t.description}</p>
                              </button>
                            );
                          })}
                        </div>
                        {errors.tier && <p className="mt-2 text-sm text-red-600" role="alert">{errors.tier}</p>}
                      </fieldset>

                      {tier && (
                        <fieldset>
                          <div className="flex items-center justify-between mb-3">
                            <legend className="block text-sm font-bold text-charcoal">
                              Choose your {tier} menu set <span className="text-xs font-normal text-charcoal-muted">(optional)</span>
                            </legend>
                            {selectedOffer && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOffer(null);
                                  setSelections(INITIAL_SELECTIONS);
                                }}
                                className="text-xs font-medium text-gold-600 hover:text-gold-700 underline"
                              >
                                Clear set (Custom menu)
                              </button>
                            )}
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            {tierOffers.map((offer) => {
                              const active = selectedOffer?.id === offer.id;
                              return (
                                <button
                                  key={offer.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedOffer(active ? null : offer);
                                    setSelections(INITIAL_SELECTIONS);
                                    setErrors((prev) => ({ ...prev, offer: undefined }));
                                  }}
                                  className={`rounded-xl border-2 p-4 text-left transition-all ${active ? 'border-gold-400 bg-gold-50 ring-2 ring-gold-400/40' : 'border-gray-200 hover:border-gold-300'}`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-charcoal">{offer.name}</span>
                                    <span className="text-gold-600 font-bold text-sm sm:text-base">{formatCurrency(offer.pricePerPax)}/pax</span>
                                  </div>
                                  <ul className="mt-2 space-y-1 text-xs font-normal text-charcoal-muted">
                                    {offer.includes.map((item) => (
                                      <li key={item} className="flex gap-1.5">
                                        <span className="text-gold-600">✓</span>{item}
                                      </li>
                                    ))}
                                  </ul>
                                </button>
                              );
                            })}
                          </div>
                          <p className="mt-3 text-xs font-normal text-charcoal-muted">
                            Choose a set for bundled per-pax pricing with included dishes, or leave unselected to customize dishes à la carte.
                          </p>
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
                      Pick dishes from a checklist — mains ₱1,300, sides ₱500, drinks ₱200/jar, fruits ₱300.
                    </p>
                  </div>
                  )}

                  {packageBooking && (
                    <div className="rounded-xl border border-gold-200 bg-gold-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">Selected package</p>
                      <p className="mt-1 text-xl font-bold text-charcoal">{packageName}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-charcoal mb-3">
                      Food requests or dietary notes <span className="font-normal text-charcoal-muted">(optional)</span>
                    </label>
                    <textarea id="food-notes" value={menuNotes} onChange={(event) => setMenuNotes(event.target.value)} rows="3" maxLength="500" className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-charcoal focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 font-normal" />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {!packageBooking && !presetCategory && (
                      <Button type="button" variant="secondary" onClick={() => goToStep('category', 'left')}>
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
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">{isDropOff ? 'Your drop-off order' : 'Your tier & menu set'}</p>
                      <p className="mt-1 text-xl font-bold text-charcoal">
                        {isDropOff ? 'Custom platter order' : selectedOffer?.name || 'FMG custom menu'}
                      </p>
                      {isDropOff ? (
                        <p className="mt-1 text-sm font-normal text-charcoal-muted">
                          {includeChafer ? 'Chafer dish included' : 'No chafer'} · you will pick your dishes in the next step.
                        </p>
                      ) : selectedOffer && (
                        <p className="mt-1 text-sm font-normal text-charcoal-muted">
                          {formatCurrency(selectedOffer.pricePerPax)} per pax · {formatCurrency(selectedOffer.pricePerPax * (Number(form.numberOfGuests) || 0))} for {form.numberOfGuests || '—'} guests
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <FormField label="Full Name" error={errors.name} required>
                      <input type="text" name="name" value={form.name} onChange={handleChange} className={inputClass} />
                    </FormField>
                    <FormField label="Contact Number" error={errors.contactNumber} required>
                      <input type="tel" name="contactNumber" value={form.contactNumber} onChange={handleChange} className={inputClass} />
                    </FormField>
                    <FormField label="Email Address" error={errors.email} required>
                      <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} />
                    </FormField>
                  </div>

                  <div className="grid lg:grid-cols-12 gap-5 items-start">
                    <div className="lg:col-span-8">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-charcoal">
                          Event Venue or Establishment <span className="text-gold-600 ml-0.5">*</span>
                        </label>
                        {customer?.saved_addresses && customer.saved_addresses.length > 0 && (
                          <select
                            className="text-xs font-semibold text-gold-700 bg-gold-50 border border-gold-200 rounded-lg px-2 py-1 cursor-pointer hover:bg-gold-100"
                            onChange={(e) => {
                              if (e.target.value) {
                                const found = customer.saved_addresses.find((a) => a.id === e.target.value);
                                if (found) {
                                  setForm((prev) => ({
                                    ...prev,
                                    address: found.address,
                                    contactNumber: found.contactPhone || prev.contactNumber,
                                  }));
                                }
                              }
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>
                              📍 Pick saved venue ({customer.saved_addresses.length})
                            </option>
                            {customer.saved_addresses.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.label} — {a.address.slice(0, 30)}...
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <AddressAutocomplete
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="e.g. Grand Convention Center, Cebu City"
                      />
                      {errors.address && (
                        <p className="mt-1 text-sm text-red-600" role="alert">
                          {errors.address}
                        </p>
                      )}
                    </div>
                    <div className="lg:col-span-4">
                      <FormField label="Event Date" error={errors.eventDate} required>
                        <input type="date" name="eventDate" value={form.eventDate} onChange={handleChange} min={minDate} className={inputClass} />
                      </FormField>
                    </div>
                  </div>

                  {!isDropOff && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      <FormField label="Event Type" error={errors.eventType} required>
                        <select
                          name="eventType"
                          value={form.eventType}
                          onChange={(e) => {
                            handleChange(e);
                            if (e.target.value !== 'Other') {
                              setCustomEventType('');
                              if (errors.customEventType) {
                                setErrors((prev) => ({ ...prev, customEventType: undefined }));
                              }
                            }
                          }}
                          className={inputClass}
                        >
                          <option value="">Select event type</option>
                          {EVENT_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </FormField>
                      <FormField label="Number of Guests" error={errors.numberOfGuests} required>
                        <input type="number" name="numberOfGuests" value={form.numberOfGuests} onChange={handleChange} min="70" step="1" className={inputClass} />
                      </FormField>
                      <FormField label={packageBooking ? 'Estimated Total (PHP, optional)' : 'Budget (PHP, optional)'} error={errors.budget}>
                        <input type="number" name="budget" value={form.budget} onChange={handleChange} min="1" inputMode="numeric" className={inputClass} />
                      </FormField>
                    </div>
                  )}

                  {!isDropOff && form.eventType === 'Other' && (
                    <FormField label="Please specify your event" error={errors.customEventType} required>
                      <input
                        type="text"
                        name="customEventType"
                        value={customEventType}
                        onChange={(e) => {
                          setCustomEventType(e.target.value);
                          if (errors.customEventType) {
                            setErrors((prev) => ({ ...prev, customEventType: undefined }));
                          }
                        }}
                        placeholder="e.g. Christening, Graduation, Reunion, Product Launch"
                        className={inputClass}
                        maxLength={100}
                        autoFocus
                      />
                    </FormField>
                  )}

                  <FormField label="Additional Requests" error={errors.additionalRequests} required={false}>
                    <textarea name="additionalRequests" value={form.additionalRequests} onChange={handleChange} rows="3" maxLength="1000" className={inputClass} />
                  </FormField>

                  <div className="flex flex-wrap gap-3">
                    {onBackToPackages ? (
                      <Button type="button" variant="secondary" onClick={onBackToPackages}>
                        Back to Packages
                      </Button>
                    ) : !packageBooking && (
                      <Button type="button" variant="secondary" onClick={() => goToStep('menu', 'left')}>
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
                  <div className="rounded-xl border border-gray-300 bg-gray-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-black">Your menu</p>
                    <p className="mt-1 text-2xl font-bold text-black">
                      {isDropOff ? 'Custom platter order' : selectedOffer?.name || packageName}
                    </p>
                    <p className="mt-1 text-sm font-normal text-charcoal-muted">
                      {isDropOff
                        ? `${platterItemCount} item(s) selected · ${includeChafer ? 'with chafer' : 'no chafer'} · ${formatCurrency(bookingTotal)} total`
                        : `${form.numberOfGuests} guests · ${formatCurrency(bookingTotal)} estimated total`}
                    </p>
                  </div>

                  {isDropOff ? (
                    <>
                      <DropOffChecklist
                        selections={dropOffSelections}
                        platters={platters}
                        onToggle={toggleDropOffChoice}
                        onIncrease={(categoryKey, itemId) => handleDropOffQuantityChange(categoryKey, itemId, 1)}
                        onDecrease={(categoryKey, itemId) => handleDropOffQuantityChange(categoryKey, itemId, -1)}
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
                          categoryKey={key}
                          choices={choices}
                          selected={selections[key]}
                          limit={foodLimits ? foodLimits[key] : null}
                          onToggle={(choice) => toggleChoice(key, choice)}
                          onIncrease={(choice) => handleChoiceIncrease(key, choice)}
                          onDecrease={(choice) => handleChoiceDecrease(key, choice)}
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
                  <textarea id="food-notes" value={menuNotes} maxLength="500" onChange={(event) => setMenuNotes(event.target.value)} rows="3" className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-charcoal focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20" />

                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="secondary" onClick={() => goToStep('details', 'left')}>
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
                    form={{ ...form, eventType: effectiveEventType }}
                    bookingTotal={bookingTotal}
                    depositAmount={depositAmount}
                    bookingRef={bookingRef}
                    packageName={packageName}
                    paymentType={paymentType}
                    category={category}
                    selectedOffer={selectedOffer}
                    selections={selections}
                    platters={platters}
                    includeChafer={includeChafer}
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
                        onSelect={(methodId) => {
                          if (methodId === 'gcash') {
                            if (!agreedToTerms) {
                              setShowTermsModal(true);
                              setPendingPaymentAction(() => () => setPaymentMethod('gcash'));
                            } else {
                              setPaymentMethod('gcash');
                            }
                          } else {
                            setPaymentMethod(methodId);
                          }
                        }}
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
                            disabled={false}
                            agreedToTerms={agreedToTerms}
                            onRequestTerms={(onConfirm) => {
                              setPendingPaymentAction(() => onConfirm);
                              setShowTermsModal(true);
                            }}
                            bookingData={bookingData}
                            paymentType={paymentType}
                          />
                        </div>
                      )}
                    </>
                  )}

                  <Button type="button" variant="secondary" onClick={() => goToStep('food', 'left')}>
                    Back to Food Selection
                  </Button>
                </div>
              )}
              </div>
            </div>

            <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-6 lg:sticky lg:top-24 self-start">
              {(step === 'menu' || step === 'details' || step === 'food' || step === 'payment') && (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white">Your Menu Plan</h3>
                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-white/50">Type</dt><dd className="font-medium text-white text-right">{isDropOff ? 'Drop-Off' : 'Full Service'}</dd></div>
                    {!isDropOff && <div className="flex justify-between gap-4"><dt className="text-white/50">Tier</dt><dd className="font-medium text-white text-right">{selectedOffer?.tier ? MENU_TIERS.find((t) => t.id === selectedOffer.tier)?.label : (tier ? MENU_TIERS.find((t) => t.id === tier)?.label : '—')}</dd></div>}
                    <div className="flex justify-between gap-4"><dt className="text-white/50">Menu set</dt><dd className="font-medium text-white text-right">{isDropOff ? 'Custom platter order' : selectedOffer?.name || packageName}</dd></div>
                    {!isDropOff && <div className="flex justify-between gap-4"><dt className="text-white/50">Guests</dt><dd className="font-medium text-white">{form.numberOfGuests || '—'}</dd></div>}
                    {isDropOff && <div className="flex justify-between gap-4"><dt className="text-white/50">Items</dt><dd className="font-medium text-white">{platterItemCount} · {includeChafer ? 'with chafer' : 'no chafer'}</dd></div>}
                    {(selectedOffer || packageBooking || (isDropOff && platterItemCount > 0) || bookingTotal > 0) && <div className="flex justify-between gap-4"><dt className="text-white/50">Estimated total</dt><dd className="font-medium text-gold-300">{formatCurrency(bookingTotal)}</dd></div>}
                    {!packageBooking && !isDropOff && <div className="flex justify-between gap-4"><dt className="text-white/50">Budget</dt><dd className="font-medium text-gold-300">{formatCurrency(form.budget)}</dd></div>}
                  </dl>
                </div>
              )}

              {step === 'category' && (
                <div className="bg-gold-400/10 rounded-2xl p-6 border border-gold-400/20">
                  <h3 className="font-semibold text-gold-200">Which booking type fits you?</h3>
                  <ul className="mt-4 space-y-3 text-sm text-white/70 list-disc list-inside">
                    <li><span className="font-medium text-white">Full-Service</span> — waiters, servers, setup, and on-site coordination. Budget recommendations apply.</li>
                    <li><span className="font-medium text-white">Drop-Off</span> — build a platter checklist; we prepare and deliver, no service staff.</li>
                  </ul>
                </div>
              )}

              {step === 'menu' && (
                <div className="bg-gold-400/10 rounded-2xl p-6 border border-gold-400/20">
                  <h3 className="font-semibold text-gold-200">Pick your menu set</h3>
                  <p className="mt-3 text-sm text-white/70">
                    {isDropOff
                      ? 'Add a chafer dish if you want mains and sides kept warm, then pick your dishes next. With chafer: mains ₱1,500, sides ₱600.'
                      : 'Pick a service tier, then the menu set that fits your event. Budget recommendations apply to full-service only.'}
                  </p>
                </div>
              )}

              {(step === 'details' || step === 'food') && (
                <div className="bg-gold-400/10 rounded-2xl p-6 border border-gold-400/20">
                  <h3 className="font-semibold text-gold-200">What's next?</h3>
                  {step === 'details' ? (
                    <p className="mt-3 text-sm text-white/70">
                      {isDropOff
                        ? 'Next, pick your dishes from a checklist before payment.'
                        : 'Next, choose appetizers, mains, and add-ons before payment.'}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-white/70">
                      {isDropOff
                        ? 'Tick at least one dish for your drop-off order.'
                        : 'Complete the required dish selections — counts show next to each category.'}
                    </p>
                  )}
                </div>
              )}

              {step === 'payment' && (
                <div className="bg-gold-400/10 rounded-2xl p-6 border border-gold-400/20 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gold-200">Payment Security</h3>
                    <ul className="mt-3 space-y-2.5 text-sm text-white/70 list-disc list-inside">
                      <li>Payments are processed through official PayMongo (GCash) gateway</li>
                      <li>Your wallet details are never stored on our servers</li>
                      <li>You will receive a payment receipt via email</li>
                      <li>Remaining balance is due before your event date</li>
                    </ul>
                  </div>
                  <div className="border-t border-gold-400/20 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-xs font-semibold text-gold-300 hover:text-white underline decoration-gold-400/50 underline-offset-2 flex items-center gap-1.5 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Terms &amp; Cancellation Policy
                    </button>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => {
          setShowTermsModal(false);
          setPendingPaymentAction(null);
        }}
        onAccept={() => {
          setAgreedToTerms(true);
          setShowTermsModal(false);
          if (pendingPaymentAction) {
            const action = pendingPaymentAction;
            setPendingPaymentAction(null);
            action();
          }
        }}
      />
    </section>
  );
}