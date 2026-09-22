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

      <div className="section-container relative z-10 px-4 pb-20 pt-28 text-center md:pb-28 md:pt-40">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-300 md:text-sm">
          {CONTACT_INFO.name} &middot; Carcar, Philippines
        </p>

        <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
          We value good service, <span className="text-gold-400">taste</span>, and style.
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">
          At FMG Catering, every dish brings care and craft to your celebration &mdash; from
          intimate dinners to grand weddings, <strong className="font-semibold text-white">your guests get
          more than a meal.</strong>
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button onClick={handleBook} size="lg">
            Book Your Event
          </Button>
          <Button onClick={() => navigate('/services')} variant="secondary" size="lg">
            Browse the Menus
          </Button>
        </div>
      </div>
    </section>
  );
}