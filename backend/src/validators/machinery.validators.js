// src/validators/machinery.validators.js
import { body, param, query } from 'express-validator';

/**
 * Create Machinery Validation
 */
export const createMachineryValidator = () => {
  return [
    body('machineName')
      .trim()
      .notEmpty()
      .withMessage('Machine name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Machine name must be between 3 and 100 characters'),

    body('machineCode')
      .optional()
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('Machine code must be between 2 and 20 characters')
      .isUppercase()
      .withMessage('Machine code must be uppercase'),

    body('model')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Model cannot exceed 50 characters'),

    body('manufacturer')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Manufacturer name cannot exceed 50 characters'),

    body('yearOfManufacture')
      .optional()
      .isInt({ min: 1980, max: new Date().getFullYear() })
      .withMessage(
        `Year must be between 1980 and ${new Date().getFullYear()}`
      ),

    body('department')
      .notEmpty()
      .withMessage('Department is required')
      .isMongoId()
      .withMessage('Invalid department ID'),

    body('quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),

    body('maintenanceStatus')
      .optional()
      .isIn(['operational', 'under-maintenance', 'breakdown', 'idle'])
      .withMessage(
        'Status must be: operational, under-maintenance, breakdown, or idle'
      ),

    body('specifications.capacity')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Capacity must be a positive number'),

    body('specifications.powerConsumption')
      .optional()
      .trim(),

    body('lastMaintenanceDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid maintenance date format'),

    body('maintenanceInterval')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Maintenance interval must be at least 1 day'),

    body('purchaseDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid purchase date format'),

    body('purchaseCost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Purchase cost must be a positive number'),

    body('assignedOperator')
      .optional()
      .isMongoId()
      .withMessage('Invalid operator ID'),
  ];
};

/**
 * Update Machinery Validation
 */
export const updateMachineryValidator = () => {
  return [
    param('id').isMongoId().withMessage('Invalid machinery ID'),

    body('machineName')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Machine name must be between 3 and 100 characters'),

    body('maintenanceStatus')
      .optional()
      .isIn(['operational', 'under-maintenance', 'breakdown', 'idle'])
      .withMessage(
        'Status must be: operational, under-maintenance, breakdown, or idle'
      ),

    body('lastMaintenanceDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid maintenance date format'),

    body('operatingHours')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Operating hours must be a positive number'),

    body('assignedOperator')
      .optional()
      .isMongoId()
      .withMessage('Invalid operator ID'),

    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ];
};

/**
 * Machinery ID Validation
 */
export const machineryIdValidator = () => {
  return [param('id').isMongoId().withMessage('Invalid machinery ID')];
};

/**
 * Log Maintenance Validation
 */
export const logMaintenanceValidator = () => {
  return [
    body('machineId')
      .notEmpty()
      .withMessage('Machine ID is required')
      .isMongoId()
      .withMessage('Invalid machine ID'),

    body('maintenanceType')
      .notEmpty()
      .withMessage('Maintenance type is required')
      .isIn(['routine', 'repair', 'breakdown', 'upgrade'])
      .withMessage('Type must be: routine, repair, breakdown, or upgrade'),

    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters'),

    body('cost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost must be a positive number'),

    body('performedBy')
      .optional()
      .isMongoId()
      .withMessage('Invalid staff ID'),
  ];
};

/**
 * Query Parameter Validation
 */
export const machineryQueryValidator = () => {
  return [
    query('department')
      .optional()
      .isMongoId()
      .withMessage('Invalid department ID'),

    query('maintenanceStatus')
      .optional()
      .isIn(['operational', 'under-maintenance', 'breakdown', 'idle'])
      .withMessage('Invalid maintenance status'),

    query('manufacturer').optional().trim(),

    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be boolean'),
  ];
};