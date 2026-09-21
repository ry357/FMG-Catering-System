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
      <div className="section-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold-600">
            Our Work
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-charcoal md:text-5xl">
            Moments we&rsquo;ve catered
          </h2>
        </div>
      </div>

      <div className="mt-14 h-[50vh] w-screen overflow-hidden md:h-[70vh]">
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {GALLERY.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              loading="lazy"
              className="h-full w-full shrink-0 object-cover"
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
    </section>
  );
}