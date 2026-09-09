import { PACKAGES } from '../data/landingData';

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

export function validateBookingForm(form) {
  const errors = {};

  if (!form.name.trim() || form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!form.contactNumber.trim()) {
    errors.contactNumber = 'Contact number is required';
  } else if (!/^[\d\s+\-()]{7,20}$/.test(form.contactNumber.trim())) {
    errors.contactNumber = 'Enter a valid contact number';
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

  const guests = Number(form.numberOfGuests);
  if (!form.numberOfGuests || guests < 1 || !Number.isInteger(guests)) {
    errors.numberOfGuests = 'Enter a valid number of guests (minimum 1)';
  }

  const budget = Number(form.budget);
  if (!form.budget || budget <= 0) {
    errors.budget = 'Enter a valid budget amount';
  }

  if (form.additionalRequests && form.additionalRequests.length > 1000) {
    errors.additionalRequests = 'Additional requests must be under 1000 characters';
  }

  return errors;
}
