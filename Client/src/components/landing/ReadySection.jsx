import Button from '../ui/Button';
import useBookingNav from '../../hooks/useBookingNav';

export default function ReadySection() {
  const book = useBookingNav();

  return (
    <section
      id="ready"
      className="relative overflow-hidden bg-charcoal py-24 text-white md:py-32"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 50% 130%, rgba(190, 149, 67, 0.35), transparent 60%)',
        }}
      />

      <div className="section-container relative z-10 px-4 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-400 md:text-sm">
          Let&rsquo;s plan your next event
        </p>

        <h2 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
          Ready to make your next gathering more{' '}
          <span className="text-gold-400">memorable</span>?
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
          Our team will guide you through every step, from menu selection to final
          details &mdash; so your event is both memorable and stress-free.
        </p>

        <div className="mt-10">
          <Button onClick={() => book()} size="lg">
            Get Started
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Button>
        </div>
      </div>
    </section>
  );
}