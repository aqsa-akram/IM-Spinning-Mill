import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Verify JWT Token Middleware
 * Extracts token from cookies or Authorization header
 * Verifies token and attaches user to request object
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Extract token from cookies or header
    const token =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Unauthorized request - No token provided');
    }

    // Verify token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find user (exclude sensitive fields)
    const user = await User.findById(decodedToken._id).select(
      '-password -refreshToken'
    );

    if (!user) {
      throw new ApiError(401, 'Invalid access token');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(
        403,
        'Your account has been deactivated. Contact administrator.'
      );
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid access token');
  }
});

/**
 * Authorization Middleware
 * Checks if user has required role(s)
 * Usage: authorize('admin', 'manager')
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - User not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Access denied. Required role: ${allowedRoles.join(' or ')}`
      );
    }

    next();
  };
};

/**
 * Optional Authentication Middleware
 * Doesn't throw error if no token, just doesn't attach user
 * Useful for routes that work with or without authentication
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decodedToken._id).select(
        '-password -refreshToken'
      );

      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail - optional auth
  }

  next();
});