import { useEffect, useMemo, useState } from 'react';
import foodPerPaxImage from '../../assets/5b4b7960-0099-4363-9d98-ac7814b440f6.jpg';
import sideDishesImage from '../../assets/cbea243e-ca67-44df-b395-f2dc793a2cbd.jpg';
import mainDishesImage from '../../assets/fa79860c-4838-4d40-90c3-6e305761dace.jpg';
import packedMealsImage from '../../assets/faf3e38e-e1ab-4ebf-86fe-40f9217a63e6.jpg';
import { BOOKING_CATEGORIES, MENU_OFFERS, MENU_TIERS } from '../../data/landingData';
import { formatCurrency } from '../../utils/helpers';
import Button from '../ui/Button';
import SectionHeading from '../ui/SectionHeading';

const MENU_IMAGES = [
  { src: foodPerPaxImage, alt: 'FMG Catering food per pax menu sets' },
  { src: mainDishesImage, alt: 'FMG Catering main dish choices' },
  { src: sideDishesImage, alt: 'FMG Catering side dish choices' },
  { src: packedMealsImage, alt: 'FMG Catering platter and packed meal options' },
];

function tierLabel(tierId) {
  const label = MENU_TIERS.find((t) => t.id === tierId)?.label;
  if (label) return label;
  if (tierId === 'drop-off') return 'Drop-Off';
  return tierId || '';
}

