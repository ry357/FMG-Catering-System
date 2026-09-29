import 'dotenv/config';
import { query, execute } from '../config/dbHelper.js';

const PACKAGES = [
  {
    name: 'Essential Package',
    description: 'For intimate gatherings and casual celebrations.',
    pricePerGuest: 350,
    minGuests: 70,
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
    name: 'Premium Package',
    description: 'Most popular for weddings and milestone events.',
    pricePerGuest: 650,
    minGuests: 70,
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
    name: 'Grand Package',
    description: 'Luxury catering for large-scale occasions.',
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

async function seedPackages() {
  try {
    const existing = await query('SELECT COUNT(*) as count FROM Packages');
    if (existing[0].count > 0) {
      console.log('Packages table is already populated. Skipping seed.');
      process.exit(0);
    }

    console.log('Seeding Packages...');
    for (const pkg of PACKAGES) {
      await execute(
        `INSERT INTO Packages (name, description, price_per_guest, min_guests, max_guests, event_types, features, featured) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pkg.name,
          pkg.description,
          pkg.pricePerGuest,
          pkg.minGuests,
          pkg.maxGuests,
          JSON.stringify(pkg.eventTypes),
          JSON.stringify(pkg.features),
          pkg.featured ? 1 : 0
        ]
      );
    }
    console.log('Successfully seeded Packages.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding packages:', error);
    process.exit(1);
  }
}

seedPackages();
