import SectionHeading from '../ui/SectionHeading';

export default function About() {
  return (
    <section id="about" className="section-padding bg-white">
      <div className="section-container">
        <SectionHeading
          label="About Us"
          title="Crafting Memorable Dining Experiences"
          description="FMG Catering has been serving exceptional food and flawless event service for over 15 years. We combine culinary expertise with meticulous planning to make every celebration truly special."
        />

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=500&q=80"
                alt="Fine dining plated dish"
                className="rounded-xl shadow-card h-48 md:h-56 w-full object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=500&q=80"
                alt="Catering team preparing food"
                className="rounded-xl shadow-card h-48 md:h-56 w-full object-cover mt-8"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 md:bottom-8 md:-right-8 bg-gold-400 text-white rounded-xl p-6 shadow-elevated max-w-[200px]">
              <p className="font-display text-3xl font-bold">15+</p>
              <p className="text-sm text-white/90 mt-1">Years of culinary excellence</p>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-charcoal-muted leading-relaxed">
              We believe great catering is more than food — it is the complete experience
              from the first consultation to the final cleanup. Our team works closely with
              every client to understand their event vision, guest count, and budget.
            </p>
            <p className="text-charcoal-muted leading-relaxed">
              Whether you are planning a wedding reception, corporate gala, or milestone
              birthday, we offer flexible packages and custom menu options designed to
              exceed expectations without exceeding your budget.
            </p>

            <ul className="grid sm:grid-cols-2 gap-4 pt-4">
              {[
                'Fresh, locally sourced ingredients',
                'Experienced service staff',
                'Flexible package options',
                'Budget-friendly recommendations',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-gold-100 flex items-center justify-center">
                    <svg className="h-3 w-3 text-gold-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-sm text-charcoal-light">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
