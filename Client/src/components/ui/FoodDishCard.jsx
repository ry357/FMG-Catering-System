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
  quantity = 0,
  onIncrease,
  onDecrease,
  showQuantity = true,
  minQuantity = 0,
  maxQuantity = 99,
}) {
  const [imgError, setImgError] = useState(false);
  const dishId = dish?.id || (typeof dish === 'string' ? dish.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '');
  const dishName = dish?.name || (typeof dish === 'string' ? dish : 'Dish');
  const dishPrice = price ?? dish?.price;
  const imageSrc = getFoodImage(dish?.id || dishName);

  const isSelected = selected || quantity > 0;
  const currentQuantity = quantity > 0 ? quantity : (selected ? 1 : 0);

  const handleClick = () => {
    if (selectable && !disabled) {
      if (currentQuantity === 0) {
        if (onIncrease) onIncrease();
        else if (onSelect) onSelect(dish);
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      role={selectable ? 'button' : undefined}
      tabIndex={selectable && !disabled ? 0 : undefined}
      aria-pressed={selectable ? isSelected : undefined}
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
            : isSelected
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

        {/* Selection Checkbox / Quantity Pill */}
        {selectable && (
          <div className="absolute top-2 right-2 z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (disabled) return;
                if (isSelected) {
                  if (onSelect) onSelect(dish);
                  else if (onDecrease) onDecrease();
                } else {
                  if (onIncrease) onIncrease();
                  else if (onSelect) onSelect(dish);
                }
              }}
              title={isSelected ? `Unselect ${dishName}` : `Select ${dishName}`}
              aria-label={isSelected ? `Unselect ${dishName}` : `Select ${dishName}`}
              className={`flex items-center justify-center transition-all ${
                isSelected
                  ? currentQuantity > 1
                    ? 'h-6 px-2 rounded-full border border-gold-500 bg-gold-500 text-white shadow-md text-xs font-bold'
                    : 'h-6 w-6 rounded-full border border-gold-500 bg-gold-500 text-white shadow-md'
                  : 'h-6 w-6 rounded-full border border-gray-300 bg-white/90 text-transparent hover:border-gold-400 shadow-sm'
              }`}
            >
              {isSelected ? (
                currentQuantity > 1 ? (
                  <span>{currentQuantity}×</span>
                ) : (
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                )
              ) : (
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              )}
            </button>
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
          <h4 className="font-display font-bold text-black group-hover:text-gold-800 text-sm md:text-base leading-snug line-clamp-2">
            {dishName}
          </h4>
          {sublabel && (
            <p className="mt-1 text-xs md:text-sm font-semibold text-black line-clamp-1">{sublabel}</p>
          )}
        </div>

        {/* Price & Quantity Area */}
        <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-gray-200 gap-1.5">
          {showPrice && dishPrice != null ? (
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-black font-medium leading-tight">Price</span>
              <span className="font-display font-bold text-black text-xs sm:text-sm truncate">
                {formatCurrency(dishPrice)}
              </span>
            </div>
          ) : (
            <span className="text-xs sm:text-sm font-bold text-black truncate">
              {sublabel || 'Included'}
            </span>
          )}

          {selectable && showQuantity && (onIncrease || onDecrease || onSelect) ? (
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {currentQuantity > 0 ? (
                <div className="inline-flex items-center gap-1 bg-white border border-gold-300 rounded-lg p-0.5 shadow-sm">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDecrease) onDecrease();
                      else if (onSelect) onSelect(dish);
                    }}
                    disabled={disabled || currentQuantity <= minQuantity}
                    title="Decrease quantity"
                    aria-label={`Decrease quantity of ${dishName}`}
                    className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-gold-50 text-gold-800 hover:bg-gold-200 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className="min-w-[1.25rem] sm:min-w-[1.5rem] text-center font-display font-bold text-xs sm:text-sm text-charcoal select-none">
                    {currentQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onIncrease) onIncrease();
                      else if (onSelect) onSelect(dish);
                    }}
                    disabled={disabled || (maxQuantity && currentQuantity >= maxQuantity)}
                    title="Increase quantity"
                    aria-label={`Increase quantity of ${dishName}`}
                    className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-gold-500 text-white shadow-sm hover:bg-gold-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (disabled) return;
                    if (onIncrease) onIncrease();
                    else if (onSelect) onSelect(dish);
                  }}
                  disabled={disabled}
                  title={`Add ${dishName}`}
                  aria-label={`Add ${dishName}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-gold-50 text-gold-800 hover:bg-gold-500 hover:text-white border border-gold-200 transition-all active:scale-95 shadow-2xs"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span>Add</span>
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
