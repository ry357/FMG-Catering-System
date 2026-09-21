import SectionHeading from '../ui/SectionHeading';

const HIGHLIGHTS = [
  'Fresh, locally sourced ingredients',
  'Experienced service staff',
  'Flexible package options',
  'Budget-friendly recommendations',
];

export default function About() {
  return (
    <section id="about" className="section-padding bg-white">
      <div className="section-container">
        <SectionHeading
          label="About Us"
          title="Crafting Memorable Dining Experiences"
          description="Exceptional food and flawless event service for over 15 years."
        />

        <div className="mx-auto max-w-3xl text-center">
          <p className="text-lg leading-relaxed text-charcoal-muted">
            Great catering is the complete experience &mdash; from first
            consultation to final cleanup &mdash; matched to your vision,
            guest count, and budget. Flexible packages and custom menus for
            any celebration.
          </p>

          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {HIGHLIGHTS.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-2 text-sm font-medium text-charcoal-light"
              >
                <svg className="h-4 w-4 text-gold-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}