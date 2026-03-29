// src/validators/staff.validators.js
import { body, param } from 'express-validator';
import { 
  AvailableStaffRoles, 
  AvailableCareerLevels, 
  AvailableEmploymentStatus 
} from '../utils/constants.js';

/**
 * Create Staff Validator
 */
export const createStaffValidator = () => {
  return [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Staff name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Name must be between 3 and 100 characters'),
    
    body('employeeId')
      .trim()
      .notEmpty()
      .withMessage('Employee ID is required')
      .isLength({ min: 2, max: 20 })
      .withMessage('Employee ID must be between 2 and 20 characters')
      .isAlphanumeric()
      .withMessage('Employee ID can only contain letters and numbers')
      .toUpperCase(),
    
    body('role')
      .trim()
      .notEmpty()
      .withMessage('Role is required')
      .isIn(AvailableStaffRoles)
      .withMessage(`Role must be one of the predefined roles. Check API documentation for valid roles.`),
    
    body('department')
      .notEmpty()
      .withMessage('Department is required')
      .isMongoId()
      .withMessage('Invalid department ID format'),
    
    body('shift')
      .optional()
      .isMongoId()
      .withMessage('Invalid shift ID format'),
    
    body('careerLevel')
      .optional()
      .isIn(AvailableCareerLevels)
      .withMessage(`Career level must be one of: ${AvailableCareerLevels.join(', ')}`),
    
    body('contactInfo.phone')
      .optional()
      .trim()
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),
    
    body('contactInfo.email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    body('contactInfo.address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address cannot exceed 200 characters'),
    
    body('contactInfo.emergencyContact.name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Emergency contact name must be between 3 and 100 characters'),
    
    body('contactInfo.emergencyContact.phone')
      .optional()
      .trim()
      .isMobilePhone('any')
      .withMessage('Emergency contact phone must be valid'),
    
    body('joiningDate')
      .optional()
      .isISO8601()
      .withMessage('Joining date must be a valid date')
      .toDate(),
    
    body('employmentStatus')
      .optional()
      .isIn(AvailableEmploymentStatus)
      .withMessage(`Employment status must be one of: ${AvailableEmploymentStatus.join(', ')}`),
    
    body('salary')
      .optional()
      .isNumeric()
      .withMessage('Salary must be a number')
      .isFloat({ min: 0 })
      .withMessage('Salary cannot be negative'),
    
    body('skills')
      .optional()
      .isArray()
      .withMessage('Skills must be an array'),
    
    body('skills.*')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Each skill must be between 2 and 50 characters'),
    
    body('performanceRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Performance rating must be between 1 and 5'),
  ];
};

/**
 * Update Staff Validator
 */
export const updateStaffValidator = () => {
  return [
    param('id')
      .isMongoId()
      .withMessage('Invalid staff ID format'),
    
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Name must be between 3 and 100 characters'),
    
    body('role')
      .optional()
      .trim()
      .isIn(AvailableStaffRoles)
      .withMessage(`Role must be one of the predefined roles`),
    
    body('department')
      .optional()
      .isMongoId()
      .withMessage('Invalid department ID format'),
    
    body('shift')
      .optional()
      .isMongoId()
      .withMessage('Invalid shift ID format'),
    
    body('careerLevel')
      .optional()
      .isIn(AvailableCareerLevels)
      .withMessage(`Career level must be one of: ${AvailableCareerLevels.join(', ')}`),
    
    body('contactInfo.phone')
      .optional()
      .trim()
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),
    
    body('contactInfo.email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    body('contactInfo.address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address cannot exceed 200 characters'),
    
    body('employmentStatus')
      .optional()
      .isIn(AvailableEmploymentStatus)
      .withMessage(`Employment status must be one of: ${AvailableEmploymentStatus.join(', ')}`),
    
    body('salary')
      .optional()
      .isNumeric()
      .withMessage('Salary must be a number')
      .isFloat({ min: 0 })
      .withMessage('Salary cannot be negative'),
    
    body('skills')
      .optional()
      .isArray()
      .withMessage('Skills must be an array'),
    
    body('performanceRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Performance rating must be between 1 and 5'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
  ];
};

/**
 * Staff ID Validator
 */
export const staffIdValidator = () => {
  return [
    param('id')
      .isMongoId()
      .withMessage('Invalid staff ID format'),
  ];
};

/**
 * Bulk Import Staff Validator
 */
export const bulkImportStaffValidator = () => {
  return [
    body('staffList')
      .notEmpty()
      .withMessage('Staff list is required')
      .isArray({ min: 1 })
      .withMessage('Staff list must be a non-empty array'),
    
    body('staffList.*.name')
      .trim()
      .notEmpty()
      .withMessage('Each staff member must have a name')
      .isLength({ min: 3, max: 100 })
      .withMessage('Name must be between 3 and 100 characters'),
    
    body('staffList.*.employeeId')
      .trim()
      .notEmpty()
      .withMessage('Each staff member must have an employee ID')
      .isAlphanumeric()
      .withMessage('Employee ID can only contain letters and numbers'),
    
    body('staffList.*.role')
      .trim()
      .notEmpty()
      .withMessage('Each staff member must have a role')
      .isIn(AvailableStaffRoles)
      .withMessage('Invalid role provided'),
    
    body('staffList.*.department')
      .notEmpty()
      .withMessage('Each staff member must have a department')
      .isMongoId()
      .withMessage('Invalid department ID format'),
  ];
};