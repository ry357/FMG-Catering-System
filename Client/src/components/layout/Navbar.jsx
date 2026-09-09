import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logoImage from '../../assets/297896214_112620414877986_8856076360523925875_n.jpg';
import { NAV_LINKS } from '../../data/landingData';
import { scrollToSection } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import AuthModal from '../landing/AuthModal';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { customer } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return undefined;
    requestAnimationFrame(() => scrollToSection(location.hash));
    return undefined;
  }, [location.pathname, location.hash]);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setIsOpen(false);
    if (location.pathname !== '/') {
      navigate(`/${href}`);
      return;
    }
    scrollToSection(href);
  };

  const handleBookClick = (e) => {
    e.preventDefault();
    setIsOpen(false);
    if (customer) {
      navigate('/book');
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || isOpen ? 'bg-white/95 shadow-[0_8px_30px_rgba(28,28,28,0.08)] backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <nav className="section-container flex h-16 items-center justify-between md:h-20">
        <a
          href="#hero"
          onClick={(e) => handleNavClick(e, '#hero')}
          className="group flex items-center gap-2"
        >
          <img src={logoImage} alt="FMG Catering Services logo" className="h-10 w-10 rounded-xl object-cover shadow-sm transition-transform group-hover:rotate-3 md:h-12 md:w-12" />
          <div>
            <span className="font-display text-lg font-semibold text-charcoal md:text-2xl">
              FMG Catering
            </span>
          </div>
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="relative py-2 text-sm font-medium text-charcoal-light transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-gold-400 after:transition-transform hover:text-gold-500 hover:after:scale-x-100"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">
          <Button onClick={handleBookClick} size="sm">
            Book your event
          </Button>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-charcoal transition-colors hover:bg-gold-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 lg:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {isOpen && (
        <div className="border-t border-gold-100 bg-white lg:hidden">
          <ul className="section-container space-y-1 py-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                    className="block rounded-lg px-3 py-3 font-medium text-charcoal-light transition-colors hover:bg-gold-50 hover:text-gold-600"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <Button
                onClick={handleBookClick}
                className="w-full"
              >
                Book Now
              </Button>
            </li>
          </ul>
        </div>
      )}
    </header>
    <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
