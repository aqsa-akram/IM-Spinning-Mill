// src/validators/shift.validators.js
import { body, param } from 'express-validator';
import { AvailableShiftNames } from '../utils/constants.js';

/**
 * Time Format Validator Helper
 * Validates HH:MM format (24-hour)
 */
const isValidTimeFormat = (value) => {
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(value);
};

/**
 * Create Shift Validator
 */
export const createShiftValidator = () => {
  return [
    body('shiftName')
      .trim()
      .notEmpty()
      .withMessage('Shift name is required')
      .isIn(AvailableShiftNames)
      .withMessage(`Shift name must be one of: ${AvailableShiftNames.join(', ')}`),
    
    body('shiftCode')
      .trim()
      .notEmpty()
      .withMessage('Shift code is required')
      .isLength({ min: 2, max: 20 })
      .withMessage('Shift code must be between 2 and 20 characters')
      .isAlphanumeric()
      .withMessage('Shift code can only contain letters and numbers')
      .toUpperCase(),
    
    body('startTime')
      .trim()
      .notEmpty()
      .withMessage('Start time is required')
      .custom((value) => {
        if (!isValidTimeFormat(value)) {
          throw new Error('Start time must be in HH:MM format (24-hour), e.g., 08:00 or 14:30');
        }
        return true;
      }),
    
    body('endTime')
      .trim()
      .notEmpty()
      .withMessage('End time is required')
      .custom((value) => {
        if (!isValidTimeFormat(value)) {
          throw new Error('End time must be in HH:MM format (24-hour), e.g., 17:00 or 22:30');
        }
        return true;
      }),
    
    body('duration')
      .optional()
      .isInt({ min: 1, max: 24 })
      .withMessage('Duration must be between 1 and 24 hours'),
    
    body('breakTime.duration')
      .optional()
      .isInt({ min: 0, max: 180 })
      .withMessage('Break duration must be between 0 and 180 minutes'),
    
    body('breakTime.startTime')
      .optional()
      .custom((value) => {
        if (value && !isValidTimeFormat(value)) {
          throw new Error('Break start time must be in HH:MM format (24-hour)');
        }
        return true;
      }),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean value'),
  ];
};

/**
 * Update Shift Validator
 */
export const updateShiftValidator = () => {
  return [
    param('id')
      .isMongoId()
      .withMessage('Invalid shift ID format'),
    
    body('shiftName')
      .optional()
      .trim()
      .isIn(AvailableShiftNames)
      .withMessage(`Shift name must be one of: ${AvailableShiftNames.join(', ')}`),
    
    body('shiftCode')
      .optional()
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('Shift code must be between 2 and 20 characters')
      .isAlphanumeric()
      .withMessage('Shift code can only contain letters and numbers')
      .toUpperCase(),
    
    body('startTime')
      .optional()
      .trim()
      .custom((value) => {
        if (!isValidTimeFormat(value)) {
          throw new Error('Start time must be in HH:MM format (24-hour)');
        }
        return true;
      }),
    
    body('endTime')
      .optional()
      .trim()
      .custom((value) => {
        if (!isValidTimeFormat(value)) {
          throw new Error('End time must be in HH:MM format (24-hour)');
        }
        return true;
      }),
    
    body('duration')
      .optional()
      .isInt({ min: 1, max: 24 })
      .withMessage('Duration must be between 1 and 24 hours'),
    
    body('breakTime.duration')
      .optional()
      .isInt({ min: 0, max: 180 })
      .withMessage('Break duration must be between 0 and 180 minutes'),
    
    body('breakTime.startTime')
      .optional()
      .custom((value) => {
        if (value && !isValidTimeFormat(value)) {
          throw new Error('Break start time must be in HH:MM format (24-hour)');
        }
        return true;
      }),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean value'),
  ];
};

/**
 * Shift ID Validator
 */
export const shiftIdValidator = () => {
  return [
    param('id')
      .isMongoId()
      .withMessage('Invalid shift ID format'),
  ];
};

/**
 * Assign Staff to Shift Validator
 */
export const assignStaffValidator = () => {
  return [
    body('staffId')
      .notEmpty()
      .withMessage('Staff ID is required')
      .isMongoId()
      .withMessage('Invalid staff ID format'),
    
    body('shiftId')
      .notEmpty()
      .withMessage('Shift ID is required')
      .isMongoId()
      .withMessage('Invalid shift ID format'),
  ];
};

/**
 * Bulk Assign Staff to Shift Validator
 */
export const bulkAssignValidator = () => {
  return [
    body('staffIds')
      .notEmpty()
      .withMessage('Staff IDs array is required')
      .isArray({ min: 1 })
      .withMessage('Staff IDs must be a non-empty array'),
    
    body('staffIds.*')
      .isMongoId()
      .withMessage('Each staff ID must be a valid MongoDB ID'),
    
    body('shiftId')
      .notEmpty()
      .withMessage('Shift ID is required')
      .isMongoId()
      .withMessage('Invalid shift ID format'),
  ];
};