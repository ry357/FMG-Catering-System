import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FOOD_DIR = path.resolve(__dirname, '../src/assets/food');
const OUTPUT_DATA_FILE = path.resolve(__dirname, '../src/data/foodImages.js');

if (!fs.existsSync(FOOD_DIR)) {
  fs.mkdirSync(FOOD_DIR, { recursive: true });
}

// Dishes with their search queries prioritized for authentic Filipino cuisine
const DISHES = [
  // Specials
  { id: 'lechon', name: 'Whole Lechon (Roast Pig)', queries: ['Filipino Visayan lechon', 'Lechon baboy', 'Roast pig Cebu'] },
  
  // Pork
  { id: 'pork-afritada', name: 'Pork Afritada', queries: ['Pork Afritada Filipino', 'Afritada Filipino', 'Pork stew tomato'] },
  { id: 'pork-steak', name: 'Pork Steak', queries: ['Pork Bistek Filipino', 'Pork steak calamansi', 'Bistek Tagalog pork'] },
  { id: 'pork-sweet-sour', name: 'Pork Sweet & Sour', queries: ['Sweet and sour pork Filipino', 'Sweet and sour pork'] },
  { id: 'pork-menudo', name: 'Pork Menudo', queries: ['Menudo Filipino style', 'Filipino Menudo', 'Menudo stew'] },
  { id: 'pork-estupado', name: 'Pork Estupado', queries: ['Pork Estofado Filipino', 'Estofado Filipino', 'Pork braised plantain'] },
  { id: 'pork-guisantes', name: 'Pork Guisantes', queries: ['Pork guisantes Filipino', 'Pork with green peas'] },
  { id: 'pork-teriyaki', name: 'Pork Teriyaki', queries: ['Pork Teriyaki glazed', 'Teriyaki pork'] },
  { id: 'pork-hawaiian', name: 'Pork Hawaiian Steak', queries: ['Hawaiian pork steak pineapple', 'Grilled pork pineapple'] },
  { id: 'pork-humba', name: 'Pinoy Humba', queries: ['Filipino Humba', 'Pork Humba Visayan', 'Braised pork belly black beans'] },
  { id: 'pork-lumpia', name: 'Pork Lumpia', queries: ['Lumpiang Shanghai', 'Filipino lumpia egg roll', 'Lumpia spring roll'] },
  { id: 'pork-embotido', name: 'Pork Embotido', queries: ['Filipino Embutido', 'Embutido meatloaf'] },
  { id: 'glazed-pork-belly', name: 'Glazed Pork Belly', queries: ['Lechon kawali crispy', 'Glazed pork belly crispy'] },
  { id: 'pork-kare-kare', name: 'Pork Kare-Kare', queries: ['Kare-kare peanut stew', 'Kare-kare Filipino'] },
  
  // Chicken
  { id: 'chicken-cordon-bleu', name: 'Chicken Cordon Bleu', queries: ['Chicken cordon bleu sliced', 'Cordon bleu'] },
  { id: 'buttered-chicken', name: 'Buttered Chicken', queries: ['Fried chicken butter Filipino', 'Garlic butter chicken', 'Crispy buttered chicken'] },
  { id: 'chicken-curry', name: 'Chicken Curry', queries: ['Filipino chicken curry coconut', 'Chicken curry potatoes'] },
  { id: 'chicken-sweet-sour', name: 'Chicken Sweet & Sour', queries: ['Sweet and sour chicken fillet', 'Sweet and sour chicken'] },
  { id: 'chicken-fillet', name: 'Chicken Fillet', queries: ['Breaded chicken fillet cutlet', 'Chicken cutlet crispy'] },
  { id: 'chicken-afritada', name: 'Chicken Afritada', queries: ['Chicken afritada Filipino', 'Chicken tomato stew'] },
  { id: 'chicken-bacon-tarragon', name: 'Chicken wrapped Bacon w/ Tarragon Sauce', queries: ['Bacon wrapped chicken breast', 'Chicken wrapped in bacon'] },
  { id: 'black-pepper-chicken', name: 'Black Pepper Chicken Mushroom', queries: ['Black pepper chicken mushroom', 'Black pepper chicken'] },
  { id: 'creamy-chicken-mushroom', name: 'Creamy Chicken w/ Mushroom', queries: ['Creamy chicken mushroom sauce', 'Chicken with mushroom gravy'] },
  { id: 'creamy-chicken-broccoli', name: 'Creamy Chicken w/ Broccoli', queries: ['Creamy chicken broccoli pasta', 'Chicken broccoli cream'] },
  
  // Seafood
  { id: 'corn-shrimp', name: 'Corn Shrimp', queries: ['Corn and shrimp sauteed', 'Shrimp sweet corn', 'Suam na mais shrimp'] },
  { id: 'sweet-sour-fish', name: 'Sweet & Sour Fish', queries: ['Sweet and sour fish Filipino', 'Escabeche Filipino fish'] },
  { id: 'buttered-shrimp', name: 'Buttered Shrimp', queries: ['Garlic butter shrimp Filipino', 'Halabos na hipon butter'] },
  { id: 'seafood-cajun', name: 'Seafood Cajun', queries: ['Cajun seafood boil shrimp', 'Seafood cajun platter'] },
  { id: 'crispy-garlic-shrimp', name: 'Crispy Garlic Shrimp', queries: ['Crispy garlic shrimp fried', 'Fried shrimp toasted garlic'] },
  
  // Beef
  { id: 'beef-steak', name: 'Beef Steak', queries: ['Bistek Tagalog beef', 'Filipino beef steak', 'Bistek'] },
  { id: 'beef-teriyaki', name: 'Beef Teriyaki', queries: ['Beef teriyaki strips', 'Teriyaki beef steak'] },
  { id: 'beef-steak-onion-rings', name: 'Beef Steak w/ Onion Rings', queries: ['Bistek Tagalog onion rings', 'Beef steak with onion rings'] },
  { id: 'beef-steak-tagalog', name: 'Beef Steak Tagalog', queries: ['Bistek Tagalog', 'Filipino beef steak calamansi'] },
  { id: 'beef-kare-kare', name: 'Beef Kare-Kare', queries: ['Kare-kare beef oxtail', 'Kare-kare Filipino peanut stew'] },
  { id: 'beef-salpicao', name: 'Beef Salpicao', queries: ['Beef salpicao garlic', 'Filipino beef salpicao'] },
  
  // Sides / Veggies / Soups
  { id: 'special-chopsuey', name: 'Special Chopsuey', queries: ['Chopsuey Filipino stir fry', 'Chop suey vegetables'] },
  { id: 'vegetable-lumpia', name: 'Vegetable Lumpia', queries: ['Lumpiang gulay togue', 'Lumpiang sariwa vegetables', 'Vegetable spring rolls'] },
  { id: 'corn-soup', name: 'Corn Soup', queries: ['Sweet corn egg drop soup', 'Suam na mais soup'] },
  { id: 'mushroom-soup', name: 'Mushroom Soup', queries: ['Cream of mushroom soup bowl', 'Mushroom soup parsley'] },
  { id: 'macaroni-soup', name: 'Macaroni Soup', queries: ['Sopas Filipino chicken macaroni soup', 'Chicken macaroni soup sopas'] },
  { id: 'pancit-guisado', name: 'Pancit Guisado', queries: ['Pancit bihon guisado Filipino', 'Pancit guisado noodles'] },
  { id: 'bam-e', name: 'Bam-e', queries: ['Pancit bam-i Cebuano', 'Pancit canton bihon guisado', 'Bam-i noodles'] },
  { id: 'sotanghon', name: 'Sotanghon', queries: ['Pancit sotanghon guisado chicken', 'Sotanghon noodles'] },
  
  // Desserts
  { id: 'mango-tapioca', name: 'Mango Tapioca', queries: ['Mango sago dessert tapioca', 'Mango tapioca condensed milk'] },
  { id: 'buko-pandan', name: 'Buko Pandan', queries: ['Buko pandan salad dessert', 'Buko pandan green jelly'] },
  { id: 'chicken-macaroni-salad', name: 'Chicken Macaroni Salad', queries: ['Filipino chicken macaroni salad', 'Chicken macaroni salad'] },
  { id: 'buko-mango-sago', name: 'Buko Mango Sago', queries: ['Mango buko sago dessert', 'Mango sago cream'] },
  { id: 'fresh-fruit-salad', name: 'Fresh Fruit Salad', queries: ['Filipino fruit salad cream', 'Fruit salad condensed milk'] },
  { id: 'pinoy-spaghetti', name: 'Pinoy Spaghetti', queries: ['Filipino spaghetti sweet hotdog', 'Pinoy spaghetti'] },
  { id: 'carbonara', name: 'Carbonara', queries: ['Creamy carbonara bacon pasta', 'Filipino style carbonara'] },
  { id: 'macaroni', name: 'Macaroni', queries: ['Baked macaroni Filipino cheese', 'Baked macaroni pasta'] },
  { id: 'alfredo-pasta', name: 'Alfredo Pasta', queries: ['Fettuccine alfredo creamy pasta', 'Alfredo pasta parsley'] },
  
  // Drinks
  { id: 'gulaman', name: 'Gulaman Juice', queries: ['Sago at gulaman drink', 'Gulaman brown sugar cooler'] },
  { id: 'iced-tea', name: 'Iced Tea', queries: ['Iced tea glass lemon slice', 'House iced tea pitcher'] },
  { id: 'calamansi', name: 'Calamansi Juice', queries: ['Calamansi juice drink fresh', 'Calamansi juice glass'] },
  
  // Fruits
  { id: 'fresh-fruits', name: 'Fresh Fruit Platter', queries: ['Fresh fruit platter catering sliced', 'Fresh tropical fruit platter watermelon pineapple'] },
  
  // Additional choices in full service
  { id: 'chicken-satay', name: 'Chicken Satay', queries: ['Chicken satay skewers peanut sauce', 'Chicken satay'] },
  { id: 'spring-rolls', name: 'Spring Rolls', queries: ['Lumpiang Shanghai golden', 'Crispy spring rolls'] },
  { id: 'cheese-sticks', name: 'Cheese Sticks', queries: ['Filipino cheese sticks lumpia', 'Fried cheese sticks'] },
  { id: 'garlic-bread', name: 'Garlic Bread', queries: ['Garlic bread toasted parsley', 'Garlic bread slices'] },
  { id: 'fruit-platter', name: 'Fruit Platter', queries: ['Fresh sliced fruit platter', 'Tropical fruit platter catering'] }
];

