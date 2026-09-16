export const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Packages', href: '#packages' },
  { label: 'Contact', href: '#contact' },
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

export const EVENT_TYPES = [
  'Wedding',
  'Birthday',
  'Corporate',
  'Anniversary',
  'Gala',
  'Other',
];

// Top-level booking categories. A booking is either a full-service (natural)
// event with on-site staff, or a drop-off where FMG delivers food and leaves.
export const BOOKING_CATEGORIES = [
  {
    id: 'natural',
    label: 'Full-Service Catering',
    shortLabel: 'Full Service Catering',
    description:
      'Complete event catering with waiters, servers, on-site setup, and coordination. Ideal for weddings, corporate events, and larger gatherings.',
  },
  {
    id: 'drop-off',
    label: 'Drop-Off Catering',
    shortLabel: 'Drop-Off',
    description:
      'Pre-packed meals delivered ready to serve. FMG brings the food to your location and leaves — no service staff, simple and budget-friendly.',
  },
];

// Baseline full-service tiers the client chooses inside the natural flow.
export const MENU_TIERS = [
  {
    id: 'buffet',
    label: 'Buffet',
    description: 'Self-serve food stations set up at your venue, ideal for medium to large gatherings.',
  },
  {
    id: 'plated',
    label: 'Plated',
    description: 'Individually served courses brought to each guest, perfect for formal events.',
  },
];

// Dietary preferences the client can select up front before food selection.
export const DIETARY_PREFERENCES = [
  'Vegetarian',
  'No pork',
  'Halal',
  'No seafood',
  'Gluten-free',
  'No nuts',
];

export const CONTACT_INFO = {
  address: 'Carcar City, Cebu, Philippines',
  phone: '+63 912 345 6789',
  email: 'hello@fmgcatering.com',
  hours: 'Mon – Sat: 8:00 AM – 6:00 PM',
};

// Menu Items with Categories and Prices
export const MENU_ITEMS = {
  appetizers: [
    { id: 'a1', name: 'Fresh Garden Salad', price: 85, description: 'Mixed greens with vinaigrette dressing' },
    { id: 'a2', name: 'Creamy Mushroom Soup', price: 95, description: 'Wild mushroom soup with herbs' },
    { id: 'a3', name: 'Shrimp Cocktail', price: 150, description: 'Jumbo shrimp with cocktail sauce' },
    { id: 'a4', name: 'Chicken Satay', price: 120, description: 'Grilled chicken skewers with peanut sauce' },
    { id: 'a5', name: 'Cheese Platter', price: 180, description: 'Assorted cheeses with crackers' },
  ],
  mainDishes: [
    { id: 'm1', name: 'Grilled Chicken', price: 180, description: 'Herb-crusted chicken breast' },
    { id: 'm2', name: 'Beef Steak', price: 250, description: 'Tender beef steak with mushroom sauce' },
    { id: 'm3', name: 'Fried Chicken', price: 150, description: 'Crispy fried chicken with honey glaze' },
    { id: 'm4', name: 'Grilled Fish', price: 200, description: 'Fresh catch with lemon butter sauce' },
    { id: 'm5', name: 'Pork BBQ', price: 140, description: 'Marinated pork barbecue' },
    { id: 'm6', name: 'Spaghetti', price: 130, description: 'Classic Filipino-style spaghetti' },
    { id: 'm7', name: 'Roast Pork', price: 220, description: 'Slow-roasted pork with crispy skin' },
    { id: 'm8', name: 'Lumpiang Shanghai', price: 110, description: 'Crispy spring rolls' },
  ],
  sides: [
    { id: 's1', name: 'Steamed Rice', price: 35, description: 'Perfectly steamed jasmine rice' },
    { id: 's2', name: 'Garlic Rice', price: 45, description: 'Fried rice with garlic bits' },
    { id: 's3', name: 'Mashed Potatoes', price: 60, description: 'Creamy mashed potatoes with gravy' },
    { id: 's4', name: 'Mixed Vegetables', price: 70, description: 'Seasonal vegetable medley' },
    { id: 's5', name: 'Corn on the Cob', price: 50, description: 'Buttered corn on the cob' },
  ],
  desserts: [
    { id: 'd1', name: 'Leche Flan', price: 75, description: 'Creamy caramel custard' },
    { id: 'd2', name: 'Chocolate Cake', price: 85, description: 'Rich chocolate layer cake' },
    { id: 'd3', name: 'Fresh Fruit Salad', price: 90, description: 'Mixed fresh fruits in cream' },
    { id: 'd4', name: 'Ice Cream', price: 65, description: 'Assorted ice cream flavors' },
    { id: 'd5', name: 'Biko', price: 55, description: 'Traditional sticky rice cake' },
  ],
  beverages: [
    { id: 'b1', name: 'Iced Tea', price: 40, description: 'Refreshing house-brewed iced tea' },
    { id: 'b2', name: 'Soft Drinks', price: 45, description: 'Coca-Cola, Sprite, etc.' },
    { id: 'b3', name: 'Bottled Water', price: 25, description: 'Premium mineral water' },
    { id: 'b4', name: 'Fresh Juice', price: 60, description: 'Seasonal fruit juices' },
    { id: 'b5', name: 'Coffee', price: 50, description: 'Hot brewed coffee' },
  ],
};

