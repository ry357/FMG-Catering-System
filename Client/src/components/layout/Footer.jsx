import { Link } from 'react-router-dom';
import { CONTACT_INFO, NAV_LINKS } from '../../data/landingData';

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      <div className="section-container section-padding pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500 text-charcoal font-display text-xl font-bold">
                F
              </span>
              <span className="font-display text-2xl font-semibold">FMG Catering</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Premium catering for weddings, corporate events, and special celebrations.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gold-300 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/70 hover:text-gold-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gold-300 mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li>{CONTACT_INFO.address}</li>
              <li>
                <a href={`tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`} className="hover:text-gold-300">
                  {CONTACT_INFO.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-gold-300">
                  {CONTACT_INFO.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gold-300 mb-4">Business Hours</h3>
            <p className="text-sm text-white/70">{CONTACT_INFO.hours}</p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/50">
            &copy; {new Date().getFullYear()} FMG Catering. All rights reserved.
          </p>
          <p className="text-sm text-white/50">
            Crafted with care for memorable events.
          </p>
        </div>
      </div>
    </footer>
  );
}