async function searchWikimedia(query) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FMGCateringSystem/1.0 (contact@fmgcateringservices.com)' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = Object.values(data?.query?.pages || {});
    for (const page of pages) {
      const thumb = page.imageinfo?.[0]?.thumburl;
      if (thumb && (thumb.endsWith('.jpg') || thumb.endsWith('.png') || thumb.endsWith('.jpeg') || thumb.includes('.jpg?') || thumb.includes('.png?') || thumb.includes('.jpeg?'))) {
        return thumb;
      }
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function downloadFile(url, destPath) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FMGCateringSystem/1.0 (contact@fmgcateringservices.com)' }
    });
    if (!res.ok) return false;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 5000) return false; // Ensure it's not a tiny error response
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (err) {
    return false;
  }
}

async function run() {
  console.log(`Starting image curation for ${DISHES.length} dishes...`);
  const results = {};

  // Reliable culinary catering fallback image URL
  const genericFallbackUrl = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Bistek_Tagalog_DSCF3899.jpg/960px-Bistek_Tagalog_DSCF3899.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail';

  for (const dish of DISHES) {
    const filePath = path.join(FOOD_DIR, `${dish.id}.jpg`);
    let downloaded = false;

    // Check if already downloaded and valid
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 10000) {
      downloaded = true;
      console.log(`[Cached] ${dish.name}`);
    } else {
      for (const query of dish.queries) {
        const thumbUrl = await searchWikimedia(query);
        if (thumbUrl) {
          console.log(`Fetching ${dish.name} from query: "${query}" -> ${thumbUrl.substring(0, 70)}...`);
          const ok = await downloadFile(thumbUrl, filePath);
          if (ok) {
            downloaded = true;
            break;
          }
        }
      }

      if (!downloaded) {
        console.warn(`[Fallback] Downloading fallback for ${dish.name}...`);
        await downloadFile(genericFallbackUrl, filePath);
      }
    }

    results[dish.id] = {
      id: dish.id,
      name: dish.name,
      fileName: `${dish.id}.jpg`
    };
  }

  // Generate foodImages.js
  const imports = DISHES.map((d) => `import ${camelCase(d.id)}Img from '../assets/food/${d.id}.jpg';`).join('\n');
  const mappingEntries = DISHES.map((d) => `  '${d.id}': ${camelCase(d.id)}Img,`).join('\n');
  const nameEntries = DISHES.map((d) => `  '${d.name}': ${camelCase(d.id)}Img,`).join('\n');

  const fileContent = `// Auto-generated food images map for FMG Catering System
// Consistent background framing and authentic Filipino dishes

${imports}

export const FOOD_IMAGES_BY_ID = {
${mappingEntries}
};

export const FOOD_IMAGES_BY_NAME = {
${nameEntries}
};

/**
 * Get food image with unified fallback support
 * @param {string} key - Dish ID or dish Name
 * @returns {string} - Image source URL/asset
 */
export function getFoodImage(key) {
  if (!key) return null;
  if (FOOD_IMAGES_BY_ID[key]) return FOOD_IMAGES_BY_ID[key];
  if (FOOD_IMAGES_BY_NAME[key]) return FOOD_IMAGES_BY_NAME[key];
  
  // Case-insensitive / slug matching fallback
  const cleanKey = String(key).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  for (const [id, img] of Object.entries(FOOD_IMAGES_BY_ID)) {
    if (id === cleanKey || cleanKey.includes(id) || id.includes(cleanKey)) {
      return img;
    }
  }
  
  // Name substring matching
  for (const [name, img] of Object.entries(FOOD_IMAGES_BY_NAME)) {
    if (name.toLowerCase().includes(String(key).toLowerCase()) || String(key).toLowerCase().includes(name.toLowerCase())) {
      return img;
    }
  }

  // Default signature catering presentation fallback
  return FOOD_IMAGES_BY_ID['lechon'] || FOOD_IMAGES_BY_ID['pork-lumpia'] || null;
}
`;

  fs.writeFileSync(OUTPUT_DATA_FILE, fileContent, 'utf-8');
  console.log(`Generated ${OUTPUT_DATA_FILE} successfully!`);
}

function camelCase(str) {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '');
}

run().catch(console.error);
