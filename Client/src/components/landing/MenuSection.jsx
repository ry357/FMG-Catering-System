import { useEffect, useMemo, useState } from 'react';
import foodPerPaxImage from '../../assets/5b4b7960-0099-4363-9d98-ac7814b440f6.jpg';
import sideDishesImage from '../../assets/cbea243e-ca67-44df-b395-f2dc793a2cbd.jpg';
import mainDishesImage from '../../assets/fa79860c-4838-4d40-90c3-6e305761dace.jpg';
import packedMealsImage from '../../assets/faf3e38e-e1ab-4ebf-86fe-40f9217a63e6.jpg';
import { MENU_CHOICES, MENU_OFFERS } from '../../data/landingData';
import { formatCurrency } from '../../utils/helpers';
import Button from '../ui/Button';
import SectionHeading from '../ui/SectionHeading';

const MENU_IMAGES = [
  { src: foodPerPaxImage, alt: 'FMG Catering food per pax menu sets' },
  { src: mainDishesImage, alt: 'FMG Catering main dish choices' },
  { src: sideDishesImage, alt: 'FMG Catering side dish choices' },
  { src: packedMealsImage, alt: 'FMG Catering packed meal sets' },
];

const SELECTION_LIMITS = {
  'catering-a': { mains: 3, sides: 1, desserts: 0 },
  'catering-b': { mains: 3, sides: 1, desserts: 0 },
  'catering-c': { mains: 3, sides: 1, desserts: 0 },
  'catering-d': { mains: 4, sides: 2, desserts: 0 },
  'packed-a': { mains: 1, sides: 1, desserts: 0 },
  'packed-b': { mains: 2, sides: 0, desserts: 0 },
  'packed-c': { mains: 2, sides: 1, desserts: 0 },
  'packed-d': { mains: 2, sides: 1, desserts: 1 },
  'packed-e': { mains: 2, sides: 1, desserts: 1 },
};

const PACKAGE_SELECTION_LIMITS = {
  1: { mains: 2, sides: 0, desserts: 1 },
  2: { mains: 4, sides: 1, desserts: 2 },
  3: { mains: 4, sides: 2, desserts: 2 },
};

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