// Prices and inclusions transcribed from FMG's supplied menu cards.
// `category` splits offers into the two booking flows: natural (full-service)
// and drop-off. Budget-based recommendations only ever surface natural offers.
export const MENU_OFFERS = [
  { id: 'catering-a', category: 'natural', name: 'Catering Set A', tier: 'buffet', pricePerPax: 330, includes: ['Rice', '3 pork or chicken main dishes', '1 side dish', '1 round of soft drinks'] },
  { id: 'catering-b', category: 'natural', name: 'Catering Set B', tier: 'buffet', pricePerPax: 350, includes: ['Rice', '3 main dishes with beef or seafood', '1 side dish', '1 round of soft drinks'] },
  { id: 'catering-c', category: 'natural', name: 'Catering Set C', tier: 'buffet', pricePerPax: 400, includes: ['Rice', '3 beef or seafood main dishes', '1 side dish', '1 round of soft drinks'] },
  { id: 'catering-d', category: 'natural', name: 'Catering Set D', tier: 'buffet', pricePerPax: 430, includes: ['Rice', '4 main dishes', 'Salad', 'Pasta or vegetables', '1 round of drinks'] },
  { id: 'plated-a', category: 'natural', name: 'Plated Set A', tier: 'plated', pricePerPax: 380, includes: ['Soup or appetizer', '1 main dish', 'Rice', '1 side dish', '1 round of drinks'] },
  { id: 'plated-b', category: 'natural', name: 'Plated Set B', tier: 'plated', pricePerPax: 430, includes: ['Soup or appetizer', '2 main dish choices', 'Rice', '1 side dish', '1 round of drinks'] },
  { id: 'plated-c', category: 'natural', name: 'Plated Set C', tier: 'plated', pricePerPax: 480, includes: ['Soup or appetizer', 'Choice of beef or seafood main', 'Rice', '1 side dish', 'Dessert or fruit', '1 round of drinks'] },
  { id: 'packed-a', category: 'drop-off', name: 'Packed Meal Set A', tier: 'drop-off', pricePerPax: 150, includes: ['Rice', 'Soft drink or bottled water', '1 main dish', '1 side dish'] },
  { id: 'packed-b', category: 'drop-off', name: 'Packed Meal Set B', tier: 'drop-off', pricePerPax: 180, includes: ['Rice', 'Soft drink or bottled water', '2 main dishes'] },
  { id: 'packed-c', category: 'drop-off', name: 'Packed Meal Set C', tier: 'drop-off', pricePerPax: 200, includes: ['Rice', 'Soft drink or bottled water', '2 main dishes', '1 side dish'] },
  { id: 'packed-d', category: 'drop-off', name: 'Packed Meal Set D', tier: 'drop-off', pricePerPax: 230, includes: ['Rice', 'Soft drink or bottled water', '2 main dishes', '1 side dish', 'Dessert or fruit'] },
  { id: 'packed-e', category: 'drop-off', name: 'Packed Meal Set E', tier: 'drop-off', pricePerPax: 250, includes: ['Rice', 'Soft drink or bottled water', 'Grilled fish or chicken', '1 main dish', '1 side dish', 'Dessert or fruit'] },
];

