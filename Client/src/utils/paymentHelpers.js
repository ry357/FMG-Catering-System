import { PACKAGES, PLATTER_MENU } from '../data/landingData';
import { getFoodLimits } from './bookingHelpers';
import { formatCurrency } from './helpers';

export const DEPOSIT_RATE = 0.5; // 50% deposit for catering down payments
export const MIN_DEPOSIT = 500;
export const SERVICE_BASE_FEE = 5000;
export const SERVICE_BASE_GUESTS = 70;
export const SERVICE_GROWTH_RATE = 0.02;

export const PLATTER_GROUPS = [
  { id: 'mains', label: 'Main Dishes', unit: '₱1,300 per platter · ₱1,500 w/ chafer' },
  { id: 'specials', label: 'Whole Lechon', unit: '₱8,000 per whole' },
  { id: 'sides', label: 'Side Dishes', unit: '₱500 per platter · ₱600 w/ chafer' },
  { id: 'drinks', label: 'Drinks', unit: '₱200 per jar' },
  { id: 'fruits', label: 'Fresh Fruits', unit: '₱300 per platter' },
];

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

export function getPriceBreakdown({
  category = 'natural',
  form = {},
  selectedOffer = null,
  selections = null,
  platters = null,
  includeChafer = false,
  packageId = null,
}) {
  const isDropOff = category === 'drop-off';
  const guests = Number(form.numberOfGuests) || 0;
  const items = [];

  if (isDropOff) {
    PLATTER_GROUPS.forEach((group) => {
      const catalog = PLATTER_MENU[group.id] || [];
      const quantities = platters?.[group.id] || {};
      Object.entries(quantities).forEach(([id, qty]) => {
        const count = Number(qty) || 0;
        if (count <= 0) return;
        const dish = catalog.find((item) => item.id === id);
        if (!dish) return;
        const unitPrice = includeChafer && dish.chaferPrice ? dish.chaferPrice : dish.price;
        const subtotal = count * unitPrice;
        items.push({
          label: `${count}× ${dish.name}`,
          category: group.label,
          unitPrice,
          count,
          sublabel: includeChafer && dish.chaferPrice
            ? `${count} platter${count > 1 ? 's' : ''} @ ${formatCurrency(unitPrice)} (with chafer)`
            : `${count} platter${count > 1 ? 's' : ''} @ ${formatCurrency(unitPrice)}`,
          amount: subtotal,
        });
      });
    });

    const total = items.reduce((sum, item) => sum + item.amount, 0);
    return {
      type: 'drop-off',
      items,
      baseTotal: 0,
      extraTotal: 0,
      dishesSubtotal: total,
      serviceFee: 0,
      total,
    };
  }

  // Full-service catering
  const pkg = PACKAGES.find((p) => String(p.id) === String(packageId || form.preferredPackageId));
  const limits = getFoodLimits({ offerId: selectedOffer?.id, packageId: pkg?.id });

  if (selectedOffer && guests > 0) {
    const baseTotal = selectedOffer.pricePerPax * guests;
    items.push({
      label: `${selectedOffer.name}`,
      category: 'Menu Set',
      sublabel: `${guests} guests × ${formatCurrency(selectedOffer.pricePerPax)}/pax`,
      amount: baseTotal,
      isBase: true,
    });

    if (selections && limits) {
      ['appetizers', 'mains', 'addons'].forEach((cat) => {
        const list = selections[cat] || [];
        const limit = limits[cat] || 0;
        if (list.length > limit) {
          const extraItems = list.slice(limit);
          extraItems.forEach((dish) => {
            const price = getDishPrice(dish, cat);
            const catLabel = cat === 'mains' ? 'Main Dish' : cat === 'appetizers' ? 'Appetizer' : 'Add-on';
            items.push({
              label: `Extra ${catLabel}: ${dish}`,
              category: `${catLabel} Add-on`,
              sublabel: `Platter add-on (exceeds ${limit} included in set)`,
              amount: price,
              isExtra: true,
            });
          });
        }
      });
    }

    const total = items.reduce((sum, item) => sum + item.amount, 0);
    return {
      type: 'set',
      items,
      baseTotal,
      extraTotal: total - baseTotal,
      dishesSubtotal: total,
      serviceFee: 0,
      total,
    };
  }

  if (pkg && guests > 0) {
    const baseTotal = pkg.pricePerGuest * guests;
    items.push({
      label: `${pkg.name}`,
      category: 'Package',
      sublabel: `${guests} guests × ${formatCurrency(pkg.pricePerGuest)}/pax`,
      amount: baseTotal,
      isBase: true,
    });

    if (selections && limits) {
      ['appetizers', 'mains', 'addons'].forEach((cat) => {
        const list = selections[cat] || [];
        const limit = limits[cat] || 0;
        if (list.length > limit) {
          const extraItems = list.slice(limit);
          extraItems.forEach((dish) => {
            const price = getDishPrice(dish, cat);
            const catLabel = cat === 'mains' ? 'Main Dish' : cat === 'appetizers' ? 'Appetizer' : 'Add-on';
            items.push({
              label: `Extra ${catLabel}: ${dish}`,
              category: `${catLabel} Add-on`,
              sublabel: `Platter add-on (exceeds ${limit} included in package)`,
              amount: price,
              isExtra: true,
            });
          });
        }
      });
    }

    const total = items.reduce((sum, item) => sum + item.amount, 0);
    return {
      type: 'package',
      items,
      baseTotal,
      extraTotal: total - baseTotal,
      dishesSubtotal: total,
      serviceFee: 0,
      total,
    };
  }

  // Full-service without a set (Custom à la carte)
  if (selections) {
    ['appetizers', 'mains', 'addons'].forEach((cat) => {
      const list = selections[cat] || [];
      const catLabel = cat === 'mains' ? 'Main Dish' : cat === 'appetizers' ? 'Appetizer' : 'Add-on';
      list.forEach((dish) => {
        const price = getDishPrice(dish, cat);
        items.push({
          label: dish,
          category: catLabel,
          sublabel: `À la carte selection`,
          amount: price,
        });
      });
    });
  }

  const serviceFee = calculateServiceVenueFee(guests);
  if (serviceFee > 0) {
    items.push({
      label: `Service, Staff & Venue Coordination Fee`,
      category: 'Service Fee',
      sublabel: `On-site staff, setup & coordination for ${guests} guests`,
      amount: serviceFee,
      isFee: true,
    });
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return {
    type: 'custom',
    items,
    baseTotal: 0,
    extraTotal: 0,
    dishesSubtotal: total - serviceFee,
    serviceFee,
    total,
  };
}
