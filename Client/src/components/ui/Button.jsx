const variants = {
  primary:
    'bg-gold-500 text-charcoal shadow-[0_8px_20px_rgba(190,149,67,0.28)] hover:-translate-y-0.5 hover:bg-gold-600 hover:text-white hover:shadow-[0_12px_24px_rgba(190,149,67,0.36)] focus-visible:ring-gold-500',
  secondary:
    'border border-gold-400 bg-white text-charcoal shadow-sm hover:-translate-y-0.5 hover:border-gold-500 hover:bg-gold-50 hover:shadow-md focus-visible:ring-gold-500',
  outline:
    'border border-white/70 text-white hover:-translate-y-0.5 hover:border-white hover:bg-white/10 focus-visible:ring-white',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  href,
  onClick,
  type = 'button',
  ...props
}) {
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
