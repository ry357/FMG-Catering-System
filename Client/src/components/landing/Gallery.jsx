import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import buffetStationImage from '../../assets/700971173_976119165203396_8898856393885039178_n.jpg';
import setupImage from '../../assets/700419340_976158498532796_8998530075443807542_n.jpg';
import lechonImage from '../../assets/703396220_977211501760829_5964480201392916508_n.jpg';
import buffetDetailImage from '../../assets/715413195_989007987247847_6053587252518028193_n.jpg';
import extraMomentImage from '../../assets/710781918_989007957247850_8360009401366745161_n.jpg';

const GALLERY = [
  buffetStationImage,
  setupImage,
  lechonImage,
  buffetDetailImage,
  extraMomentImage,
];

export default function Gallery() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % GALLERY.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="gallery" className="section-padding bg-gold-50/40">
      <div className="section-container max-w-7xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold-600">
            Our Work
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-charcoal md:text-5xl">
            Moments we&rsquo;ve catered
          </h2>
        </div>

        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16 items-center">
          {/* LEFT: Image Carousel */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(36,27,18,0.1)] lg:col-span-3">
            <div
              className="flex h-full transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {GALLERY.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Catered event moment"
                  loading="lazy"
                  className="h-full w-full shrink-0 object-cover"
                />
              ))}
            </div>
            {/* Carousel indicators */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3">
              {GALLERY.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    index === i ? 'bg-gold-500 w-8 shadow-md' : 'bg-white/70 hover:bg-white shadow-sm'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: Service Quote */}
          <div className="flex flex-col justify-center px-4 lg:col-span-2 lg:px-0">
            <svg className="h-10 w-10 text-gold-300 mb-6" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
            </svg>
            <blockquote className="font-display text-xl leading-relaxed text-charcoal sm:text-2xl">
              "Great food is only half the experience. The other half is the warmth, precision, and elegance with which it is served."
            </blockquote>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-0.5 w-8 bg-gold-500"></div>
              <p className="font-semibold text-charcoal uppercase tracking-widest text-xs">FMG Catering Services</p>
            </div>
            
            <div className="mt-10">
              <button
                type="button"
                onClick={() => navigate('/discover')}
                className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-charcoal underline decoration-gold-500 decoration-2 underline-offset-8 transition-colors hover:text-gold-600"
              >
                Explore menus &amp; packages
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}