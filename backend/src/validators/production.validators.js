// src/validators/production.validators.js
import { body, param, query } from 'express-validator';

/**
 * Create Production Record Validation
 */
export const createProductionValidator = () => {
  return [
    body('productionDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid production date format'),

    body('department')
      .notEmpty()
      .withMessage('Department is required')
      .isMongoId()
      .withMessage('Invalid department ID'),

    body('product')
      .notEmpty()
      .withMessage('Product is required')
      .isMongoId()
      .withMessage('Invalid product ID'),

    body('shift')
      .notEmpty()
      .withMessage('Shift is required')
      .isMongoId()
      .withMessage('Invalid shift ID'),

    body('machine')
      .optional()
      .isMongoId()
      .withMessage('Invalid machine ID'),

    body('operator')
      .notEmpty()
      .withMessage('Operator is required')
      .isMongoId()
      .withMessage('Invalid operator ID'),

    body('quantityProduced')
      .notEmpty()
      .withMessage('Quantity produced is required')
      .isFloat({ min: 0 })
      .withMessage('Quantity must be a positive number'),

    body('unit')
      .notEmpty()
      .withMessage('Unit is required')
      .isIn(['kg', 'cone', 'bale', 'meter', 'piece'])
      .withMessage('Invalid unit'),

    body('targetQuantity')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Target quantity must be a positive number'),

    body('qualityGrade')
      .optional()
      .isIn(['A', 'B', 'C', 'rejected'])
      .withMessage('Invalid quality grade'),

    body('defectQuantity')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Defect quantity must be a positive number'),

    body('startTime')
      .optional()
      .isISO8601()
      .withMessage('Invalid start time format'),

    body('endTime')
      .optional()
      .isISO8601()
      .withMessage('Invalid end time format'),
  ];
};

/**
 * Update Production Validation
 */
export const updateProductionValidator = () => {
  return [
    param('id').isMongoId().withMessage('Invalid production ID'),

    body('quantityProduced')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Quantity must be a positive number'),

    body('status')
      .optional()
      .isIn(['in-progress', 'completed', 'paused', 'cancelled'])
      .withMessage('Invalid status'),

    body('qualityGrade')
      .optional()
      .isIn(['A', 'B', 'C', 'rejected'])
      .withMessage('Invalid quality grade'),
  ];
};

/**
 * Production ID Validation
 */
export const productionIdValidator = () => {
  return [param('id').isMongoId().withMessage('Invalid production ID')];
};

/**
 * Date Range Validation
 */
export const dateRangeValidator = () => {
  return [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),

    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
  ];
};