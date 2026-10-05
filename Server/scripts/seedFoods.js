import 'dotenv/config';
import { fileURLToPath } from 'url';
import path from 'path';
import { query, execute } from '../config/dbHelper.js';
import { DEFAULT_FOODS } from '../data/defaultFoods.js';

export async function ensureAndSeedFoods() {
  try {
    // Create Foods table if not exists
    await execute(`
      CREATE TABLE IF NOT EXISTS Foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        price REAL NOT NULL,
        chafer_price REAL,
        description TEXT,
        image_id TEXT,
        is_available BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check count
    const rows = await query('SELECT COUNT(*) as count FROM Foods');
    const count = Number(rows[0]?.count ?? 0);

    if (count > 0) {
      console.log(`Foods table already contains ${count} items. Skipping initial seed.`);
      return count;
    }

    console.log(`Seeding ${DEFAULT_FOODS.length} default food items...`);
    for (const food of DEFAULT_FOODS) {
      await execute(
        `INSERT INTO Foods (name, category, subcategory, price, chafer_price, description, image_id, is_available)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          food.name,
          food.category,
          food.subcategory || null,
          food.price,
          food.chafer_price || null,
          food.description || null,
          food.image_id || null,
          food.is_available ?? 1,
        ]
      );
    }

    console.log(`✅ Successfully seeded ${DEFAULT_FOODS.length} food items.`);
    return DEFAULT_FOODS.length;
  } catch (err) {
    console.error('Error ensuring/seeding foods:', err);
    throw err;
  }
}

// Standalone execution
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  ensureAndSeedFoods()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
