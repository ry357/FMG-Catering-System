// Rule-based food-cost model for FMG Catering.
// The system does not track itemized purchasing, so food cost is ESTIMATED
// deterministically from booked events using per-tier cost ratios. This is a
// business rule, not machine learning. Ratios are the industry-standard range
// for catering cost of goods (food, beverage, and staffing).
import { PACKAGES } from '../data/catalog.js';

const DEFAULT_RATIO = 0.42;

const TIER_RATIO = {
  1: 0.45, // Essential package — lower per-guest price, thinner margin
  2: 0.4, // Premium package
  3: 0.35, // Grand package — higher per-guest price, better margin
};

export const ratioForPackage = (preferredPackage) => {
  if (!preferredPackage) return DEFAULT_RATIO;
  const tier = Object.keys(TIER_RATIO).find(
    (id) => String(id) === String(preferredPackage)
  );
  return tier ? TIER_RATIO[tier] : DEFAULT_RATIO;
};

export const packageFor = (preferredPackage) =>
  PACKAGES.find((pkg) => String(pkg.id) === String(preferredPackage));

// Invoiced value for a booking: the agreed total, the package rate when known,
// the client budget, or the base per-guest rate as a final fallback.
export const estimateInvoice = (booking) => {
  const totalAmount = Number(booking?.total_amount || 0);
  if (totalAmount > 0) return totalAmount;

  const pkg = packageFor(booking?.preferred_package);
  const guests = Number(booking?.number_of_guests || 0);
  if (pkg && guests > 0) return Number((guests * pkg.pricePerGuest).toFixed(2));

  const budget = Number(booking?.budget || 0);
  if (budget > 0) return budget;

  return Number((guests * 350).toFixed(2));
};

// Estimated food cost for a single booking (rule-based).
export const estimateFoodCost = (booking) => {
  const invoice = estimateInvoice(booking);
  return Number((invoice * ratioForPackage(booking?.preferred_package)).toFixed(2));
};