// src/validators/auth.validators.js
import { body } from 'express-validator';
import { AvailableUserRoles } from '../utils/constants.js';

/**
 * User Registration Validator
 */
export const userRegisterValidator = () => {
  return [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters')
      .isAlphanumeric()
      .withMessage('Username can only contain letters and numbers')
      .toLowerCase(),
    
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('fullName')
      .trim()
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ min: 3 })
      .withMessage('Full name must be at least 3 characters'),
    
    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    
    body('role')
      .optional()
      .isIn(AvailableUserRoles)
      .withMessage(`Role must be one of: ${AvailableUserRoles.join(', ')}`),
    
    body('department')
      .optional()
      .isMongoId()
      .withMessage('Invalid department ID'),
    
    body('phoneNumber')
      .optional()
      .trim()
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),
  ];
};

/**
 * User Login Validator
 */
export const userLoginValidator = () => {
  return [
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('username')
      .optional()
      .trim()
      .toLowerCase(),
    
    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required'),
    
    // Custom validation: at least email or username must be provided
    body()
      .custom((value, { req }) => {
        if (!req.body.email && !req.body.username) {
          throw new Error('Either email or username is required');
        }
        return true;
      }),
  ];
};

/**
 * Change Password Validator
 */
export const changePasswordValidator = () => {
  return [
    body('oldPassword')
      .trim()
      .notEmpty()
      .withMessage('Old password is required'),
    
    body('newPassword')
      .trim()
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
      .custom((value, { req }) => {
        if (value === req.body.oldPassword) {
          throw new Error('New password must be different from old password');
        }
        return true;
      }),
  ];
};

/**
 * Update Profile Validator
 */
export const updateProfileValidator = () => {
  return [
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Full name must be at least 3 characters'),
    
    body('phoneNumber')
      .optional()
      .trim()
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),
    
    // Ensure at least one field is provided
    body()
      .custom((value, { req }) => {
        if (!req.body.fullName && !req.body.phoneNumber) {
          throw new Error('At least one field (fullName or phoneNumber) is required');
        }
        return true;
      }),
  ];
};