export default function SectionHeading({ label, title, description, light = false, centered = true }) {
  const textColor = light ? 'text-white' : 'text-charcoal';
  const descColor = light ? 'text-white/80' : 'text-charcoal-muted';
  const labelColor = light ? 'text-gold-200' : 'text-gold-600';

  return (
    <div className={`mb-12 md:mb-16 ${centered ? 'text-center max-w-3xl mx-auto' : ''}`}>
      {label && (
        <p className={`font-semibold text-sm uppercase tracking-widest mb-3 ${labelColor}`}>
          {label}
        </p>
      )}
      <h2 className={`font-display text-3xl md:text-4xl lg:text-5xl font-semibold ${textColor}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-4 text-base md:text-lg leading-relaxed ${descColor}`}>
          {description}
        </p>
      )}
      <div className={`mt-6 h-1 w-16 bg-gold-500 rounded-full ${centered ? 'mx-auto' : ''}`} />
    </div>
  );
}
