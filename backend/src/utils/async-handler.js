
/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass to Express error middleware
 * Eliminates need for try-catch blocks in every controller
 */
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
      Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error));
    };
  };
  
  export { asyncHandler };