// Drop-off (platter-based) order catalogue. Drop-off clients do not book per
// guest or per packed set — instead they build a checklist of platters, jars of
// drinks, and fresh fruit, each with a fixed price. When the optional chafer
// (serving container) is included, main and side platters switch to their
// higher chaferPrice. `sub` groups each dish under its FMG menu category.
const platter = (id, name, sub, price, chaferPrice = null) => ({
  id,
  name,
  sub,
  price,
  ...(chaferPrice ? { chaferPrice } : {}),
});

export const PLATTER_MENU = {
  chafer: {
    label: 'Include chafer dish (serving container)',
    help: 'Disposable chafers keep each main and side platter warm. Prices go up: main platters become ₱1,500 and sides ₱600.',
  },
  mains: [
    platter('pork-afritada', 'Pork Afritada', 'Pork', 1300, 1500),
    platter('pork-steak', 'Pork Steak', 'Pork', 1300, 1500),
    platter('pork-sweet-sour', 'Pork Sweet & Sour', 'Pork', 1300, 1500),
    platter('pork-menudo', 'Pork Menudo', 'Pork', 1300, 1500),
    platter('pork-estupado', 'Pork Estupado', 'Pork', 1300, 1500),
    platter('pork-guisantes', 'Pork Guisantes', 'Pork', 1300, 1500),
    platter('pork-teriyaki', 'Pork Teriyaki', 'Pork', 1300, 1500),
    platter('pork-hawaiian', 'Pork Hawaiian Steak', 'Pork', 1300, 1500),
    platter('pork-humba', 'Pinoy Humba', 'Pork', 1300, 1500),
    platter('pork-lumpia', 'Pork Lumpia', 'Pork', 1300, 1500),
    platter('pork-embotido', 'Pork Embotido', 'Pork', 1300, 1500),
    platter('glazed-pork-belly', 'Glazed Pork Belly', 'Pork', 1300, 1500),
    platter('pork-kare-kare', 'Pork Kare-Kare', 'Pork', 1300, 1500),
    platter('chicken-cordon-bleu', 'Chicken Cordon Bleu', 'Chicken', 1300, 1500),
    platter('buttered-chicken', 'Buttered Chicken', 'Chicken', 1300, 1500),
    platter('chicken-curry', 'Chicken Curry', 'Chicken', 1300, 1500),
    platter('chicken-sweet-sour', 'Chicken Sweet & Sour', 'Chicken', 1300, 1500),
    platter('chicken-fillet', 'Chicken Fillet', 'Chicken', 1300, 1500),
    platter('chicken-afritada', 'Chicken Afritada', 'Chicken', 1300, 1500),
    platter('chicken-bacon-tarragon', 'Chicken wrapped Bacon w/ Tarragon Sauce', 'Chicken', 1300, 1500),
    platter('black-pepper-chicken', 'Black Pepper Chicken Mushroom', 'Chicken', 1300, 1500),
    platter('creamy-chicken-mushroom', 'Creamy Chicken w/ Mushroom', 'Chicken', 1300, 1500),
    platter('creamy-chicken-broccoli', 'Creamy Chicken w/ Broccoli', 'Chicken', 1300, 1500),
    platter('corn-shrimp', 'Corn Shrimp', 'Seafood', 1300, 1500),
    platter('sweet-sour-fish', 'Sweet & Sour Fish', 'Seafood', 1300, 1500),
    platter('buttered-shrimp', 'Buttered Shrimp', 'Seafood', 1300, 1500),
    platter('seafood-cajun', 'Seafood Cajun', 'Seafood', 1300, 1500),
    platter('crispy-garlic-shrimp', 'Crispy Garlic Shrimp', 'Seafood', 1300, 1500),
    platter('beef-steak', 'Beef Steak', 'Beef', 1300, 1500),
    platter('beef-teriyaki', 'Beef Teriyaki', 'Beef', 1300, 1500),
    platter('beef-steak-onion-rings', 'Beef Steak w/ Onion Rings', 'Beef', 1300, 1500),
    platter('beef-steak-tagalog', 'Beef Steak Tagalog', 'Beef', 1300, 1500),
    platter('beef-kare-kare', 'Beef Kare-Kare', 'Beef', 1300, 1500),
    platter('beef-salpicao', 'Beef Salpicao', 'Beef', 1300, 1500),
  ],
  sides: [
    platter('special-chopsuey', 'Special Chopsuey', 'Vegetables', 500, 600),
    platter('vegetable-lumpia', 'Vegetable Lumpia', 'Vegetables', 500, 600),
    platter('corn-soup', 'Corn Soup', 'Soup', 500, 600),
    platter('mushroom-soup', 'Mushroom Soup', 'Soup', 500, 600),
    platter('macaroni-soup', 'Macaroni Soup', 'Soup', 500, 600),
    platter('pancit-guisado', 'Pancit Guisado', 'Noodles', 500, 600),
    platter('bam-e', 'Bam-e', 'Noodles', 500, 600),
    platter('sotanghon', 'Sotanghon', 'Noodles', 500, 600),
    platter('mango-tapioca', 'Mango Tapioca', 'Dessert', 500, 600),
    platter('buko-pandan', 'Buko Pandan', 'Dessert', 500, 600),
    platter('chicken-macaroni-salad', 'Chicken Macaroni Salad', 'Dessert', 500, 600),
    platter('buko-mango-sago', 'Buko Mango Sago', 'Dessert', 500, 600),
    platter('fresh-fruit-salad', 'Fresh Fruit Salad', 'Dessert', 500, 600),
    platter('pinoy-spaghetti', 'Pinoy Spaghetti', 'Pasta', 500, 600),
    platter('carbonara', 'Carbonara', 'Pasta', 500, 600),
    platter('macaroni', 'Macaroni', 'Pasta', 500, 600),
    platter('alfredo-pasta', 'Alfredo Pasta', 'Pasta', 500, 600),
  ],
  drinks: [
    { id: 'gulaman', name: 'Gulaman Juice', price: 200 },
    { id: 'iced-tea', name: 'Iced Tea', price: 200 },
    { id: 'calamansi', name: 'Calamansi Juice', price: 200 },
  ],
  fruits: [
    { id: 'fresh-fruits', name: 'Fresh Fruit Platter', price: 300 },
  ],
};

