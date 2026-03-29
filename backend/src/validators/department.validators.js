// src/validators/department.validators.js
import { body, param } from 'express-validator';
import { AvailableDepartmentTypes } from '../utils/constants.js';

/**
 * Create Department Validator
 */
export const createDepartmentValidator = () => {
  return [
    body('departmentName')
      .trim()
      .notEmpty()
      .withMessage('Department name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Department name must be between 3 and 100 characters'),
    
    body('departmentCode')
      .trim()
      .notEmpty()
      .withMessage('Department code is required')
      .isLength({ min: 2, max: 10 })
      .withMessage('Department code must be between 2 and 10 characters')
      .isAlphanumeric()
      .withMessage('Department code can only contain letters and numbers')
      .toUpperCase(),
    
    body('departmentType')
      .trim()
      .notEmpty()
      .withMessage('Department type is required')
      .isIn(AvailableDepartmentTypes)
      .withMessage(`Department type must be one of: ${AvailableDepartmentTypes.join(', ')}`),
    
    body('sequenceOrder')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Sequence order must be between 1 and 20'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    
    body('responsibilities')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Responsibilities cannot exceed 500 characters'),
    
    body('shiftHours')
      .optional()
      .isInt({ min: 0, max: 24 })
      .withMessage('Shift hours must be between 0 and 24'),
    
    body('dailyCapacity')
      .optional()
      .isNumeric()
      .withMessage('Daily capacity must be a number'),
    
    body('departmentHead')
      .optional()
      .isMongoId()
      .withMessage('Invalid department head ID'),
  ];
};

/**
 * Update Department Validator
 */
export const updateDepartmentValidator = () => {
  return [
    param('id')
      .isMongoId()
      .withMessage('Invalid department ID'),
    
    body('departmentName')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Department name must be between 3 and 100 characters'),
    
    body('departmentCode')
      .optional()
      .trim()
      .isLength({ min: 2, max: 10 })
      .withMessage('Department code must be between 2 and 10 characters')
      .isAlphanumeric()
      .withMessage('Department code can only contain letters and numbers')
      .toUpperCase(),
    
    body('departmentType')
      .optional()
      .isIn(AvailableDepartmentTypes)
      .withMessage(`Department type must be one of: ${AvailableDepartmentTypes.join(', ')}`),
    
    body('sequenceOrder')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Sequence order must be between 1 and 20'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    
    body('responsibilities')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Responsibilities cannot exceed 500 characters'),
    
    body('shiftHours')
      .optional()
      .isInt({ min: 0, max: 24 })
      .withMessage('Shift hours must be between 0 and 24'),
    
    body('dailyCapacity')
      .optional()
      .isNumeric()
      .withMessage('Daily capacity must be a number'),
    
    body('departmentHead')
      .optional()
      .isMongoId()
      .withMessage('Invalid department head ID'),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ];
};

/**
 * Department ID Validator
 */
export const departmentIdValidator = () => {
  return [
    param('id')
      .isMongoId()
      .withMessage('Invalid department ID format'),
  ];
};

/**
 * Department Type Validator
 */
export const departmentTypeValidator = () => {
  return [
    param('type')
      .isIn(AvailableDepartmentTypes)
      .withMessage(`Department type must be one of: ${AvailableDepartmentTypes.join(', ')}`),
  ];
};