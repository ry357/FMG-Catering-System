import { body, validationResult, param } from 'express-validator';

// Validation middleware handler
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Login validation
export const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
];

// Booking validation
export const validateBooking = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[\d\s+\-()]{7,20}$/).withMessage('Invalid phone number'),
  body('event_type')
    .trim()
    .notEmpty().withMessage('Event type is required')
    .isIn(['birthday', 'wedding', 'corporate', 'debut', 'christening', 'other']).withMessage('Invalid event type'),
  body('event_date')
    .notEmpty().withMessage('Event date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('number_of_guests')
    .notEmpty().withMessage('Number of guests is required')
    .isInt({ min: 1, max: 10000 }).withMessage('Guests must be between 1 and 10000'),
  body('budget')
    .notEmpty().withMessage('Budget is required')
    .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  body('additional_requests')
    .optional()
    .isLength({ max: 1000 }).withMessage('Additional requests must be under 1000 characters'),
  body('selected_menu_items')
    .optional()
    .isArray().withMessage('Menu items must be an array'),
  validate
];

// User creation validation
export const validateUserCreation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['staff', 'admin']).withMessage('Invalid role'),
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  validate
];

// Booking status update validation
export const validateBookingStatus = [
  param('id')
    .trim()
    .notEmpty().withMessage('Booking ID is required')
    .matches(/^\d+$/).withMessage('Invalid booking ID'),
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'approved', 'rejected', 'completed']).withMessage('Invalid status'),
  validate
];

// Payment validation
export const validatePayment = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('customerName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Customer name must be 2-100 characters'),
  body('customerEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('paymentType')
    .optional()
    .trim()
    .isIn(['full', 'down_payment']).withMessage('Invalid payment type'),
  validate
];