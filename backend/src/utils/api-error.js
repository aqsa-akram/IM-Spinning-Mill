
/**
 * Custom API Error Class
 * Extends Node.js built-in Error class
 * Used for consistent error handling across the application
 */
class ApiError extends Error {
    constructor(
      statusCode,
      message = 'Something went wrong',
      errors = [],
      stack = ''
    ) {
      super(message); // Call parent Error constructor
      
      this.statusCode = statusCode;
      this.data = null;
      this.message = message;
      this.success = false;
      this.errors = errors;
  
      // Capture stack trace for debugging
      if (stack) {
        this.stack = stack;
      } else {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
  
  export { ApiError };