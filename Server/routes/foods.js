import express from 'express';
import { query, queryOne, execute, executeWithId } from '../config/dbHelper.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logActivity } from '../services/activityLogService.js';
import { ensureAndSeedFoods } from '../scripts/seedFoods.js';

const router = express.Router();

// GET all foods (public so client menus & booking flows reflect live prices)
router.get('/', async (req, res) => {
  try {
    const { category, available_only } = req.query;

    let sql = 'SELECT * FROM Foods';
    const conditions = [];
    const params = [];

    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (available_only === 'true' || available_only === '1') {
      conditions.push('is_available = 1');
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY category ASC, subcategory ASC, name ASC';

    let foods = await query(sql, params);

    // If table is completely empty, attempt self-healing seed
    if (!foods || foods.length === 0) {
      const allRows = await query('SELECT COUNT(*) as count FROM Foods');
      if (Number(allRows[0]?.count ?? 0) === 0) {
        await ensureAndSeedFoods();
        foods = await query(sql, params);
      }
    }

    // Format boolean fields
    const formatted = (foods || []).map((f) => ({
      ...f,
      price: Number(f.price),
      chafer_price: f.chafer_price != null ? Number(f.chafer_price) : null,
      is_available: Boolean(f.is_available),
    }));

    res.json({ success: true, foods: formatted });
  } catch (error) {
    console.error('Error fetching foods:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch food items' });
  }
});

// GET single food item
router.get('/:id', async (req, res) => {
  try {
    const food = await queryOne('SELECT * FROM Foods WHERE id = ?', [req.params.id]);
    if (!food) {
      return res.status(404).json({ success: false, error: 'Food item not found' });
    }
    res.json({
      success: true,
      food: {
        ...food,
        price: Number(food.price),
        chafer_price: food.chafer_price != null ? Number(food.chafer_price) : null,
        is_available: Boolean(food.is_available),
      },
    });
  } catch (error) {
    console.error('Error fetching food item:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch food item' });
  }
});

// POST create new food item (Admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      name,
      category = 'mains',
      subcategory = null,
      price,
      chafer_price = null,
      description = null,
      image_id = null,
      is_available = 1,
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Dish name is required' });
    }

    const numPrice = Number(price);
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, error: 'Valid base price is required' });
    }

    const numChafer = chafer_price !== null && chafer_price !== '' && chafer_price !== undefined
      ? Number(chafer_price)
      : null;

    const trimmedName = name.trim();
    const cleanImageId = image_id || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const id = await executeWithId(
      `INSERT INTO Foods (name, category, subcategory, price, chafer_price, description, image_id, is_available)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trimmedName,
        category,
        subcategory ? subcategory.trim() : null,
        numPrice,
        numChafer,
        description ? description.trim() : null,
        cleanImageId,
        is_available ? 1 : 0,
      ]
    );

    await logActivity({
      action: 'food_created',
      category: 'menu',
      description: `Added "${trimmedName}" to ${category} priced at ₱${numPrice.toLocaleString()}${numChafer ? ` (chafer: ₱${numChafer.toLocaleString()})` : ''}`,
      performed_by: req.user.username || req.user.email,
      details: { id, name: trimmedName, category, price: numPrice, chafer_price: numChafer },
    });

    res.status(201).json({
      success: true,
      id,
      message: 'Food item created successfully',
      food: {
        id,
        name: trimmedName,
        category,
        subcategory,
        price: numPrice,
        chafer_price: numChafer,
        description,
        image_id: cleanImageId,
        is_available: Boolean(is_available),
      },
    });
  } catch (error) {
    console.error('Error creating food item:', error);
    res.status(500).json({ success: false, error: 'Failed to create food item' });
  }
});

// PUT update entire food item (Admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      subcategory,
      price,
      chafer_price,
      description,
      image_id,
      is_available,
    } = req.body;

    const existing = await queryOne('SELECT * FROM Foods WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Food item not found' });
    }

    const trimmedName = name ? name.trim() : existing.name;
    const numPrice = price !== undefined ? Number(price) : existing.price;
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, error: 'Valid price is required' });
    }

    const numChafer = chafer_price !== undefined
      ? (chafer_price === null || chafer_price === '' ? null : Number(chafer_price))
      : existing.chafer_price;

    await execute(
      `UPDATE Foods
       SET name = ?, category = ?, subcategory = ?, price = ?, chafer_price = ?, description = ?, image_id = ?, is_available = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        trimmedName,
        category || existing.category,
        subcategory !== undefined ? subcategory : existing.subcategory,
        numPrice,
        numChafer,
        description !== undefined ? description : existing.description,
        image_id !== undefined ? image_id : existing.image_id,
        is_available !== undefined ? (is_available ? 1 : 0) : existing.is_available,
        id,
      ]
    );

    const priceChanged = existing.price !== numPrice || existing.chafer_price !== numChafer;
    await logActivity({
      action: priceChanged ? 'food_price_updated' : 'food_updated',
      category: 'menu',
      description: priceChanged
        ? `Updated price of "${trimmedName}": ₱${existing.price} → ₱${numPrice}${numChafer ? ` (chafer: ₱${numChafer})` : ''}`
        : `Updated food item details for "${trimmedName}"`,
      performed_by: req.user.username || req.user.email,
      details: { id, oldPrice: existing.price, newPrice: numPrice, oldChafer: existing.chafer_price, newChafer: numChafer },
    });

    res.json({
      success: true,
      message: 'Food item updated successfully',
      food: {
        id: Number(id),
        name: trimmedName,
        category: category || existing.category,
        subcategory: subcategory !== undefined ? subcategory : existing.subcategory,
        price: numPrice,
        chafer_price: numChafer,
        description: description !== undefined ? description : existing.description,
        image_id: image_id !== undefined ? image_id : existing.image_id,
        is_available: is_available !== undefined ? Boolean(is_available) : Boolean(existing.is_available),
      },
    });
  } catch (error) {
    console.error('Error updating food item:', error);
    res.status(500).json({ success: false, error: 'Failed to update food item' });
  }
});

