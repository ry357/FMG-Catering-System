import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoImage from '../../assets/297896214_112620414877986_8856076360523925875_n.jpg';
import { NAV_LINKS } from '../../data/landingData';
import { useAuth } from '../../context/AuthContext';
import { useLoginModal } from '../../context/LoginModalContext';
import useBookingNav from '../../hooks/useBookingNav';
import Button from '../ui/Button';
import LogoutConfirmModal from '../ui/LogoutConfirmModal';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const { openLogin } = useLoginModal();
  const { customer, logoutCustomer } = useAuth();
  const book = useBookingNav();

  const closeMenu = () => setIsOpen(false);

  // Show "Book Now" in the top-right on all public pages (Shopify-style persistent CTA)
  const isDashboard = location.pathname.startsWith('/staff/') || location.pathname.startsWith('/booking-manager/') || location.pathname.startsWith('/admin/');
  const showBookNow = !isDashboard;

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/95 shadow-[0_8px_30px_rgba(36,27,18,0.08)] backdrop-blur-md">
      <nav className="section-container flex h-16 items-center justify-between md:h-20">
        <div className="flex items-center gap-10">
        <Link
          to="/"
          onClick={closeMenu}
          className="group flex items-center gap-2"
        >
          <img src={logoImage} alt="FMG Catering Services logo" className="h-10 w-10 rounded-xl object-cover shadow-sm transition-transform group-hover:rotate-3 md:h-12 md:w-12" />
          <span className="font-display text-lg font-semibold text-charcoal md:text-2xl">
            FMG Catering Services
          </span>
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
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
        </div>

        <div className="hidden items-center gap-5 lg:flex">
          {customer ? (
            <div className="relative group">
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50/60 py-1.5 pl-2 pr-3.5 transition-all hover:bg-gold-100/70 hover:border-gold-300"
              >
                {customer.avatar ? (
                  <img
                    src={customer.avatar}
                    alt={customer.name}
                    className="h-7 w-7 rounded-full object-cover border border-gold-400"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-600 text-xs font-bold text-white">
                    {(customer.name || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-semibold text-charcoal">
                  {(customer?.name || 'Customer').split(' ')[0]}
                </span>
                <svg className="w-3.5 h-3.5 text-charcoal-muted group-hover:text-charcoal transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>

              {/* Hover Dropdown */}
              <div className="absolute right-0 top-full mt-1.5 hidden w-56 rounded-2xl bg-white p-2 shadow-xl border border-gold-100 group-hover:block transition-all z-50">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-charcoal truncate">{customer?.name || 'Customer'}</p>
                  <p className="text-[11px] text-charcoal-muted truncate">{customer?.email || ''}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/profile?tab=history"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-charcoal hover:bg-gold-50 hover:text-gold-700 transition-colors"
                  >
                    <span>📦</span> Orders & Bookings
                  </Link>
                  <Link
                    to="/profile?tab=addresses"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-charcoal hover:bg-gold-50 hover:text-gold-700 transition-colors"
                  >
                    <span>📍</span> Saved Addresses
                  </Link>
                  <Link
                    to="/profile?tab=phone"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-charcoal hover:bg-gold-50 hover:text-gold-700 transition-colors"
                  >
                    <span>📞</span> Contact & Phone
                  </Link>
                </div>
                <div className="border-t border-gray-100 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      setShowLogoutModal(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span>🚪</span> Log out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openLogin}
              className="text-sm font-medium text-charcoal-light transition-colors hover:text-gold-600"
            >
              Log in
            </button>
          )}
          {showBookNow && (
            <Button
              variant="primary"
              size="sm"
              className="!rounded-full px-5"
              onClick={() => {
                closeMenu();
                book('/book');
              }}
            >
              Book Now
            </Button>
          )}
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
            <li className="pt-2 space-y-2">
              {showBookNow && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    closeMenu();
                    book('/book');
                  }}
                >
                  Book Now
                </Button>
              )}
              {customer ? (
                <div className="space-y-2">
                  <Link
                    to="/profile"
                    onClick={closeMenu}
                    className="flex items-center justify-between rounded-xl bg-gold-50/70 p-3 text-sm font-semibold text-charcoal border border-gold-200"
                  >
                    <div className="flex items-center gap-2.5">
                      {customer.avatar ? (
                        <img
                          src={customer.avatar}
                          alt={customer.name}
                          className="h-7 w-7 rounded-full object-cover border border-gold-400"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-600 text-xs font-bold text-white">
                          {(customer.name || 'C').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>My Profile & Orders</span>
                    </div>
                    <span className="text-xs text-gold-700 font-medium">View →</span>
                  </Link>

                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      closeMenu();
                      setShowLogoutModal(true);
                    }}
                  >
                    Log out ({(customer?.name || 'Customer').split(' ')[0]})
                  </Button>
                </div>
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
          </ul>
        </div>
      )}

      <LogoutConfirmModal
        open={showLogoutModal}
        variant="client"
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logoutCustomer}
      />
    </header>
  );
}