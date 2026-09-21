import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Packages from '../components/landing/Packages';
import SectionHeading from '../components/ui/SectionHeading';
import Button from '../components/ui/Button';
import { MENU_OFFERS, SERVICES } from '../data/landingData';
import { formatCurrency } from '../utils/helpers';

const MENU_GROUPS = [
  { label: 'Buffet Sets', offers: MENU_OFFERS.filter((offer) => offer.category === 'natural' && offer.tier === 'buffet') },
  { label: 'Plated Sets', offers: MENU_OFFERS.filter((offer) => offer.category === 'natural' && offer.tier === 'plated') },
  { label: 'Drop-Off Meals', offers: MENU_OFFERS.filter((offer) => offer.category === 'drop-off') },
];

export default function ServicesPage() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <section id="services" className="section-padding bg-white">
          <div className="section-container">
            <SectionHeading
              label="Services"
              title="What We Offer"
              description="From intimate gatherings to large celebrations — full-service and drop-off catering."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
              {SERVICES.map((service) => (
                <article
                  key={service.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-transparent bg-white shadow-card transition-all duration-300 hover:border-gold-200 hover:shadow-elevated"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />
                  </div>

                  <div className="flex flex-1 flex-col p-6 md:p-8">
                    <h3 className="font-display text-xl font-semibold text-charcoal">
                      {service.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-charcoal-muted">
                      {service.description}
                    </p>
                    <div className="mt-6 h-0.5 w-10 rounded-full bg-gold-400 transition-all duration-500 group-hover:w-full group-hover:bg-gold-500" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Packages />

        <section className="section-padding bg-gold-50/50">
          <div className="section-container">
            <SectionHeading
              label="Menu Pricing"
              title="Menu Sets & Platters"
              description="Clear per-pax and per-platter pricing."
            />

            <div className="grid gap-6 md:grid-cols-3">
              {MENU_GROUPS.map((group) => (
                <div key={group.label} className="rounded-2xl border border-gold-100 bg-white p-6 shadow-card">
                  <h3 className="font-display text-xl font-semibold text-charcoal">{group.label}</h3>
                  <ul className="mt-5 space-y-3">
                    {group.offers.map((offer) => (
                      <li key={offer.id} className="flex items-center justify-between gap-3 border-b border-gold-100 pb-3 text-sm last:border-0 last:pb-0">
                        <span className="text-charcoal-light">{offer.name}</span>
                        <span className="flex-shrink-0 font-semibold text-gold-600">
                          {formatCurrency(offer.pricePerPax)}
                          <span className="font-normal text-charcoal-muted">/pax</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-gold-200 bg-white p-6 text-center shadow-card">
              <p className="text-charcoal-light">
                Platters from <span className="font-semibold text-gold-600">₱500</span> &middot; Whole Lechon{' '}
                <span className="font-semibold text-gold-600">₱8,000</span> &middot; Drinks from{' '}
                <span className="font-semibold text-gold-600">₱200</span>
              </p>
              <Button className="mt-5" variant="secondary" onClick={() => navigate('/menus')}>
                See the full menu & details
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}