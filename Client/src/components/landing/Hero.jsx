import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../../assets/297896214_112620414877986_8856076360523925875_n.jpg';
import serviceSetupImage from '../../assets/700419340_976158498532796_8998530075443807542_n.jpg';
import serviceBuffetImage from '../../assets/700971173_976119165203396_8898856393885039178_n.jpg';
import serviceCarvingImage from '../../assets/703396220_977211501760829_5964480201392916508_n.jpg';
import serviceFoodImage from '../../assets/710781918_989007957247850_8360009401366745161_n.jpg';
import serviceBuffetDetailImage from '../../assets/715413195_989007987247847_6053587252518028193_n.jpg';
import Button from '../ui/Button';
import { scrollToSection } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import AuthModal from './AuthModal';

const SERVICE_DOCUMENTATION = [
  { src: logoImage, alt: 'FMG Catering Services logo', label: 'FMG Catering Services' },
  { src: serviceSetupImage, alt: 'Elegant outdoor event setup with table settings and floral decor', label: 'Event setup' },
  { src: serviceBuffetImage, alt: 'Decorated buffet station prepared for guests', label: 'Buffet presentation' },
  { src: serviceCarvingImage, alt: 'Catering staff carving roasted lechon for guests', label: 'On-site service' },
  { src: serviceFoodImage, alt: 'Gold chafing dishes serving prepared catering food', label: 'Food service' },
  { src: serviceBuffetDetailImage, alt: 'Close-up of a styled buffet station with prepared dishes', label: 'Buffet details' },
];

export default function Hero() {
  const [documentationIndex, setDocumentationIndex] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { customer } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const slideshowTimer = window.setInterval(() => {
      setDocumentationIndex((current) => (current + 1) % SERVICE_DOCUMENTATION.length);
    }, 4500);
    return () => window.clearInterval(slideshowTimer);
  }, []);

  const handleClick = (e, href) => {
    e.preventDefault();
    scrollToSection(href);
  };

  const handleBookClick = (e) => {
    e.preventDefault();
    if (customer) {
      navigate('/book');
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center pt-20 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gold-50 via-white to-white" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A227' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="section-container relative z-10 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="reveal-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-gold-100 px-4 py-1.5 text-sm font-medium text-gold-700 mb-6">
              <span className="h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
              Premium Event Catering
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold text-charcoal leading-tight">
              Exceptional Food for{' '}
              <span className="text-gold-500">Unforgettable</span> Events
            </h1>
            <p className="mt-6 text-lg text-charcoal-muted max-w-xl leading-relaxed">
              From intimate gatherings to grand celebrations, FMG Catering delivers
              beautifully crafted menus, professional service, and seamless event
              coordination tailored to your vision and budget.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleBookClick}
                size="lg"
              >
                Book Your Event
              </Button>
              <Button
                href="#packages"
                variant="secondary"
                size="lg"
                onClick={(e) => handleClick(e, '#packages')}
              >
                View Packages
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
              {[
                { value: '500+', label: 'Events Catered' },
                { value: '15+', label: 'Years Experience' },
                { value: '98%', label: 'Client Satisfaction' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-2xl md:text-3xl font-semibold text-gold-500">
                    {stat.value}
                  </p>
                  <p className="text-xs md:text-sm text-charcoal-muted mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal-up relative block lg:[animation-delay:120ms]">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-elevated sm:aspect-[4/3] lg:aspect-[4/5]">
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent z-10" />
              {SERVICE_DOCUMENTATION.map((slide, index) => (
                <img
                  key={slide.src}
                  src={slide.src}
                  alt={slide.alt}
                  className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ease-in-out ${index === documentationIndex ? 'opacity-100' : 'opacity-0'} ${index === 0 ? 'object-contain' : 'object-cover'}`}
                  aria-hidden={index !== documentationIndex}
                />
              ))}
              <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 gap-1.5 rounded-full bg-charcoal/65 px-3 py-2" aria-label="Service documentation slides">
                {SERVICE_DOCUMENTATION.map((slide, index) => (
                  <button key={slide.src} type="button" aria-label={`Show ${slide.label}`} aria-current={index === documentationIndex} onClick={() => setDocumentationIndex(index)} className={`h-2 w-2 rounded-full transition ${index === documentationIndex ? 'bg-gold-300' : 'bg-white/70 hover:bg-white'}`} />
                ))}
              </div>
              <div className="absolute bottom-4 left-4 right-4 z-20 rounded-xl bg-white/95 p-4 shadow-card backdrop-blur-sm sm:bottom-6 sm:left-6 sm:right-6 sm:p-5">
                <p className="font-display text-lg font-semibold text-charcoal">
                  Full-Service Catering
                </p>
                <p className="text-sm text-charcoal-muted mt-1">
                  Menu planning, setup, service staff & cleanup included
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </section>
  );
}
