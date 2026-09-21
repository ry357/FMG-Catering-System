import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Packages from '../components/landing/Packages';
import SectionHeading from '../components/ui/SectionHeading';
import ServiceIcon from '../components/ui/ServiceIcon';
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
                    <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-600 shadow-sm backdrop-blur-sm">
                      Service {String(service.id).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6 md:p-8">
                    <div className="-mt-14 flex h-14 w-14 items-center justify-center rounded-xl bg-gold-500 text-charcoal shadow-[0_8px_20px_rgba(190,149,67,0.4)] ring-4 ring-white transition-transform duration-300 group-hover:-translate-y-0.5">
                      <ServiceIcon name={service.icon} />
                    </div>
                    <h3 className="mt-5 font-display text-xl font-semibold text-charcoal">
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