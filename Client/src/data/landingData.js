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
export const MENU_OFFERS = [
  { id: 'catering-a', name: 'Catering Set A', category: 'Catered buffet', pricePerPax: 330, includes: ['Rice', '3 pork or chicken main dishes', '1 side dish', '1 round of soft drinks'] },
  { id: 'catering-b', name: 'Catering Set B', category: 'Catered buffet', pricePerPax: 350, includes: ['Rice', '3 main dishes with beef or seafood', '1 side dish', '1 round of soft drinks'] },
  { id: 'catering-c', name: 'Catering Set C', category: 'Catered buffet', pricePerPax: 400, includes: ['Rice', '3 beef or seafood main dishes', '1 side dish', '1 round of soft drinks'] },
  { id: 'catering-d', name: 'Catering Set D', category: 'Catered buffet', pricePerPax: 430, includes: ['Rice', '4 main dishes', 'Salad', 'Pasta or vegetables', '1 round of drinks'] },
  { id: 'packed-a', name: 'Packed Meal Set A', category: 'Packed meals', pricePerPax: 150, includes: ['Rice', 'Soft drink or bottled water', '1 main dish', '1 side dish'] },
  { id: 'packed-b', name: 'Packed Meal Set B', category: 'Packed meals', pricePerPax: 180, includes: ['Rice', 'Soft drink or bottled water', '2 main dishes'] },
  { id: 'packed-c', name: 'Packed Meal Set C', category: 'Packed meals', pricePerPax: 200, includes: ['Rice', 'Soft drink or bottled water', '2 main dishes', '1 side dish'] },
  { id: 'packed-d', name: 'Packed Meal Set D', category: 'Packed meals', pricePerPax: 230, includes: ['Rice', 'Soft drink or bottled water', '2 main dishes', '1 side dish', 'Dessert or fruit'] },
  { id: 'packed-e', name: 'Packed Meal Set E', category: 'Packed meals', pricePerPax: 250, includes: ['Rice', 'Soft drink or bottled water', 'Grilled fish or chicken', '1 main dish', '1 side dish', 'Dessert or fruit'] },
];

export const MENU_CHOICES = {
  mains: ['Pork Afritada', 'Pork Steak', 'Pork Sweet & Sour', 'Pork Menudo', 'Pork Teriyaki', 'Pinoy Humba', 'Chicken Cordon Bleu', 'Buttered Chicken', 'Chicken Curry', 'Chicken Fillet', 'Corn Shrimp', 'Sweet & Sour Fish', 'Buttered Shrimp', 'Beef Steak', 'Beef Teriyaki', 'Beef Kare-Kare'],
  sides: ['Special Chopsuey', 'Vegetable Lumpia', 'Corn Soup', 'Mushroom Soup', 'Pancit Guisado', 'Bam-e', 'Pinoy Spaghetti', 'Carbonara'],
  desserts: ['Mango Tapioca', 'Buko Pandan', 'Chicken Macaroni Salad', 'Buko Mango Sago', 'Fresh Fruit Salad'],
};
