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
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % GALLERY.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, []);

  const go = (next) => {
    setIndex((next + GALLERY.length) % GALLERY.length);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % GALLERY.length);
    }, 4000);
  };

  return (
    <section id="gallery" className="section-padding bg-gold-50/40">
      <div className="section-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold-600">
            Our Work
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-charcoal md:text-5xl">
            Moments we&rsquo;ve catered
          </h2>
        </div>

        <div className="group relative mt-14 overflow-hidden rounded-2xl shadow-card">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {GALLERY.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                loading="lazy"
                className="aspect-[4/3] w-full shrink-0 object-cover sm:aspect-[16/9] md:aspect-[21/9]"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-charcoal/40 text-white backdrop-blur-sm transition-all hover:bg-gold-500 hover:text-charcoal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next image"
            className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-charcoal/40 text-white backdrop-blur-sm transition-all hover:bg-gold-500 hover:text-charcoal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <div className="absolute inset-x-0 bottom-5 flex justify-center gap-2">
            {GALLERY.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  i === index ? 'w-6 bg-gold-500' : 'bg-white/60 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => navigate('/discover')}
            className="text-sm font-semibold uppercase tracking-[0.2em] text-charcoal underline decoration-gold-500 decoration-2 underline-offset-8 transition-colors hover:text-gold-600"
          >
            Explore menus &amp; packages
          </button>
        </div>
      </div>
    </section>
  );
}