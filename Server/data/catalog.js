// Static public catalog served by the API.
// Mirrors Client/src/data/landingData.js — keep both in sync until a catalog table is added.

export const PACKAGES = [
  {
    id: 1,
    name: 'Essential Package',
    description: 'Perfect for intimate gatherings and casual celebrations.',
    pricePerGuest: 350,
    minGuests: 20,
    maxGuests: 80,
    eventTypes: ['Birthday', 'Corporate', 'Anniversary'],
    features: [
      'Choice of 2 main dishes',
      '1 dessert option',
      'Basic table setup',
      'Service staff included',
    ],
    featured: false,
  },
  {
    id: 2,
    name: 'Premium Package',
    description: 'Our most popular choice for weddings and milestone events.',
    pricePerGuest: 650,
    minGuests: 50,
    maxGuests: 200,
    eventTypes: ['Wedding', 'Birthday', 'Corporate', 'Anniversary'],
    features: [
      'Choice of 4 main dishes',
      '2 dessert options',
      'Premium table styling',
      'Dedicated event coordinator',
      'Complimentary tasting session',
    ],
    featured: true,
  },
  {
    id: 3,
    name: 'Grand Package',
    description: 'Luxury catering for large-scale and high-profile occasions.',
    pricePerGuest: 950,
    minGuests: 100,
    maxGuests: 500,
    eventTypes: ['Wedding', 'Corporate', 'Gala'],
    features: [
      'Full custom menu design',
      'Live cooking stations',
      'Premium dessert bar',
      'Full event styling',
      'VIP guest menu options',
      'Dedicated service team',
    ],
    featured: false,
  },
];

export const SERVICES = [
  {
    id: 1,
    title: 'Wedding Catering',
    description:
      'Elegant multi-course menus, cocktail receptions, and full-service dining tailored to your special day.',
    icon: 'rings',
  },
  {
    id: 2,
    title: 'Corporate Events',
    description:
      'Professional catering for conferences, meetings, product launches, and company celebrations.',
    icon: 'briefcase',
  },
  {
    id: 3,
    title: 'Birthday Celebrations',
    description:
      'Memorable feasts for milestone birthdays, from intimate gatherings to grand party spreads.',
    icon: 'cake',
  },
  {
    id: 4,
    title: 'Buffet & Plated Service',
    description:
      'Flexible service styles with beautifully presented dishes for events of any size.',
    icon: 'utensils',
  },
  {
    id: 5,
    title: 'Custom Menu Planning',
    description:
      'Work with our team to design menus that match your theme, dietary needs, and budget.',
    icon: 'clipboard',
  },
  {
    id: 6,
    title: 'On-Site Event Setup',
    description:
      'Complete setup, service staff, and cleanup so you can focus on your guests.',
    icon: 'setup',
  },
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: 'Maria Santos',
    event: 'Wedding Reception',
    quote:
      'FMG Catering made our wedding day flawless. Every dish was beautifully presented and our guests are still talking about the food months later.',
    rating: 5,
  },
  {
    id: 2,
    name: 'James Rivera',
    event: 'Corporate Annual Dinner',
    quote:
      'Professional from start to finish. The team handled 200 guests seamlessly and the menu exceeded our expectations.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Ana Delgado',
    event: '50th Birthday Celebration',
    quote:
      'They listened to our budget and guest count and recommended the perfect package. The event felt luxurious without going over budget.',
    rating: 5,
  },
];

// Menu catalog mirrored from Client/src/data/landingData.js (MENU_CHOICES + MENU_ITEMS).
// Used by analytics to rank foods, side dishes, and drinks by popularity.
export const MENU_CATALOG = {
  foods: [
    'Lechon',
    'Pork Afritada',
    'Pork Steak',
    'Pork Sweet & Sour',
    'Pork Menudo',
    'Pork Teriyaki',
    'Pinoy Humba',
    'Chicken Cordon Bleu',
    'Buttered Chicken',
    'Chicken Curry',
    'Chicken Fillet',
    'Corn Shrimp',
    'Sweet & Sour Fish',
    'Buttered Shrimp',
    'Beef Steak',
    'Beef Teriyaki',
    'Beef Kare-Kare',
    'Grilled Chicken',
    'Fried Chicken',
    'Grilled Fish',
    'Pork BBQ',
    'Spaghetti',
    'Roast Pork',
    'Lumpiang Shanghai',
  ],
  sides: [
    'Special Chopsuey',
    'Vegetable Lumpia',
    'Corn Soup',
    'Mushroom Soup',
    'Pancit Guisado',
    'Bam-e',
    'Pinoy Spaghetti',
    'Carbonara',
    'Steamed Rice',
    'Garlic Rice',
    'Mashed Potatoes',
    'Mixed Vegetables',
    'Corn on the Cob',
  ],
  drinks: ['Iced Tea', 'Soft Drinks', 'Bottled Water', 'Fresh Juice', 'Coffee'],
};