export const MENU_CHOICES = {
  appetizers: ['Chicken Satay', 'Spring Rolls', 'Cheese Sticks', 'Garlic Bread', 'Fruit Platter'],
  mains: ['Pork Afritada', 'Pork Steak', 'Pork Sweet & Sour', 'Pork Menudo', 'Pork Estupado', 'Pork Guisantes', 'Pork Teriyaki', 'Pork Hawaiian Steak', 'Pinoy Humba', 'Pork Lumpia', 'Pork Embotido', 'Glazed Pork Belly', 'Pork Kare-Kare', 'Chicken Cordon Bleu', 'Buttered Chicken', 'Chicken Curry', 'Chicken Sweet & Sour', 'Chicken Fillet', 'Chicken Afritada', 'Chicken wrapped Bacon w/ Tarragon Sauce', 'Black Pepper Chicken Mushroom', 'Creamy Chicken w/ Mushroom', 'Creamy Chicken w/ Broccoli', 'Corn Shrimp', 'Sweet & Sour Fish', 'Buttered Shrimp', 'Seafood Cajun', 'Crispy Garlic Shrimp', 'Beef Steak', 'Beef Teriyaki', 'Beef Steak w/ Onion Rings', 'Beef Steak Tagalog', 'Beef Kare-Kare', 'Beef Salpicao'],
  addons: ['Special Chopsuey', 'Vegetable Lumpia', 'Corn Soup', 'Mushroom Soup', 'Macaroni Soup', 'Pancit Guisado', 'Bam-e', 'Sotanghon', 'Mango Tapioca', 'Buko Pandan', 'Chicken Macaroni Salad', 'Buko Mango Sago', 'Fresh Fruit Salad', 'Pinoy Spaghetti', 'Carbonara', 'Macaroni', 'Alfredo Pasta'],
};
