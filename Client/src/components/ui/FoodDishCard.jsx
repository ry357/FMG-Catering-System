import React, { useState } from 'react';
import { getFoodImage } from '../../data/foodImages';
import { formatCurrency } from '../../utils/helpers';

/**
 * Reusable Dish Card with a uniform luxury catering background,
 * golden accenting, and fallback handling.
 */
export default function FoodDishCard({
  dish,
  price,
  selected = false,
  selectable = false,
  onSelect,
  disabled = false,
  sublabel = null,
  compact = false,
  showPrice = true,
}) {
  const [imgError, setImgError] = useState(false);
  const dishId = dish?.id || (typeof dish === 'string' ? dish.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '');
  const dishName = dish?.name || (typeof dish === 'string' ? dish : 'Dish');
  const dishPrice = price ?? dish?.price;
  const imageSrc = getFoodImage(dish?.id || dishName);

  const handleClick = () => {
    if (selectable && !disabled && onSelect) {
      onSelect(dish);
    }
  };

  return (
    <div
      onClick={handleClick}
      role={selectable ? 'button' : undefined}
      tabIndex={selectable && !disabled ? 0 : undefined}
      aria-pressed={selectable ? selected : undefined}
      onKeyDown={(e) => {
        if (selectable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-200 ${
        selectable
          ? disabled
            ? 'cursor-not-allowed opacity-40 border-gray-200 bg-gray-50'
            : selected
            ? 'cursor-pointer border-gold-500 bg-gold-50/70 shadow-md ring-2 ring-gold-400/50'
            : 'cursor-pointer border-gold-100/90 bg-white hover:border-gold-300 hover:shadow-card'
          : 'border-gold-100/80 bg-white shadow-card hover:shadow-elevated'
      }`}
    >
      {/* Visual background container with unified warm marble / catering surface look */}
      <div className={`relative overflow-hidden bg-gradient-to-b from-[#fbf8f3] via-[#f7f2ea] to-[#efe7da] ${compact ? 'aspect-[4/3]' : 'aspect-[4/3]'}`}>
        {/* Subtle warm tabletop glow */}
        <div className="absolute inset-0 bg-radial-gradient from-white/30 via-transparent to-amber-950/5 pointer-events-none z-10" />

        {imageSrc && !imgError ? (
          <img
            src={imageSrc}
            alt={dishName}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
            <span className="text-3xl">🍽️</span>
            <span className="mt-2 text-xs font-semibold text-charcoal/70">FMG Culinary</span>
          </div>
        )}

        {/* Selection Checkbox Pill (for food selection in bookings) */}
        {selectable && (
          <div className="absolute top-2 right-2 z-20">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-colors ${
                selected
                  ? 'border-gold-500 bg-gold-500 text-white'
                  : 'border-gray-300 bg-white/90 text-transparent group-hover:border-gold-400'
              }`}
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
              </svg>
            </div>
          </div>
        )}

        {/* Category tag / badge */}
        {dish?.sub && (
          <span className="absolute bottom-2 left-2 z-20 rounded-md bg-charcoal/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {dish.sub}
          </span>
        )}
      </div>

      {/* Dish Details */}
      <div className={`flex flex-1 flex-col justify-between ${compact ? 'p-3' : 'p-3.5'}`}>
        <div>
          <h4 className="font-display font-medium text-charcoal group-hover:text-gold-700 text-sm md:text-base leading-snug line-clamp-2">
            {dishName}
          </h4>
          {sublabel && (
            <p className="mt-0.5 text-xs text-charcoal-muted line-clamp-1">{sublabel}</p>
          )}
        </div>

        {showPrice && dishPrice != null && (
          <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-gold-50/80">
            <span className="text-xs text-charcoal-muted font-normal">Starting at</span>
            <span className="font-display font-bold text-gold-600 text-sm md:text-base">
              {formatCurrency(dishPrice)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
