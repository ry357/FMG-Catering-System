import { PACKAGES } from '../data/landingData';

// Per-offer dish selection limits. Categories follow the new booking flow:
// appetizers, mains, and add-ons (sides + desserts combined).
export const FOOD_SELECTION_LIMITS = {
  'catering-a': { appetizers: 1, mains: 3, addons: 2 },
  'catering-b': { appetizers: 1, mains: 3, addons: 2 },
  'catering-c': { appetizers: 1, mains: 3, addons: 2 },
  'catering-d': { appetizers: 1, mains: 4, addons: 2 },
  'plated-a': { appetizers: 1, mains: 1, addons: 1 },
  'plated-b': { appetizers: 1, mains: 2, addons: 1 },
  'plated-c': { appetizers: 1, mains: 2, addons: 2 },
  'packed-a': { appetizers: 0, mains: 1, addons: 1 },
  'packed-b': { appetizers: 0, mains: 2, addons: 0 },
  'packed-c': { appetizers: 0, mains: 2, addons: 1 },
  'packed-d': { appetizers: 0, mains: 2, addons: 1 },
  'packed-e': { appetizers: 0, mains: 2, addons: 2 },
};

export const PACKAGE_SELECTION_LIMITS = {
  1: { appetizers: 1, mains: 2, addons: 1 },
  2: { appetizers: 1, mains: 4, addons: 2 },
  3: { appetizers: 2, mains: 4, addons: 2 },
};

export function getFoodLimits({ offerId, packageId } = {}) {
  if (offerId && FOOD_SELECTION_LIMITS[offerId]) return FOOD_SELECTION_LIMITS[offerId];
  if (packageId && PACKAGE_SELECTION_LIMITS[Number(packageId)]) {
    return PACKAGE_SELECTION_LIMITS[Number(packageId)];
  }
  return { appetizers: 1, mains: 3, addons: 2 };
}

export function validateCategoryStep(category) {
  if (!category) return { category: 'Please choose a booking type' };
  return {};
}

export function validateMenuStep({ category, tier, selectedOffer, packageBooking }) {
  const errors = {};
  if (!packageBooking) {
    if (category === 'natural' && !tier) errors.tier = 'Please choose a service tier';
    if (category === 'natural' && !selectedOffer) {
      errors.offer = 'Please choose a menu set for your booking';
    }
  }
  return errors;
}

export function validateDropOffFoodStep(selections) {
  if (!selections) return { dropOffSelections: 'Please choose at least one item for your drop-off order' };
  const total = Object.values(selections).reduce(
    (sum, items) => sum + (Array.isArray(items) ? items.length : 0),
    0
  );
  if (total < 1) {
    return { dropOffSelections: 'Please choose at least one item for your drop-off order' };
  }
  return {};
}

export function validateFoodStep(selections, limits) {
  const errors = {};
  const labels = { appetizers: 'Appetizers', mains: 'Main dishes', addons: 'Add-ons' };

  Object.entries(labels).forEach(([category, label]) => {
    const limit = limits?.[category] || 0;
    const chosen = (selections?.[category] || []).length;
    if (limit > 0 && chosen !== limit) {
      errors[category] = `Choose exactly ${limit} ${label.toLowerCase()}`;
    } else if (chosen > limit) {
      errors[category] = `Too many ${label.toLowerCase()} chosen`;
    }
  });

  return errors;
}

function guestCapacityMatch(guests, minGuests, maxGuests) {
  const midpoint = (minGuests + maxGuests) / 2;
  const range = maxGuests - minGuests || 1;
  const distance = Math.abs(guests - midpoint) / range;
  return Math.max(0, 1 - distance);
}

export function getPackageRecommendations(eventType, guests, budget) {
  if (!eventType || !guests || !budget || guests < 1 || budget <= 0) {
    return [];
  }

  const guestCount = Number(guests);
  const budgetAmount = Number(budget);

  const eligible = PACKAGES.filter((pkg) => {
    const supportsEvent = pkg.eventTypes.includes(eventType);
    const withinGuestRange = guestCount >= pkg.minGuests && guestCount <= pkg.maxGuests;
    const estimatedTotal = pkg.pricePerGuest * guestCount;
    const withinBudget = estimatedTotal <= budgetAmount;
    return supportsEvent && withinGuestRange && withinBudget;
  });

  return eligible
    .map((pkg) => {
      const estimatedTotal = pkg.pricePerGuest * guestCount;
      const budgetUtilization = estimatedTotal / budgetAmount;
      const capacityMatch = guestCapacityMatch(guestCount, pkg.minGuests, pkg.maxGuests);
      const fitScore = budgetUtilization * 0.6 + capacityMatch * 0.4;

      return {
        ...pkg,
        estimatedTotal,
        fitScore,
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 3);
}

export function validateBookingForm(form, { requireBudget = true, requireGuests = true } = {}) {
  const errors = {};

  if (!form.name.trim() || form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!form.contactNumber.trim()) {
    errors.contactNumber = 'Contact number is required';
  } else if (!/^[\d\s+\-()]{7,20}$/.test(form.contactNumber.trim())) {
    errors.contactNumber = 'Enter a valid contact number';
  }

  if (!form.address.trim()) {
    errors.address = 'Complete address is required';
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address';
  }

  if (!form.eventType) {
    errors.eventType = 'Please select an event type';
  }

  if (!form.eventDate) {
    errors.eventDate = 'Event date is required';
  } else {
    const selected = new Date(form.eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) {
      errors.eventDate = 'Event date must be in the future';
    }
  }

  if (requireGuests) {
    const guests = Number(form.numberOfGuests);
    if (!form.numberOfGuests || guests < 1 || !Number.isInteger(guests)) {
      errors.numberOfGuests = 'Enter a valid number of guests (minimum 1)';
    }
  }

  if (requireBudget) {
    const budget = Number(form.budget);
    if (!form.budget || budget <= 0) {
      errors.budget = 'Enter a valid budget amount';
    }
  }

  if (form.additionalRequests && form.additionalRequests.length > 1000) {
    errors.additionalRequests = 'Additional requests must be under 1000 characters';
  }

  return errors;
}
