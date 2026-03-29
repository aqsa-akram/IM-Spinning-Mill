
/**
 * Standardized API Response Class
 * Provides consistent response structure across all endpoints
 */
class ApiResponse {
    constructor(statusCode, data, message = 'Success') {
      this.statusCode = statusCode;
      this.data = data;
      this.message = message;
      this.success = statusCode < 400; // Success if status code is less than 400
    }
  }
  
  export { ApiResponse };