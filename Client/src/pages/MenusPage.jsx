import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SectionHeading from '../components/ui/SectionHeading';
import Button from '../components/ui/Button';
import { MENU_OFFERS, MENU_TIERS, PLATTER_MENU } from '../data/landingData';
import { formatCurrency } from '../utils/helpers';
import foodPerPaxImage from '../assets/5b4b7960-0099-4363-9d98-ac7814b440f6.jpg';
import mainDishesImage from '../assets/fa79860c-4838-4d40-90c3-6e305761dace.jpg';
import sideDishesImage from '../assets/cbea243e-ca67-44df-b395-f2dc793a2cbd.jpg';
import packedMealsImage from '../assets/faf3e38e-e1ab-4ebf-86fe-40f9217a63e6.jpg';

const MENU_IMAGES = [
  { src: foodPerPaxImage, alt: 'FMG Catering food per pax menu sets' },
  { src: mainDishesImage, alt: 'FMG Catering main dish choices' },
  { src: sideDishesImage, alt: 'FMG Catering side dish choices' },
  { src: packedMealsImage, alt: 'FMG Catering platter and packed meal options' },
];

function tierLabel(tierId) {
  return MENU_TIERS.find((tier) => tier.id === tierId)?.label || 'Drop-Off';
}

function groupBySub(items) {
  return items.reduce((groups, item) => {
    const key = item.sub || 'Other';
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

function SetCard({ offer, onBook }) {
  return (
    <article className="flex flex-col rounded-2xl border border-gold-100 bg-white p-6 shadow-card">
      <span className="w-fit rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-700">
        {tierLabel(offer.tier)}
      </span>
      <h3 className="mt-4 font-display text-xl font-semibold text-charcoal">{offer.name}</h3>
      <p className="mt-2 font-display text-2xl font-bold text-gold-600">
        {formatCurrency(offer.pricePerPax)}
        <span className="ml-1 font-sans text-sm font-normal text-charcoal-muted">/ pax</span>
      </p>
      <ul className="mt-5 flex-grow space-y-2 text-sm text-charcoal-light">
        {offer.includes.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-gold-600">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <Button className="mt-6 w-full" variant="secondary" onClick={onBook}>
        Book this set
      </Button>
    </article>
  );
}

function DishChips({ dishes }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {dishes.map((dish) => (
        <li
          key={dish.id}
          className="flex items-center gap-2 rounded-full border border-gold-200 bg-white px-3.5 py-1.5 text-sm text-charcoal-light"
        >
          {dish.name}
          <span className="font-semibold text-gold-600">{formatCurrency(dish.price)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MenusPage() {
  const [selectedMenuImage, setSelectedMenuImage] = useState(null);
  const navigate = useNavigate();

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

  const buffetSets = MENU_OFFERS.filter((offer) => offer.category === 'natural' && offer.tier === 'buffet');
  const platedSets = MENU_OFFERS.filter((offer) => offer.category === 'natural' && offer.tier === 'plated');
  const packedSets = MENU_OFFERS.filter((offer) => offer.category === 'drop-off');
  const mainsBySub = groupBySub(PLATTER_MENU.mains);
  const sidesBySub = groupBySub(PLATTER_MENU.sides);
  const onBook = () => navigate('/book');

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <section id="menu" className="section-padding bg-white">
          <div className="section-container">
            <SectionHeading
              label="FMG Menu"
              title="The Full Menu & Pricing"
              description="Every set, platter, and dish we offer — nothing else to dig through."
            />

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {MENU_IMAGES.map((image) => (
                <button
                  key={image.src}
                  type="button"
                  aria-label={`Open ${image.alt}`}
                  onClick={() => setSelectedMenuImage(image)}
                  className="group overflow-hidden rounded-2xl bg-charcoal shadow-card focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="aspect-[7/10] w-full object-cover object-top transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-charcoal-muted">Tap a menu card to enlarge.</p>
          </div>
        </section>

        <section className="section-padding bg-gold-50/50">
          <div className="section-container">
            <SectionHeading
              label="Set Menus"
              title="Buffet, Plated & Drop-Off Sets"
              description="Fixed per-pax pricing with everything included."
            />

            <h3 className="font-display text-2xl font-semibold text-charcoal">Buffet Sets</h3>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {buffetSets.map((offer) => (
                <SetCard key={offer.id} offer={offer} onBook={onBook} />
              ))}
            </div>

            <h3 className="mt-14 font-display text-2xl font-semibold text-charcoal">Plated Sets</h3>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {platedSets.map((offer) => (
                <SetCard key={offer.id} offer={offer} onBook={onBook} />
              ))}
            </div>

            <h3 className="mt-14 font-display text-2xl font-semibold text-charcoal">Drop-Off Packed Meals</h3>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {packedSets.map((offer) => (
                <SetCard key={offer.id} offer={offer} onBook={onBook} />
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding bg-white">
          <div className="section-container">
            <SectionHeading
              label="Platters"
              title="À la Carte Platters"
              description="Order by platter for drop-off events. Mains ₱1,300 · sides ₱500. Add a chafer to keep food warm: mains ₱1,500, sides ₱600."
            />

            <div className="space-y-10">
              <div>
                <h3 className="font-display text-2xl font-semibold text-charcoal">Main Dishes</h3>
                <div className="mt-5 space-y-6">
                  {Object.entries(mainsBySub).map(([sub, dishes]) => (
                    <div key={sub}>
                      <h4 className="text-sm font-semibold uppercase tracking-widest text-gold-600">{sub}</h4>
                      <div className="mt-3">
                        <DishChips dishes={dishes} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-display text-2xl font-semibold text-charcoal">Special</h3>
                <div className="mt-4">
                  <DishChips dishes={PLATTER_MENU.specials} />
                </div>
              </div>

              <div>
                <h3 className="font-display text-2xl font-semibold text-charcoal">Sides & Desserts</h3>
                <div className="mt-5 space-y-6">
                  {Object.entries(sidesBySub).map(([sub, dishes]) => (
                    <div key={sub}>
                      <h4 className="text-sm font-semibold uppercase tracking-widest text-gold-600">{sub}</h4>
                      <div className="mt-3">
                        <DishChips dishes={dishes} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-charcoal">Drinks</h3>
                  <div className="mt-4">
                    <DishChips dishes={PLATTER_MENU.drinks} />
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-2xl font-semibold text-charcoal">Fresh Fruit</h3>
                  <div className="mt-4">
                    <DishChips dishes={PLATTER_MENU.fruits} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 md:pb-24">
          <div className="section-container">
            <div className="rounded-2xl bg-charcoal px-6 py-12 text-center md:px-12">
              <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">
                Ready to build your menu?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-white/70">
                Tell us your guest count and budget, and we&rsquo;ll recommend the best set for your event.
              </p>
              <Button className="mt-8" size="lg" onClick={onBook}>
                Start Booking
              </Button>
            </div>
          </div>
        </section>
      </main>

      {selectedMenuImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/80 p-4 backdrop-blur-sm" role="presentation" onClick={() => setSelectedMenuImage(null)}>
          <div className="relative max-h-[92vh] max-w-3xl rounded-2xl bg-white p-2 shadow-elevated" role="dialog" aria-modal="true" aria-label={selectedMenuImage.alt} onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setSelectedMenuImage(null)} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-charcoal/85 text-2xl leading-none text-white transition hover:bg-charcoal focus:outline-none focus:ring-2 focus:ring-gold-500" aria-label="Close menu preview">×</button>
            <img src={selectedMenuImage.src} alt={selectedMenuImage.alt} className="max-h-[88vh] w-auto rounded-xl object-contain" />
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}