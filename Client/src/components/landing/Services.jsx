import { SERVICES } from '../../data/landingData';
import SectionHeading from '../ui/SectionHeading';

export default function Services() {
  return (
    <section id="services" className="section-padding bg-gold-50/50">
      <div className="section-container">
        <SectionHeading
          label="Our Services"
          title="Comprehensive Catering Solutions"
          description="End-to-end catering for any occasion."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {SERVICES.map((service) => (
            <article
              key={service.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-elevated"
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />
              </div>

              <div className="flex flex-1 flex-col p-6 md:p-8">
                <h3 className="font-display text-xl font-semibold text-charcoal">
                  {service.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-charcoal-muted">
                  {service.description}
                </p>
                <div className="mt-6 h-0.5 w-10 rounded-full bg-gold-400 transition-all duration-500 group-hover:w-full group-hover:bg-gold-500" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
