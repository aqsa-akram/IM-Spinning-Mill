// src/validators/rawMaterial.validators.js
import { body, param } from 'express-validator';

/**
 * Create Raw Material Validation
 */
export const createRawMaterialValidator = () => {
  return [
    body('materialName')
      .trim()
      .notEmpty()
      .withMessage('Material name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Material name must be between 3 and 100 characters'),

    body('materialCode')
      .optional()
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('Material code must be between 2 and 20 characters')
      .isUppercase()
      .withMessage('Material code must be uppercase'),

    body('materialType')
      .notEmpty()
      .withMessage('Material type is required')
      .isIn([
        'Cotton Fiber',
        'Polyester Fiber',
        'Recycled Material',
        'Cotton PC2',
        'Blended Fiber',
        'Chemical',
        'Dye',
        'Other',
      ])
      .withMessage('Invalid material type'),

    body('unit')
      .notEmpty()
      .withMessage('Unit is required')
      .isIn(['kg', 'ton', 'litre', 'meter', 'piece', 'bale'])
      .withMessage('Invalid unit'),

    body('stockQuantity')
      .notEmpty()
      .withMessage('Stock quantity is required')
      .isFloat({ min: 0 })
      .withMessage('Stock quantity must be a positive number'),

    body('reorderLevel')
      .notEmpty()
      .withMessage('Reorder level is required')
      .isFloat({ min: 0 })
      .withMessage('Reorder level must be a positive number'),

    body('maxStockLevel')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Max stock level must be a positive number'),

    body('unitPrice')
      .notEmpty()
      .withMessage('Unit price is required')
      .isFloat({ min: 0 })
      .withMessage('Unit price must be a positive number'),

    body('supplier')
      .optional()
      .isMongoId()
      .withMessage('Invalid supplier ID'),
  ];
};

/**
 * Update Raw Material Validation
 */
export const updateRawMaterialValidator = () => {
  return [
    param('id').isMongoId().withMessage('Invalid material ID'),

    body('materialName')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Material name must be between 3 and 100 characters'),

    body('stockQuantity')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Stock quantity must be a positive number'),

    body('unitPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Unit price must be a positive number'),

    body('reorderLevel')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Reorder level must be a positive number'),
  ];
};

/**
 * Update Stock Validation
 */
export const updateStockValidator = () => {
  return [
    param('id').isMongoId().withMessage('Invalid material ID'),

    body('quantity')
      .notEmpty()
      .withMessage('Quantity is required')
      .isFloat()
      .withMessage('Quantity must be a number'),

    body('type')
      .notEmpty()
      .withMessage('Transaction type is required')
      .isIn(['add', 'remove', 'set'])
      .withMessage('Type must be: add, remove, or set'),

    body('reason')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Reason must be at least 3 characters'),
  ];
};

/**
 * Material ID Validation
 */
export const materialIdValidator = () => {
  return [param('id').isMongoId().withMessage('Invalid material ID')];
};