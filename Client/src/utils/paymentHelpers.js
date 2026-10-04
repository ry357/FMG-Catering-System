import { PACKAGES } from '../data/landingData';
import { getFoodLimits } from './bookingHelpers';

export const DEPOSIT_RATE = 0.5; // 50% deposit for catering down payments
export const MIN_DEPOSIT = 500;
export const SERVICE_BASE_FEE = 5000;
export const SERVICE_BASE_GUESTS = 70;
export const SERVICE_GROWTH_RATE = 0.02;

export function calculateServiceVenueFee(guests) {
  const g = Number(guests);
  if (!Number.isFinite(g) || g <= 0) return 0;
  return Math.round(SERVICE_BASE_FEE * Math.pow(1 + SERVICE_GROWTH_RATE, Math.max(0, g - SERVICE_BASE_GUESTS)));
}

export function getDishPrice(dishName, category) {
  if (category === 'mains') {
    if (dishName && dishName.toLowerCase().includes('lechon')) return 8000;
    return 1300;
  }
  if (category === 'appetizers') {
    if (dishName && dishName.toLowerCase().includes('fruit')) return 300;
    return 500;
  }
  // addons / sides
  return 500;
}

export function calculateExtraDishesCost(selections, offerId = null, packageId = null) {
  if (!selections) return 0;
  const limits = getFoodLimits({ offerId, packageId });
  if (!limits) return 0;
  let extraCost = 0;
  ['appetizers', 'mains', 'addons'].forEach((cat) => {
    const list = selections[cat] || [];
    const limit = limits[cat] || 0;
    if (list.length > limit) {
      const extraItems = list.slice(limit);
      extraItems.forEach((dish) => {
        extraCost += getDishPrice(dish, cat);
      });
    }
  });
  return extraCost;
}

export function calculateAllDishesCost(selections) {
  if (!selections) return 0;
  let total = 0;
  ['appetizers', 'mains', 'addons'].forEach((cat) => {
    const list = selections[cat] || [];
    list.forEach((dish) => {
      total += getDishPrice(dish, cat);
    });
  });
  return total;
}

export function generateBookingRef() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FMG-${timestamp}-${random}`;
}

export function calculateBookingTotal(form, selectedOffer = null, selections = null) {
  const guests = Number(form.numberOfGuests) || 0;

  if (selectedOffer && guests > 0) {
    const base = selectedOffer.pricePerPax * guests;
    const extra = calculateExtraDishesCost(selections, selectedOffer.id);
    return base + extra;
  }

  const pkg = PACKAGES.find((p) => String(p.id) === String(form.preferredPackageId));
  if (pkg && guests > 0) {
    const base = pkg.pricePerGuest * guests;
    const extra = calculateExtraDishesCost(selections, null, pkg.id);
    return base + extra;
  }

  // Full-service without a set (Custom à la carte)
  const dishesCost = calculateAllDishesCost(selections);
  const serviceFee = calculateServiceVenueFee(guests);
  if (dishesCost > 0 || serviceFee > 0) {
    return dishesCost + serviceFee;
  }

  return Number(form.budget) || 0;
}

export function calculateDepositAmount(total) {
  if (!total || total <= 0) return 0;
  return Math.max(MIN_DEPOSIT, Math.round(total * DEPOSIT_RATE));
}

export function getSelectedPackageName(form, selectedOffer = null, tier = '') {
  if (selectedOffer?.name) return selectedOffer.name;
  const pkg = PACKAGES.find((p) => String(p.id) === String(form.preferredPackageId));
  if (pkg) return pkg.name;
  if (tier) return `${tier.charAt(0).toUpperCase() + tier.slice(1)} - Custom Menu`;
  return 'Custom Menu (À la Carte)';
}

export function buildMenuItems(selections = {}) {
  const items = [];
  const push = (category, list) =>
    (list || []).forEach((name) =>
      items.push({ name, category })
    );

  push('appetizers', selections.appetizers);
  push('mains', selections.mains);
  push('addons', selections.addons);
  return items;
}
