import express from 'express';
import { query, execute, executeWithId } from '../config/dbHelper.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET all packages
router.get('/', async (req, res) => {
  try {
    const packages = await query('SELECT * FROM Packages');
    // Parse JSON fields
    const parsedPackages = packages.map(pkg => ({
      ...pkg,
      event_types: pkg.event_types ? JSON.parse(pkg.event_types) : [],
      features: pkg.features ? JSON.parse(pkg.features) : [],
      featured: Boolean(pkg.featured)
    }));
    res.json(parsedPackages);
  } catch (err) {
    console.error('Error fetching packages:', err);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// POST a new package (Admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { name, description, price_per_guest, min_guests, max_guests, event_types, features, featured } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const id = await executeWithId(
      `INSERT INTO Packages (name, description, price_per_guest, min_guests, max_guests, event_types, features, featured) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        price_per_guest,
        min_guests,
        max_guests,
        JSON.stringify(event_types || []),
        JSON.stringify(features || []),
        featured ? 1 : 0
      ]
    );
    res.status(201).json({ id, message: 'Package created successfully' });
  } catch (err) {
    console.error('Error creating package:', err);
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// PUT (update) an existing package (Admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { name, description, price_per_guest, min_guests, max_guests, event_types, features, featured } = req.body;

  try {
    const changes = await execute(
      `UPDATE Packages 
       SET name = ?, description = ?, price_per_guest = ?, min_guests = ?, max_guests = ?, event_types = ?, features = ?, featured = ?
       WHERE id = ?`,
      [
        name,
        description,
        price_per_guest,
        min_guests,
        max_guests,
        JSON.stringify(event_types || []),
        JSON.stringify(features || []),
        featured ? 1 : 0,
        id
      ]
    );
    
    if (changes === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.json({ message: 'Package updated successfully' });
  } catch (err) {
    console.error('Error updating package:', err);
    res.status(500).json({ error: 'Failed to update package' });
  }
});

// DELETE a package (Admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const changes = await execute('DELETE FROM Packages WHERE id = ?', [id]);
    if (changes === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.json({ message: 'Package deleted successfully' });
  } catch (err) {
    console.error('Error deleting package:', err);
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

export default router;
