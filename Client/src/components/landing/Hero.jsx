import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import backgroundImage from '../../assets/background.jpg';
import { useAuth } from '../../context/AuthContext';
import { useLoginModal } from '../../context/LoginModalContext';
import { CONTACT_INFO } from '../../data/landingData';

export default function Hero() {
  const navigate = useNavigate();
  const { customer } = useAuth();
  const { openLogin } = useLoginModal();

  const handleBook = () => {
    if (customer) {
      navigate('/book');
    } else {
      openLogin(() => navigate('/book'));
    }
  };

  return (
    <section id="hero" className="relative overflow-hidden bg-charcoal">
      <img
        src={backgroundImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-40"
        loading="eager"
      />
      {/* Left-side gradient keeps the left-aligned text readable */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-charcoal/70 via-charcoal/30 to-transparent" />

      <div className="section-container relative z-10 flex min-h-[calc(100svh-4rem)] flex-col justify-between pb-10 pt-24 md:min-h-[calc(100svh-5rem)] md:pb-14 md:pt-32">
        {/* Headline block — vertically centred, left-aligned */}
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-300 md:text-sm">
            {CONTACT_INFO.name} &middot; Carcar, Philippines
          </p>

          <h1 className="mt-5 max-w-4xl font-display text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-8xl">
            We value good service, <span className="text-gold-400">taste</span>, and style.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/90 md:text-xl">
            At FMG Catering, every dish brings care and craft to your celebration &mdash; from
            intimate dinners to grand weddings, <strong className="font-semibold text-white">your guests get
            more than a meal.</strong>
          </p>
        </div>

        {/* Bottom row — primary CTA left, secondary pill right */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={handleBook} size="lg" className="w-fit px-8 shadow-[0_0_40px_-10px_rgba(251,191,36,0.6)]">
            Book Your Event
          </Button>

          <button
            type="button"
            onClick={() => navigate('/menus')}
            className="group flex w-fit items-center gap-3 rounded-full border border-white/60 bg-white/5 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:border-gold-300 hover:bg-white/10 md:min-w-[20rem]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-xs text-white">✦</span>
            <span className="flex-1 text-left">Browse our menus &amp; set pricing</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}