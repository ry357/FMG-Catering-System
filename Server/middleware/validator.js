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
  // Canonical list matches the frontend EVENT_TYPES. Lowercase legacy variants
  // are still accepted for backward compatibility and normalized in the service.
  body('event_type')
    .trim()
    .notEmpty().withMessage('Event type is required')
    .isIn(['Wedding', 'Birthday', 'Corporate', 'Anniversary', 'Gala', 'Other', 'wedding', 'birthday', 'corporate', 'anniversary', 'gala', 'other']).withMessage('Invalid event type'),
  body('event_date')
    .notEmpty().withMessage('Event date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('number_of_guests')
    .custom((value, { req }) => {
      if (req.body.booking_category === 'drop-off') return true;
      if (!value) throw new Error('Number of guests is required');
      const guests = Number(value);
      if (!Number.isInteger(guests) || guests < 1 || guests > 10000) {
        throw new Error('Guests must be between 1 and 10000');
      }
      return true;
    }),
  body('budget')
    .custom((value, { req }) => {
      if (req.body.booking_category === 'drop-off') return true;
      if (!value) throw new Error('Budget is required');
      const budget = Number(value);
      if (!Number.isFinite(budget) || budget < 0) {
        throw new Error('Budget must be a positive number');
      }
      return true;
    }),
  body('additional_requests')
    .optional()
    .isLength({ max: 1000 }).withMessage('Additional requests must be under 1000 characters'),
  body('selected_menu_items')
    .optional()
    .isArray().withMessage('Menu items must be an array')
    .custom((items) => {
      if (!items.every((item) => item && typeof item === 'object' && typeof item.name === 'string')) {
        throw new Error('Each menu item must have a name');
      }
      return true;
    }),
  body('menu_preference')
    .optional()
    .isObject().withMessage('Menu preference must be an object'),
  body('booking_category')
    .optional()
    .trim()
    .isIn(['natural', 'drop-off']).withMessage('Invalid booking category'),
  body('tier')
    .optional()
    .trim()
    .isIn(['buffet', 'plated', 'drop-off']).withMessage('Invalid tier'),
  body('dietary_preferences')
    .optional()
    .isArray().withMessage('Dietary preferences must be an array'),
  body('total_amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
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
  body('bookingData')
    .optional()
    .isObject().withMessage('Booking data must be an object'),
  body('bookingData.totalAmount')
    .optional()
    .toFloat()
    .isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  body('bookingData.numberOfGuests')
    .custom((value, { req }) => {
      if (req.body.bookingData?.bookingCategory === 'drop-off') return true;
      if (!value) throw new Error('Number of guests is required');
      const guests = Number(value);
      if (!Number.isInteger(guests) || guests < 1 || guests > 10000) {
        throw new Error('Guests must be between 1 and 10000');
      }
      return true;
    }),
  body('bookingData.selectedMenuItems')
    .optional()
    .isArray().withMessage('Menu items must be an array'),
  body('bookingData.menuPreference')
    .optional()
    .isObject().withMessage('Menu preference must be an object'),
  body('bookingData.bookingCategory')
    .optional()
    .trim()
    .isIn(['natural', 'drop-off']).withMessage('Invalid booking category'),
  validate
];