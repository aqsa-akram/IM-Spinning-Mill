// src/validators/supplier.validators.js
import { body, param } from 'express-validator';

/**
 * Create Supplier Validation
 */
export const createSupplierValidator = () => {
  return [
    body('supplierName')
      .trim()
      .notEmpty()
      .withMessage('Supplier name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Supplier name must be between 3 and 100 characters'),

    body('supplierCode')
      .optional()
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('Supplier code must be between 2 and 20 characters')
      .isUppercase()
      .withMessage('Supplier code must be uppercase'),

    body('contactPerson.name')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Contact person name must be at least 3 characters'),

    body('contactPerson.phone')
      .optional()
      .trim()
      .matches(/^[0-9+\-\s()]+$/)
      .withMessage('Invalid phone number format'),

    body('contactPerson.email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Invalid email format'),

    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Invalid email format'),

    body('phone')
      .optional()
      .isArray()
      .withMessage('Phone must be an array'),

    body('address.city')
      .optional()
      .trim(),

    body('address.country')
      .optional()
      .trim(),

    body('paymentTerms')
      .optional()
      .isIn(['cash', 'credit-15', 'credit-30', 'credit-45', 'credit-60', 'advance'])
      .withMessage('Invalid payment terms'),

    body('creditLimit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Credit limit must be a positive number'),

    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
  ];
};

/**
 * Update Supplier Validation
 */
export const updateSupplierValidator = () => {
  return [
    param('id').isMongoId().withMessage('Invalid supplier ID'),

    body('supplierName')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Supplier name must be between 3 and 100 characters'),

    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Invalid email format'),

    body('creditLimit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Credit limit must be a positive number'),

    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),

    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ];
};

/**
 * Supplier ID Validation
 */
export const supplierIdValidator = () => {
  return [param('id').isMongoId().withMessage('Invalid supplier ID')];
};