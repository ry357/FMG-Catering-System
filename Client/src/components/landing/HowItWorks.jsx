import Button from '../ui/Button';
import useBookingNav from '../../hooks/useBookingNav';
import mainDishesImage from '../../assets/fa79860c-4838-4d40-90c3-6e305761dace.jpg';

const STEPS = [
  {
    title: 'Tell us your budget and guest count',
    description: 'Set a target per guest or a total event budget, your way.',
  },
  {
    title: 'Get recommendations matched to your plan',
    description:
      'Menu sets are suggested straight from our catalog, based on your budget.',
  },
  {
    title: 'Book full-service or drop-off in minutes',
    description:
      'Choose a set, pick your dishes, pay securely, and get a confirmation email.',
  },
];

export default function HowItWorks() {
  const book = useBookingNav();

  return (
    <section id="how-it-works" className="section-padding bg-white">
      <div className="section-container grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative order-2 lg:order-1">
          <span className="absolute -left-4 -top-4 hidden h-full w-full rounded-2xl border border-gold-200 md:block" aria-hidden="true" />
          <img
            src={mainDishesImage}
            alt="FMG Catering main dish selections served at an event"
            className="relative aspect-[4/3] w-full rounded-2xl object-cover shadow-elevated"
            loading="lazy"
          />
          <div className="absolute -right-4 -top-6 hidden rounded-2xl bg-gold-500 px-5 py-3 text-charcoal shadow-card md:block">
            <span className="block font-display text-xl font-semibold">&#8369;330/pax</span>
            <span className="block text-xs font-medium">buffet sets &amp; up</span>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold-600">
            Budget-Friendly
          </p>

          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-charcoal md:text-5xl">
            Catering that fits your budget
          </h2>

          <p className="mt-6 max-w-md text-base leading-relaxed text-charcoal-muted">
            Great catering doesn&rsquo;t have to stretch your plan. Tell us what
            you&rsquo;re working with and we&rsquo;ll recommend a menu that fits.
          </p>

          <ol className="mt-8 space-y-5">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-charcoal font-display text-lg font-semibold text-gold-300">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-charcoal">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-charcoal-muted">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-8 italic text-charcoal-light">
            It&rsquo;s catering that goes beyond the table.
          </p>

          <div className="mt-8">
            <Button onClick={() => book() } size="lg">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}