export default function MenuSection({ initialPackage = null }) {
  const [category, setCategory] = useState('natural');
  const [budgetInput, setBudgetInput] = useState('');
  const [guestInput, setGuestInput] = useState('');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedMenuImage, setSelectedMenuImage] = useState(null);
  const budget = Number(budgetInput);
  const guests = Number(guestInput);
  const packageMode = Boolean(initialPackage);
  const naturalOffers = MENU_OFFERS.filter((offer) => offer.category === 'natural');
  const hasValidInputs = packageMode
    ? Number.isInteger(guests) && guests > 0
    : category === 'drop-off'
      ? true
      : Number.isFinite(budget) && budget > 0 && Number.isInteger(guests) && guests > 0;

  useEffect(() => {
    if (!selectedMenuImage) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedMenuImage(null);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedMenuImage]);

  const suggestions = useMemo(() => {
    if (!hasValidInputs || packageMode || category !== 'natural') return [];
    return naturalOffers
      .map((offer) => ({ ...offer, total: offer.pricePerPax * guests, remaining: budget - offer.pricePerPax * guests }))
      .filter((offer) => offer.total <= budget)
      .sort((a, b) => (b.total / budget) - (a.total / budget) || b.pricePerPax - a.pricePerPax)
      .slice(0, 3);
  }, [budget, guests, hasValidInputs, packageMode, category, naturalOffers]);

  const switchCategory = (nextCategory) => {
    setCategory(nextCategory);
    setSelectedOffer(null);
    setBudgetInput('');
  };

  const chooseOffer = (offer) => {
    setSelectedOffer(offer);
    requestAnimationFrame(() => document.getElementById('menu-customize')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const activeCategory = BOOKING_CATEGORIES.find((c) => c.id === category);

  const continueToBooking = () => {
    if (!hasValidInputs) return;
    if (!packageMode && category === 'natural' && !selectedOffer) return;
    const offer = packageMode ? null : selectedOffer;
    window.dispatchEvent(new CustomEvent('startMenuBooking', {
      detail: {
        category: packageMode ? 'natural' : category,
        budget: packageMode
          ? initialPackage.pricePerGuest * guests
          : category === 'drop-off'
            ? null
            : budget,
        guests: category === 'drop-off' ? '' : guests,
        packageId: initialPackage?.id || null,
        offer: offer || null,
        tier: offer?.tier || null,
      },
    }));
  };

  const packageTotal = initialPackage ? initialPackage.pricePerGuest * (guests || 0) : 0;

  return (
    <section id="menu" className="section-padding bg-gold-50">
      <div className="section-container">
        <SectionHeading label="FMG Menu" title={packageMode ? `Start booking ${initialPackage.name}` : 'Plan Your Menu'} description={packageMode ? 'Choose your guest count, then continue booking.' : 'Pick a booking type, then choose your menu.'} />

        {!packageMode && (
          <div className="mx-auto max-w-2xl rounded-2xl bg-white p-2 shadow-card">
            <div className="grid grid-cols-2 gap-2">
              {BOOKING_CATEGORIES.map((c) => {
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => switchCategory(c.id)}
                    aria-pressed={active}
                    className={`rounded-xl border-2 px-4 py-3 text-left transition-all ${active ? 'border-gold-400 bg-gold-50' : 'border-gray-200 hover:border-gold-300'}`}
                  >
                    <span className={`block text-sm font-semibold ${active ? 'text-charcoal' : 'text-charcoal-light'}`}>{c.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 mx-auto max-w-3xl rounded-2xl bg-charcoal p-6 shadow-elevated md:p-8">
          {!packageMode && category === 'natural' && (
            <div className="mb-3">
              <label htmlFor="menu-budget" className="block text-sm font-semibold text-white">Food budget (PHP)
                <span className="relative mt-2 block"><span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/60">₱</span><input id="menu-budget" type="number" min="1" inputMode="numeric" value={budgetInput} onChange={(event) => setBudgetInput(event.target.value)} className="w-full rounded-lg border border-white/20 bg-white/10 py-3 pl-8 pr-4 text-white placeholder:text-white/45 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/30" /></span>
              </label>
            </div>
          )}
          {!packageMode && category === 'drop-off' && (
            <div className="rounded-xl border border-gold-400/30 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Drop-Off bookings are platter-based</p>
              <p className="mt-2 text-xs leading-5 text-white/70">
                No guest count or budget needed. Build a platter checklist
                (mains, sides, drink jars, fresh fruit) at fixed prices.
              </p>
            </div>
          )}
          {category !== 'drop-off' && (
            <label htmlFor="menu-guests" className="block text-sm font-semibold text-white">How many guests?
              <input id="menu-guests" type="number" min="1" step="1" inputMode="numeric" value={guestInput} onChange={(event) => setGuestInput(event.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/30" />
            </label>
          )}
          <p className="mt-4 text-xs leading-5 text-white/65">
            {packageMode
              ? `Estimated total: ${formatCurrency(packageTotal)}`
              : category === 'drop-off'
                ? 'Fixed platter prices — ordered in the booking form.'
                : "Checks the offer's per-pax cost × guests against your budget."}
          </p>
        </div>

        {hasValidInputs && !packageMode && category === 'natural' && (
          <div className="mt-10" aria-live="polite">
            <div className="mb-5"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-600">Recommended packages based on your event details</p><h3 className="mt-1 font-display text-2xl font-semibold text-charcoal">Offers for {guests} guests within {formatCurrency(budget)}</h3></div>
            {suggestions.length ? <div className="grid gap-6 md:grid-cols-3">
              {suggestions.map((offer, index) => <article key={offer.id} className="flex flex-col rounded-2xl border border-gold-100 bg-white p-6 shadow-card">
                <div className="flex items-center gap-2">
                  <span className="w-fit rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700">{tierLabel(offer.tier)}</span>
                  <span className="text-xs text-charcoal-muted">{index === 0 ? '· Closest budget match' : ''}</span>
                </div>
                <h4 className="mt-4 font-display text-xl font-semibold text-charcoal">{offer.name}</h4><p className="mt-1 text-sm text-charcoal-muted">{formatCurrency(offer.pricePerPax)} per pax</p>
                <div className="my-5 rounded-xl bg-gold-50 p-4"><p className="text-sm text-charcoal-muted">For {guests} guests</p><p className="font-display text-3xl font-bold text-gold-600">{formatCurrency(offer.total)}</p><p className="mt-1 text-xs text-charcoal-muted">{formatCurrency(offer.remaining)} remaining from your budget</p></div>
                <ul className="space-y-2 text-sm text-charcoal-light">{offer.includes.map((item) => <li key={item} className="flex gap-2"><span className="text-gold-600">✓</span><span>{item}</span></li>)}</ul>
                <Button className="mt-6 w-full" onClick={() => chooseOffer(offer)}>Continue to Booking</Button>
              </article>)}
            </div> : <div className="rounded-xl border border-amber-200 bg-white p-6 text-center text-charcoal-muted">No listed offer fits both your budget and guest count. Increase the budget, reduce the guest count, or contact FMG for a custom quote.</div>}
          </div>
        )}

        {hasValidInputs && !packageMode && category === 'drop-off' && (
          <div className="mt-10 rounded-2xl border border-gold-200 bg-white p-6 shadow-card md:p-8" aria-live="polite">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-600">Drop-off</p>
            <h3 className="mt-1 font-display text-2xl font-semibold text-charcoal">Build your own platter order</h3>
            <p className="mt-2 text-charcoal-muted">
              Tick off the dishes you want — mains from ₱1,300 per platter, sides from
              ₱500, drinks at ₱200/jar, fresh fruit at ₱300. With chafer: mains ₱1,500, sides ₱600.
            </p>
            <Button className="mt-6" onClick={continueToBooking}>Start Drop-Off Booking</Button>
          </div>
        )}

        {packageMode && (
          <section id="menu-customize" className="mt-12 rounded-2xl border border-gold-200 bg-white p-6 shadow-card md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-600">Ready to book</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-charcoal">{initialPackage.name}</h3>
            <p className="mt-2 text-charcoal-muted">For {guests || '—'} guests · {formatCurrency(packageTotal)} estimated total</p>
            <ul className="mt-5 space-y-2 text-sm text-charcoal-light">{initialPackage.features.map((item) => <li key={item} className="flex gap-2"><span className="text-gold-600">✓</span><span>{item}</span></li>)}</ul>
            <Button className="mt-6" disabled={!hasValidInputs} onClick={continueToBooking}>Continue to Booking</Button>
          </section>
        )}

        {!packageMode && selectedOffer && (
          <section id="menu-customize" className="mt-12 rounded-2xl border border-gold-200 bg-white p-6 shadow-card md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-600">{activeCategory?.label || tierLabel(selectedOffer.tier)} · selected menu set</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-charcoal">{selectedOffer.name}</h3>
            <p className="mt-2 text-charcoal-muted">{formatCurrency(selectedOffer.pricePerPax)} per pax · {formatCurrency(selectedOffer.pricePerPax * guests)} for {guests} guests</p>
            <ul className="mt-5 space-y-2 text-sm text-charcoal-light">{selectedOffer.includes.map((item) => <li key={item} className="flex gap-2"><span className="text-gold-600">✓</span><span>{item}</span></li>)}</ul>
            <p className="mt-5 text-sm text-charcoal-muted">You pick appetizers, mains, and add-ons next.</p>
            <Button className="mt-6" onClick={continueToBooking}>Continue to Booking</Button>
          </section>
        )}

        <div className="mt-14"><h3 className="font-display text-2xl font-semibold text-charcoal">Browse the full menu</h3><p className="mt-2 text-charcoal-muted">Every dish choice and set from the menu cards.</p><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{MENU_IMAGES.map((image) => <button key={image.src} type="button" aria-label={`Open ${image.alt}`} onClick={() => setSelectedMenuImage(image)} className="group overflow-hidden rounded-2xl bg-charcoal text-left shadow-card focus:outline-none focus:ring-2 focus:ring-gold-500"><img src={image.src} alt={image.alt} className="aspect-[7/10] w-full object-cover object-top transition duration-300 group-hover:scale-105" loading="lazy" /></button>)}</div></div>
      </div>

      {selectedMenuImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/80 p-4 backdrop-blur-sm" role="presentation" onClick={() => setSelectedMenuImage(null)}>
          <div className="relative max-h-[92vh] max-w-3xl rounded-2xl bg-white p-2 shadow-elevated" role="dialog" aria-modal="true" aria-label={selectedMenuImage.alt} onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setSelectedMenuImage(null)} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-charcoal/85 text-2xl leading-none text-white transition hover:bg-charcoal focus:outline-none focus:ring-2 focus:ring-gold-500" aria-label="Close menu preview">×</button>
            <img src={selectedMenuImage.src} alt={selectedMenuImage.alt} className="max-h-[88vh] w-auto rounded-xl object-contain" />
          </div>
        </div>
      )}
    </section>
  );
}