import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoImage from '../../assets/297896214_112620414877986_8856076360523925875_n.jpg';
import { NAV_LINKS } from '../../data/landingData';
import { useAuth } from '../../context/AuthContext';
import { useLoginModal } from '../../context/LoginModalContext';
import Button from '../ui/Button';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { openLogin } = useLoginModal();
  const { customer, logoutCustomer } = useAuth();

  const closeMenu = () => setIsOpen(false);

  const handleBookClick = (e) => {
    e.preventDefault();
    closeMenu();
    navigate('/book');
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/95 shadow-[0_8px_30px_rgba(36,27,18,0.08)] backdrop-blur-md">
      <nav className="section-container flex h-16 items-center justify-between md:h-20">
        <Link
          to="/"
          onClick={closeMenu}
          className="group flex items-center gap-2"
        >
          <img src={logoImage} alt="FMG Catering Services logo" className="h-10 w-10 rounded-xl object-cover shadow-sm transition-transform group-hover:rotate-3 md:h-12 md:w-12" />
          <span className="font-display text-lg font-semibold text-charcoal md:text-2xl">
            FMG Catering
          </span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-2 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-gold-500 after:transition-transform ${
                    isActive
                      ? 'text-gold-600 after:scale-x-100'
                      : 'text-charcoal-light after:scale-x-0 hover:text-gold-600 hover:after:scale-x-100'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          {customer ? (
            <>
              <span className="text-sm font-medium text-charcoal-muted">
                Hi, {customer.name.split(' ')[0]}
              </span>
              <Button onClick={logoutCustomer} variant="secondary" size="sm">
                Log out
              </Button>
            </>
          ) : (
            <Button onClick={openLogin} variant="secondary" size="sm">
              Log in
            </Button>
          )}
          <Button onClick={handleBookClick} size="sm">
            Book your event
          </Button>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-charcoal transition-colors hover:bg-gold-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 lg:hidden"
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
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={closeMenu}
                  className="block rounded-lg px-3 py-3 font-medium text-charcoal-light transition-colors hover:bg-gold-50 hover:text-gold-600"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              {customer ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    closeMenu();
                    logoutCustomer();
                  }}
                >
                  Log out ({customer.name.split(' ')[0]})
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    closeMenu();
                    openLogin();
                  }}
                >
                  Log in
                </Button>
              )}
            </li>
            <li>
              <Button onClick={handleBookClick} className="w-full">
                Book Now
              </Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}