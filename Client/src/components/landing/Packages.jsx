import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PACKAGES } from '../../data/landingData';
import { formatCurrency } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import SectionHeading from '../ui/SectionHeading';
import Button from '../ui/Button';
import AuthModal from './AuthModal';

export default function Packages() {
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingPackageId, setPendingPackageId] = useState(null);

  const handleBookPackage = (e, packageId) => {
    e.preventDefault();
    if (customer) {
      navigate(`/book?package=${packageId}`);
    } else {
      setPendingPackageId(packageId);
      setShowAuthModal(true);
    }
  };

  return (
    <section id="packages" className="section-padding bg-white">
      <div className="section-container">
        <SectionHeading
          label="Packages"
          title="Choose the Perfect Package"
          description="Transparent pricing per guest with flexible options for every event size. Enter your budget when booking to receive personalized package recommendations."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PACKAGES.map((pkg) => (
            <article
              key={pkg.id}
              className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 ${
                pkg.featured
                  ? 'bg-charcoal text-white shadow-elevated scale-[1.02] ring-2 ring-gold-400'
                  : 'bg-white shadow-card border border-gold-100 hover:shadow-elevated hover:border-gold-200'
              }`}
            >
              {pkg.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-400 text-white text-xs font-semibold uppercase tracking-wider px-4 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <h3 className={`font-display text-2xl font-semibold ${pkg.featured ? 'text-white' : 'text-charcoal'}`}>
                {pkg.name}
              </h3>
              <p className={`mt-2 text-sm ${pkg.featured ? 'text-white/70' : 'text-charcoal-muted'}`}>
                {pkg.description}
              </p>

              <div className="mt-6">
                <span className={`font-display text-4xl font-bold ${pkg.featured ? 'text-gold-300' : 'text-gold-500'}`}>
                  {formatCurrency(pkg.pricePerGuest)}
                </span>
                <span className={`text-sm ${pkg.featured ? 'text-white/60' : 'text-charcoal-muted'}`}>
                  {' '}/ guest
                </span>
              </div>

              <p className={`mt-2 text-xs ${pkg.featured ? 'text-white/50' : 'text-charcoal-muted'}`}>
                {pkg.minGuests}–{pkg.maxGuests} guests · {pkg.eventTypes.join(', ')}
              </p>

              <ul className="mt-6 space-y-3 flex-grow">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <svg
                      className={`h-5 w-5 flex-shrink-0 ${pkg.featured ? 'text-gold-300' : 'text-gold-500'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className={pkg.featured ? 'text-white/80' : 'text-charcoal-light'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={(e) => handleBookPackage(e, pkg.id)}
                variant={pkg.featured ? 'primary' : 'secondary'}
                className="mt-8 w-full"
              >
                Book This Package
              </Button>
            </article>
          ))}
        </div>
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingPackageId(null); }}
        redirectTo={pendingPackageId ? `/book?package=${pendingPackageId}` : '/book'}
      />
    </section>
  );
}
