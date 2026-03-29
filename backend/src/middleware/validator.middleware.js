
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/api-error.js';

/**
 * Validation Middleware
 * Checks for validation errors from express-validator
 * If errors exist, throws ApiError with formatted error messages
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  // If no errors, proceed to next middleware
  if (errors.isEmpty()) {
    return next();
  }

  // Extract and format errors
  const extractedErrors = [];
  errors.array().map((err) =>
    extractedErrors.push({
      [err.path]: err.msg,
    })
  );

  // Throw formatted error
  throw new ApiError(422, 'Validation failed', extractedErrors);
};