export default function MenuSection({ initialPackage = null }) {
  const [budgetInput, setBudgetInput] = useState('');
  const [guestInput, setGuestInput] = useState('');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedMenuImage, setSelectedMenuImage] = useState(null);
  const [selections, setSelections] = useState({ mains: [], sides: [], desserts: [] });
  const [menuNotes, setMenuNotes] = useState('');
  const budget = Number(budgetInput);
  const guests = Number(guestInput);
  const packageMode = Boolean(initialPackage);
  const hasValidInputs = packageMode
    ? Number.isInteger(guests) && guests > 0
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
    if (!hasValidInputs) return [];
    return MENU_OFFERS
      .map((offer) => ({ ...offer, total: offer.pricePerPax * guests, remaining: budget - offer.pricePerPax * guests }))
      .filter((offer) => offer.total <= budget)
      .sort((a, b) => (b.total / budget) - (a.total / budget) || b.pricePerPax - a.pricePerPax)
      .slice(0, 3);
  }, [budget, guests, hasValidInputs]);

  const limits = packageMode
    ? PACKAGE_SELECTION_LIMITS[initialPackage.id]
    : selectedOffer ? SELECTION_LIMITS[selectedOffer.id] : null;
  const selectionsComplete = limits && Object.entries(limits).every(([category, limit]) => selections[category].length === limit);

  const chooseOffer = (offer) => {
    setSelectedOffer(offer);
    setSelections({ mains: [], sides: [], desserts: [] });
    setMenuNotes('');
    requestAnimationFrame(() => document.getElementById('menu-customize')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const toggleChoice = (category, choice) => {
    setSelections((current) => ({
      ...current,
      [category]: current[category].includes(choice)
        ? current[category].filter((item) => item !== choice)
        : [...current[category], choice],
    }));
  };

  const continueToBooking = () => {
    if ((!selectedOffer && !initialPackage) || !hasValidInputs || !selectionsComplete) return;
    const offer = initialPackage || selectedOffer;
    window.dispatchEvent(new CustomEvent('startMenuBooking', {
      detail: {
        budget: packageMode ? initialPackage.pricePerGuest * guests : budget,
        guests,
        packageId: initialPackage?.id || null,
        menuPreference: { offer: offer.name, pricePerPax: packageMode ? initialPackage.pricePerGuest : selectedOffer.pricePerPax, selections, notes: menuNotes.trim() },
      },
    }));
  };

  return (
    <section id="menu" className="section-padding bg-amber-50">
      <div className="section-container">
        <SectionHeading label="FMG Menu" title={packageMode ? `Customize ${initialPackage.name}` : 'Plan Your Menu Around Your Budget'} description={packageMode ? 'Choose your guest count and the dishes included in your selected package.' : 'Enter your food budget and expected guest count. We will show the published menu offers that fit both figures.'} />

        <div className="mx-auto max-w-3xl rounded-2xl bg-charcoal p-6 shadow-elevated md:p-8">
          <div className={`grid gap-4 ${packageMode ? '' : 'sm:grid-cols-2'}`}>
            {!packageMode && <label htmlFor="menu-budget" className="block text-sm font-semibold text-white">Food budget (PHP)
              <span className="relative mt-2 block"><span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/60">₱</span><input id="menu-budget" type="number" min="1" inputMode="numeric" value={budgetInput} onChange={(event) => setBudgetInput(event.target.value)} placeholder="Example: 15000" className="w-full rounded-lg border border-white/20 bg-white/10 py-3 pl-8 pr-4 text-white placeholder:text-white/45 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/30" /></span>
            </label>}
            <label htmlFor="menu-guests" className="block text-sm font-semibold text-white">How many guests?
              <input id="menu-guests" type="number" min="1" step="1" inputMode="numeric" value={guestInput} onChange={(event) => setGuestInput(event.target.value)} placeholder="Example: 50" className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/30" />
            </label>
          </div>
          <p className="mt-4 text-xs leading-5 text-white/65">{packageMode ? `Estimated total: ${formatCurrency(initialPackage.pricePerGuest * (guests || 0))}` : "The estimate checks that the selected offer's per-pax cost × your guest count stays within your budget."}</p>
        </div>

        {hasValidInputs && !packageMode && (
          <div className="mt-10" aria-live="polite">
            <div className="mb-5"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-600">Recommended packages based on your event details</p><h3 className="mt-1 font-display text-2xl font-semibold text-charcoal">Offers for {guests} guests within {formatCurrency(budget)}</h3></div>
            {suggestions.length ? <div className="grid gap-6 md:grid-cols-3">
              {suggestions.map((offer, index) => <article key={offer.id} className="flex flex-col rounded-2xl border border-gold-100 bg-white p-6 shadow-card">
                <span className="w-fit rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700">{index === 0 ? 'Closest budget match' : offer.category}</span>
                <h4 className="mt-4 font-display text-xl font-semibold text-charcoal">{offer.name}</h4><p className="mt-1 text-sm text-charcoal-muted">{formatCurrency(offer.pricePerPax)} per pax</p>
                <div className="my-5 rounded-xl bg-amber-50 p-4"><p className="text-sm text-charcoal-muted">For {guests} guests</p><p className="font-display text-3xl font-bold text-gold-600">{formatCurrency(offer.total)}</p><p className="mt-1 text-xs text-charcoal-muted">{formatCurrency(offer.remaining)} remaining from your budget</p></div>
                <ul className="space-y-2 text-sm text-charcoal-light">{offer.includes.map((item) => <li key={item} className="flex gap-2"><span className="text-gold-500">✓</span><span>{item}</span></li>)}</ul>
                <Button className="mt-6 w-full" onClick={() => chooseOffer(offer)}>Choose & Customize Food</Button>
              </article>)}
            </div> : <div className="rounded-xl border border-amber-200 bg-white p-6 text-center text-charcoal-muted">No listed offer fits both your budget and guest count. Increase the budget, reduce the guest count, or contact FMG for a custom quote.</div>}
          </div>
        )}

        {(selectedOffer || initialPackage) && limits && <section id="menu-customize" className="mt-12 rounded-2xl border border-gold-200 bg-white p-6 shadow-card md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-600">Next: choose your food</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-charcoal">Customize {(initialPackage || selectedOffer).name}</h3>
          <p className="mt-2 text-charcoal-muted">Choose the dishes included in your selected offer. You can add special instructions below.</p>
          <div className="mt-7 space-y-7"><ChoiceGroup title="Main dishes" choices={MENU_CHOICES.mains} selected={selections.mains} limit={limits.mains} onToggle={(choice) => toggleChoice('mains', choice)} /><ChoiceGroup title="Side dishes" choices={MENU_CHOICES.sides} selected={selections.sides} limit={limits.sides} onToggle={(choice) => toggleChoice('sides', choice)} /><ChoiceGroup title="Desserts" choices={MENU_CHOICES.desserts} selected={selections.desserts} limit={limits.desserts} onToggle={(choice) => toggleChoice('desserts', choice)} /></div>
          <label htmlFor="menu-notes" className="mt-7 block text-sm font-semibold text-charcoal">Food requests or dietary notes <span className="font-normal text-charcoal-muted">(optional)</span></label>
          <textarea id="menu-notes" value={menuNotes} maxLength="500" onChange={(event) => setMenuNotes(event.target.value)} rows="3" placeholder="Example: no spicy food, vegetarian option needed" className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-charcoal focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20" />
          {!selectionsComplete && <p className="mt-4 text-sm text-amber-700">Complete each required food selection to continue to booking.</p>}
          <Button className="mt-6" disabled={!selectionsComplete} onClick={continueToBooking}>Continue to Booking</Button>
        </section>}

        <div className="mt-14"><h3 className="font-display text-2xl font-semibold text-charcoal">Browse the full FMG menu</h3><p className="mt-2 text-charcoal-muted">Review the supplied menu cards for dish choices, inclusions, and every available set.</p><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{MENU_IMAGES.map((image) => <button key={image.src} type="button" aria-label={`Open ${image.alt}`} onClick={() => setSelectedMenuImage(image)} className="group overflow-hidden rounded-2xl bg-charcoal text-left shadow-card focus:outline-none focus:ring-2 focus:ring-gold-400"><img src={image.src} alt={image.alt} className="aspect-[7/10] w-full object-cover object-top transition duration-300 group-hover:scale-105" loading="lazy" /></button>)}</div></div>
      </div>

      {selectedMenuImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/80 p-4 backdrop-blur-sm" role="presentation" onClick={() => setSelectedMenuImage(null)}>
          <div className="relative max-h-[92vh] max-w-3xl rounded-2xl bg-white p-2 shadow-elevated" role="dialog" aria-modal="true" aria-label={selectedMenuImage.alt} onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setSelectedMenuImage(null)} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-charcoal/85 text-2xl leading-none text-white transition hover:bg-charcoal focus:outline-none focus:ring-2 focus:ring-gold-400" aria-label="Close menu preview">×</button>
            <img src={selectedMenuImage.src} alt={selectedMenuImage.alt} className="max-h-[88vh] w-auto rounded-xl object-contain" />
          </div>
        </div>
      )}
    </section>
  );
}
