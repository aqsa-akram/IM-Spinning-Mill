// src/validators/purchase.validators.js
import { body, param } from 'express-validator';

/**
 * Create Purchase Validation
 */
export const createPurchaseValidator = () => {
  return [
    body('purchaseOrderNumber')
      .trim()
      .notEmpty()
      .withMessage('Purchase order number is required')
      .isLength({ min: 3, max: 30 })
      .withMessage('Order number must be between 3 and 30 characters')
      .isUppercase()
      .withMessage('Order number must be uppercase'),

    body('supplier')
      .notEmpty()
      .withMessage('Supplier is required')
      .isMongoId()
      .withMessage('Invalid supplier ID'),

    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),

    body('items.*.material')
      .notEmpty()
      .withMessage('Material is required')
      .isMongoId()
      .withMessage('Invalid material ID'),

    body('items.*.quantity')
      .notEmpty()
      .withMessage('Quantity is required')
      .isFloat({ min: 0.01 })
      .withMessage('Quantity must be greater than 0'),

    body('items.*.unit')
      .notEmpty()
      .withMessage('Unit is required'),

    body('items.*.unitPrice')
      .notEmpty()
      .withMessage('Unit price is required')
      .isFloat({ min: 0 })
      .withMessage('Unit price must be a positive number'),

    body('expectedDeliveryDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid delivery date format'),

    body('taxAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Tax amount must be a positive number'),

    body('shippingCost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Shipping cost must be a positive number'),

    body('discount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount must be a positive number'),
  ];
};

/**
 * Update Purchase Status Validation
 */
export const updatePurchaseStatusValidator = () => {
  return [
    param('id').isMongoId().withMessage('Invalid purchase ID'),

    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['pending', 'confirmed', 'partially-received', 'received', 'cancelled'])
      .withMessage('Invalid status'),

    body('notes')
      .optional()
      .trim(),
  ];
};

/**
 * Receive Purchase Items Validation
 */
export const receivePurchaseValidator = () => {
  return [
    param('id').isMongoId().withMessage('Invalid purchase ID'),

    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),

    body('items.*.itemId')
      .notEmpty()
      .withMessage('Item ID is required'),

    body('items.*.receivedQuantity')
      .notEmpty()
      .withMessage('Received quantity is required')
      .isFloat({ min: 0 })
      .withMessage('Received quantity must be a positive number'),

    body('receivedBy')
      .optional()
      .isMongoId()
      .withMessage('Invalid staff ID'),
  ];
};

/**
 * Record Payment Validation
 */
export const recordPaymentValidator = () => {
  return [
    param('id').isMongoId().withMessage('Invalid purchase ID'),

    body('amount')
      .notEmpty()
      .withMessage('Payment amount is required')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),

    body('paymentMethod')
      .notEmpty()
      .withMessage('Payment method is required')
      .isIn(['cash', 'cheque', 'bank-transfer', 'credit'])
      .withMessage('Invalid payment method'),

    body('paymentDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid payment date format'),

    body('notes')
      .optional()
      .trim(),
  ];
};

/**
 * Purchase ID Validation
 */
export const purchaseIdValidator = () => {
  return [param('id').isMongoId().withMessage('Invalid purchase ID')];
};