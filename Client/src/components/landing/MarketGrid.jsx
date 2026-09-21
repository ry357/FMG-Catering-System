import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../../assets/297896214_112620414877986_8856076360523925875_n.jpg';
import setupImage from '../../assets/700419340_976158498532796_8998530075443807542_n.jpg';
import buffetStationImage from '../../assets/700971173_976119165203396_8898856393885039178_n.jpg';
import lechonImage from '../../assets/703396220_977211501760829_5964480201392916508_n.jpg';
import foodPerPaxImage from '../../assets/5b4b7960-0099-4363-9d98-ac7814b440f6.jpg';
import mainDishesImage from '../../assets/fa79860c-4838-4d40-90c3-6e305761dace.jpg';
import packedMealsImage from '../../assets/faf3e38e-e1ab-4ebf-86fe-40f9217a63e6.jpg';
import sideDishesImage from '../../assets/cbea243e-ca67-44df-b395-f2dc793a2cbd.jpg';
import buffetDetailImage from '../../assets/715413195_989007987247847_6053587252518028193_n.jpg';
import SectionHeading from '../ui/SectionHeading';
import Button from '../ui/Button';

const AUTHOR = { name: 'FMG Catering', src: logoImage };

const MARKET_ITEMS = [
  {
    id: 'premium',
    name: 'Premium Package',
    tagline: 'Most popular for weddings and milestone events',
    price: '₱650 / guest',
    image: buffetStationImage,
    alt: 'Decorated buffet station prepared for guests at FMG event',
    tags: ['wedding', 'corporate', 'anniversary', 'gala', 'buffet', 'plated', 'full-service'],
    href: '/book?package=2',
    featured: true,
  },
  {
    id: 'essential',
    name: 'Essential Package',
    tagline: 'Your pick of mains, dessert, and setup',
    price: '₱350 / guest',
    image: foodPerPaxImage,
    alt: 'FMG Catering food per pax menu sets',
    tags: ['birthday', 'corporate', 'anniversary', 'buffet', 'full-service', 'budget-friendly'],
    href: '/book?package=1',
    featured: false,
  },
  {
    id: 'grand',
    name: 'Grand Package',
    tagline: 'Full custom menu with live cooking stations',
    price: '₱950 / guest',
    image: setupImage,
    alt: 'Elegant outdoor event setup with table settings and floral decor',
    tags: ['wedding', 'corporate', 'gala', 'buffet', 'plated', 'full-service'],
    href: '/book?package=3',
    featured: false,
  },
  {
    id: 'buffet-sets',
    name: 'Buffet Catering Sets',
    tagline: 'Set menus with mains, sides, and drinks',
    price: 'From ₱330 / pax',
    image: mainDishesImage,
    alt: 'FMG Catering main dish choices for buffet sets',
    tags: ['buffet', 'full-service', 'budget-friendly', 'pork', 'chicken', 'beef', 'seafood'],
    href: '/book',
    featured: false,
  },
  {
    id: 'plated-sets',
    name: 'Plated Catering Sets',
    tagline: 'Individually served courses, course by course',
    price: 'From ₱380 / pax',
    image: buffetDetailImage,
    alt: 'Close-up of a styled buffet station with prepared dishes',
    tags: ['plated', 'formal', 'wedding', 'beef', 'seafood', 'chicken'],
    href: '/book',
    featured: false,
  },
  {
    id: 'drop-off',
    name: 'Drop-Off Platter Orders',
    tagline: 'Delivered ready to serve, no staff needed',
    price: 'Platters from ₱500',
    image: packedMealsImage,
    alt: 'FMG Catering platter and packed meal options',
    tags: ['drop-off', 'delivery', 'budget-friendly', 'packed-meal'],
    href: '/book',
    featured: false,
  },
  {
    id: 'lechon',
    name: 'Whole Lechon',
    tagline: 'Whole roasted pig, the star of any feast',
    price: '₱8,000',
    image: lechonImage,
    alt: 'Catering staff carving roasted lechon for guests',
    tags: ['lechon', 'pork', 'wedding', 'party'],
    href: '/book',
    featured: false,
  },
  {
    id: 'sides-desserts',
    name: 'Sides, Pasta & Desserts',
    tagline: 'Add soup, noodles, sweets, and fruit',
    price: 'From ₱500 / platter',
    image: sideDishesImage,
    alt: 'FMG Catering side dish choices',
    tags: ['drop-off', 'pasta', 'desserts', 'vegetables', 'budget-friendly'],
    href: '/book',
    featured: false,
  },
];

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function MarketGrid({ query, onClear }) {
  const filtered = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return MARKET_ITEMS;
    return MARKET_ITEMS.filter((item) =>
      normalize(`${item.name} ${item.tagline} ${item.tags.join(' ')}`).includes(needle)
    );
  }, [query]);

  return (
    <section id="products" className="section-padding bg-gold-50/50">
      <div className="section-container">
        <SectionHeading
          label="Menus & Packages"
          title="Every option, priced up front"
          description="No hidden fees. Pick a set, platter, or full package and book it instantly."
        />

        {query && (
          <p className="mb-8 text-center text-sm text-charcoal-muted">
            {filtered.length === 1
              ? `1 option for "${query}"`
              : `${filtered.length} options for "${query}"`}
          </p>
        )}

        {filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-gold-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-charcoal">
                  <img
                    src={item.image}
                    alt={item.alt}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {item.featured && (
                    <span className="absolute left-3 top-3 rounded-full bg-gold-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-charcoal">
                      Most Popular
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-semibold text-charcoal">{item.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-charcoal-light">{item.tagline}</p>
                  <p className="mt-3 font-display text-xl font-bold text-gold-600">{item.price}</p>
                  <div className="mt-4 flex items-center gap-2 border-t border-gold-100 pt-4">
                    <img src={AUTHOR.src} alt="" className="h-5 w-5 rounded-full object-cover" />
                    <span className="text-xs text-charcoal-muted">{AUTHOR.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md rounded-2xl border border-gold-200 bg-white p-8 text-center shadow-card">
            <p className="text-charcoal-muted">
              No options for <span className="font-semibold text-charcoal">"{query}"</span> yet.
            </p>
            <p className="mt-1 text-sm text-charcoal-muted">
              Try "lechon", "wedding", or "drop-off".
            </p>
            <Button className="mt-6" variant="secondary" onClick={onClear}>
              Clear search
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}