import express from 'express';
import { PACKAGES, SERVICES, TESTIMONIALS } from '../data/catalog.js';

const router = express.Router();

// Active packages for the landing page (public)
router.get('/packages', (_req, res) => {
  res.json({ success: true, packages: PACKAGES });
});

// Active services for the landing page (public)
router.get('/services', (_req, res) => {
  res.json({ success: true, services: SERVICES });
});

// Testimonials for the landing page (public)
router.get('/testimonials', (_req, res) => {
  res.json({ success: true, testimonials: TESTIMONIALS });
});

export default router;