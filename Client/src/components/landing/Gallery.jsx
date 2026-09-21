import { useNavigate } from 'react-router-dom';
import buffetStationImage from '../../assets/700971173_976119165203396_8898856393885039178_n.jpg';
import setupImage from '../../assets/700419340_976158498532796_8998530075443807542_n.jpg';
import lechonImage from '../../assets/703396220_977211501760829_5964480201392916508_n.jpg';
import buffetDetailImage from '../../assets/715413195_989007987247847_6053587252518028193_n.jpg';
import mainsImage from '../../assets/fa79860c-4838-4d40-90c3-6e305761dace.jpg';
import packedMealsImage from '../../assets/faf3e38e-e1ab-4ebf-86fe-40f9217a63e6.jpg';
import sideDishesImage from '../../assets/cbea243e-ca67-44df-b395-f2dc793a2cbd.jpg';
import foodPerPaxImage from '../../assets/5b4b7960-0099-4363-9d98-ac7814b440f6.jpg';

const VARIATIONS = [
  'aspect-[3/4]',
  'aspect-square',
  'aspect-[4/5]',
  'aspect-[5/6]',
  'aspect-[3/4]',
  'aspect-[4/5]',
  'aspect-square',
  'aspect-[3/4]',
];

const GALLERY = [
  { src: setupImage, alt: 'Elegant FMG event setup with table settings' },
  { src: buffetStationImage, alt: 'Styled buffet station ready for guests' },
  { src: lechonImage, alt: 'Chef carving whole roasted lechon' },
  { src: buffetDetailImage, alt: 'Close-up of a styled serving station' },
  { src: mainsImage, alt: 'FMG main dish selections' },
  { src: packedMealsImage, alt: 'Packed meal and platter options' },
  { src: sideDishesImage, alt: 'Side dishes and desserts' },
  { src: foodPerPaxImage, alt: 'Food per pax catering sets' },
].map((item, i) => ({ ...item, aspect: VARIATIONS[i % VARIATIONS.length] }));

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

        <div className="mt-14 columns-2 gap-4 md:columns-3 lg:columns-4">
          {GALLERY.map((item) => (
            <img
              key={item.alt}
              src={item.src}
              alt={item.alt}
              loading="lazy"
              className={`mb-4 w-full break-inside-avoid rounded-2xl object-cover shadow-card transition-transform duration-300 hover:-translate-y-1 ${item.aspect}`}
            />
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