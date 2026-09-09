import { TESTIMONIALS } from '../../data/landingData';
import SectionHeading from '../ui/SectionHeading';

function StarRating({ rating }) {
  return (
    <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-5 w-5 ${i < rating ? 'text-gold-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section id="testimonials" className="section-padding bg-gold-50/50">
      <div className="section-container">
        <SectionHeading
          label="Testimonials"
          title="What Our Clients Say"
          description="Trusted by hundreds of clients for weddings, corporate events, and special celebrations."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial) => (
            <article
              key={testimonial.id}
              className="bg-white rounded-2xl p-8 shadow-card hover:shadow-elevated transition-shadow duration-300"
            >
              <StarRating rating={testimonial.rating} />
              <blockquote className="mt-5">
                <p className="text-charcoal-light leading-relaxed italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </blockquote>
              <div className="mt-6 pt-6 border-t border-gold-100">
                <p className="font-semibold text-charcoal">{testimonial.name}</p>
                <p className="text-sm text-gold-600 mt-1">{testimonial.event}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
