import { useNavigate } from 'react-router-dom';
import buffetStationImage from '../../assets/700971173_976119165203396_8898856393885039178_n.jpg';
import setupImage from '../../assets/700419340_976158498532796_8998530075443807542_n.jpg';
import lechonImage from '../../assets/703396220_977211501760829_5964480201392916508_n.jpg';
import buffetDetailImage from '../../assets/715413195_989007987247847_6053587252518028193_n.jpg';
import mainsImage from '../../assets/fa79860c-4838-4d40-90c3-6e305761dace.jpg';
import packedMealsImage from '../../assets/faf3e38e-e1ab-4ebf-86fe-40f9217a63e6.jpg';
import sideDishesImage from '../../assets/cbea243e-ca67-44df-b395-f2dc793a2cbd.jpg';
import foodPerPaxImage from '../../assets/5b4b7960-0099-4363-9d98-ac7814b440f6.jpg';

const GALLERY = [
  { src: setupImage, span: 'col-span-2 row-span-2' },
  { src: buffetStationImage, span: 'col-span-1 row-span-1' },
  { src: lechonImage, span: 'col-span-1 row-span-2' },
  { src: buffetDetailImage, span: 'col-span-1 row-span-1' },
  { src: mainsImage, span: 'col-span-2 row-span-1' },
  { src: packedMealsImage, span: 'col-span-1 row-span-1' },
  { src: sideDishesImage, span: 'col-span-1 row-span-1' },
  { src: foodPerPaxImage, span: 'col-span-2 row-span-1 md:col-span-4' },
];

export default function Gallery() {
  const navigate = useNavigate();

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

        <div className="mt-14 grid auto-rows-[150px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4 md:gap-4">
          {GALLERY.map((item, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl shadow-card group ${item.span}`}
            >
              <img
                src={item.src}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>
          ))}
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