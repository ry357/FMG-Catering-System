import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import setupImage from '../../assets/700419340_976158498532796_8998530075443807542_n.jpg';

const OFFERINGS = [
  'Weddings and milestone celebrations',
  'Corporate events and office gatherings',
  'Buffet and plated full-service dining',
  'Custom catering options',
];

export default function OffersSection() {
  const navigate = useNavigate();

  return (
    <section id="what-we-offer" className="section-padding bg-gold-50/40">
      <div className="section-container grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold-600">
            What We Offer
          </p>

          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-charcoal md:text-5xl">
            Flexible catering options built around your event
          </h2>

          <ul className="mt-8 space-y-4">
            {OFFERINGS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500 text-charcoal">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                <span className="text-base text-charcoal-light md:text-lg">{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-8 max-w-md text-base leading-relaxed text-charcoal-muted">
            Our team handles every detail with care &mdash; menu, setup,
            staff, and cleanup &mdash; so you can focus on your guests.
          </p>

          <div className="mt-8">
            <Button onClick={() => navigate('/menus')} size="lg">
              View sample menus
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
              </svg>
            </Button>
          </div>
        </div>

        <div className="relative">
          <span className="absolute -right-4 -top-4 hidden h-full w-full rounded-2xl border border-gold-200 md:block" aria-hidden="true" />
          <img
            src={setupImage}
            alt="FMG elegant event setup with table settings and floral decor"
            className="relative aspect-[4/5] w-full rounded-2xl object-cover shadow-elevated"
            loading="lazy"
          />
          <div className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl bg-charcoal px-5 py-4 text-white shadow-card md:-left-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-500 text-charcoal">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.754 15.545l2.746-2.617" />
              </svg>
            </span>
            <span>
              <span className="block font-display text-lg font-semibold">5.0 rating</span>
              <span className="block text-xs text-white/70">from past events</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}