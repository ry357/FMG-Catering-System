import SectionHeading from '../ui/SectionHeading';

const DISCOVER_TAGS = [
  'Wedding',
  'Birthday',
  'Corporate',
  'Anniversary',
  'Gala',
  'Buffet',
  'Plated',
  'Drop-Off',
  'Lechon',
  'Pork',
  'Beef',
  'Seafood',
  'Chicken',
  'Pasta',
  'Desserts',
  'Budget-Friendly',
];

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function Discover({ query = '', onChange, onPick }) {
  const active = normalize(query);

  return (
    <section id="discover" className="section-padding bg-white">
      <div className="section-container">
        <SectionHeading
          label="Discover"
          title="What are you planning?"
          description="Browse by event type, service style, or crowd favorite."
        />

        <label htmlFor="discover-search" className="mx-auto mt-2 block max-w-xl text-left">
          <span className="sr-only">Search menus and packages</span>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              id="discover-search"
              type="search"
              value={query}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Search menus, packages, dishes…"
              className="w-full rounded-full border border-gold-200 bg-white py-3.5 pl-12 pr-5 text-base text-charcoal shadow-card transition-colors placeholder:text-charcoal-muted/70 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>
        </label>

        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
          {DISCOVER_TAGS.map((tag) => {
            const isActive = normalize(tag) === active;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onPick(tag)}
                aria-pressed={isActive}
                className={`rounded-full border px-5 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'border-gold-500 bg-gold-500 text-charcoal'
                    : 'border-gold-200 bg-white text-charcoal-light hover:border-gold-400 hover:text-gold-600'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}