import { PACKAGES } from '../data/landingData';

export const DEPOSIT_RATE = 0.5; // 50% deposit for catering down payments
export const MIN_DEPOSIT = 500;

export function generateBookingRef() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FMG-${timestamp}-${random}`;
}

export function calculateBookingTotal(form) {
  const guests = Number(form.numberOfGuests);
  const pkg = PACKAGES.find((p) => String(p.id) === String(form.preferredPackageId));

  if (pkg && guests > 0) {
    return pkg.pricePerGuest * guests;
  }

  return Number(form.budget) || 0;
}

export function calculateDepositAmount(total) {
  if (!total || total <= 0) return 0;
  return Math.max(MIN_DEPOSIT, Math.round(total * DEPOSIT_RATE));
}

export function getSelectedPackageName(form) {
  const pkg = PACKAGES.find((p) => String(p.id) === String(form.preferredPackageId));
  return pkg?.name || 'Custom package (based on budget)';
}