// PATCH quick update price only (Admin only)
router.patch('/:id/price', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { price, chafer_price } = req.body;

    const existing = await queryOne('SELECT * FROM Foods WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Food item not found' });
    }

    const numPrice = Number(price);
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, error: 'Valid price is required' });
    }

    const numChafer = chafer_price !== undefined
      ? (chafer_price === null || chafer_price === '' ? null : Number(chafer_price))
      : existing.chafer_price;

    await execute(
      'UPDATE Foods SET price = ?, chafer_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [numPrice, numChafer, id]
    );

    await logActivity({
      action: 'food_price_updated',
      category: 'menu',
      description: `Adjusted price for "${existing.name}": ₱${Number(existing.price).toLocaleString()} → ₱${numPrice.toLocaleString()}${numChafer ? ` (chafer: ₱${numChafer.toLocaleString()})` : ''}`,
      performed_by: req.user.username || req.user.email,
      details: { id, name: existing.name, oldPrice: existing.price, newPrice: numPrice, oldChafer: existing.chafer_price, newChafer: numChafer },
    });

    res.json({
      success: true,
      message: `Price for "${existing.name}" updated successfully`,
      food: {
        ...existing,
        price: numPrice,
        chafer_price: numChafer,
        is_available: Boolean(existing.is_available),
      },
    });
  } catch (error) {
    console.error('Error updating food price:', error);
    res.status(500).json({ success: false, error: 'Failed to update food price' });
  }
});

// PATCH toggle availability (Admin only)
router.patch('/:id/availability', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    const existing = await queryOne('SELECT * FROM Foods WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Food item not found' });
    }

    const availableVal = is_available ? 1 : 0;
    await execute(
      'UPDATE Foods SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [availableVal, id]
    );

    await logActivity({
      action: 'food_availability_updated',
      category: 'menu',
      description: `Marked "${existing.name}" as ${availableVal ? 'Available' : 'Unavailable / Out of Stock'}`,
      performed_by: req.user.username || req.user.email,
      details: { id, name: existing.name, is_available: Boolean(availableVal) },
    });

    res.json({
      success: true,
      message: `Updated status for "${existing.name}"`,
      is_available: Boolean(availableVal),
    });
  } catch (error) {
    console.error('Error toggling food availability:', error);
    res.status(500).json({ success: false, error: 'Failed to update availability' });
  }
});

// POST batch update prices (e.g. bulk update all mains or all sides) (Admin only)
router.post('/batch-prices', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { category, price, chafer_price, items } = req.body;

    // Batch update by category
    if (category && price !== undefined) {
      const numPrice = Number(price);
      if (!Number.isFinite(numPrice) || numPrice < 0) {
        return res.status(400).json({ success: false, error: 'Valid price is required' });
      }

      const numChafer = chafer_price !== undefined
        ? (chafer_price === null || chafer_price === '' ? null : Number(chafer_price))
        : null;

      if (numChafer !== null) {
        await execute(
          'UPDATE Foods SET price = ?, chafer_price = ?, updated_at = CURRENT_TIMESTAMP WHERE category = ?',
          [numPrice, numChafer, category]
        );
      } else {
        await execute(
          'UPDATE Foods SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE category = ?',
          [numPrice, category]
        );
      }

      await logActivity({
        action: 'food_batch_price_updated',
        category: 'menu',
        description: `Batch updated all ${category} items to ₱${numPrice.toLocaleString()}${numChafer ? ` (chafer: ₱${numChafer.toLocaleString()})` : ''}`,
        performed_by: req.user.username || req.user.email,
        details: { category, price: numPrice, chafer_price: numChafer },
      });

      return res.json({
        success: true,
        message: `Updated all ${category} prices to ₱${numPrice.toLocaleString()}`,
      });
    }

    // Batch update by items list [{ id, price, chafer_price }]
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (!item.id || item.price === undefined) continue;
        const numPrice = Number(item.price);
        const numChafer = item.chafer_price !== undefined ? Number(item.chafer_price) : null;
        await execute(
          'UPDATE Foods SET price = ?, chafer_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [numPrice, numChafer, item.id]
        );
      }

      await logActivity({
        action: 'food_batch_price_updated',
        category: 'menu',
        description: `Batch updated prices for ${items.length} food items`,
        performed_by: req.user.username || req.user.email,
        details: { count: items.length },
      });

      return res.json({
        success: true,
        message: `Updated prices for ${items.length} items`,
      });
    }

    res.status(400).json({ success: false, error: 'Provide either category with price or an array of items' });
  } catch (error) {
    console.error('Error batch updating prices:', error);
    res.status(500).json({ success: false, error: 'Failed to batch update prices' });
  }
});

// DELETE food item (Admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryOne('SELECT * FROM Foods WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Food item not found' });
    }

    await execute('DELETE FROM Foods WHERE id = ?', [id]);

    await logActivity({
      action: 'food_deleted',
      category: 'menu',
      description: `Deleted food item "${existing.name}" from catalog`,
      performed_by: req.user.username || req.user.email,
      details: { id, name: existing.name },
    });

    res.json({ success: true, message: `"${existing.name}" deleted successfully` });
  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({ success: false, error: 'Failed to delete food item' });
  }
});

export default router;
