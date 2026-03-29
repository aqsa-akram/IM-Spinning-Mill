// src/utils/validateEnv.js (NEW FILE)
/**
 * Environment Variables Validator
 * Validates that all required environment variables are present
 * before the application starts
 */

export const validateEnv = () => {
    const requiredEnvVars = [
      'MONGODB_URI',
      'PORT',
      'ACCESS_TOKEN_SECRET',
      'REFRESH_TOKEN_SECRET',
      'ACCESS_TOKEN_EXPIRY',
      'REFRESH_TOKEN_EXPIRY',
      'CORS_ORIGIN',
      'NODE_ENV',
    ];
  
    const missingVars = [];
    const warnings = [];
  
    // Check for missing required variables
    requiredEnvVars.forEach((varName) => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    });
  
    // Check for empty values
    requiredEnvVars.forEach((varName) => {
      if (process.env[varName] === '') {
        warnings.push(`${varName} is defined but empty`);
      }
    });
  
    // Validate MONGODB_URI format
    if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb')) {
      warnings.push('MONGODB_URI should start with "mongodb://" or "mongodb+srv://"');
    }
  
    // Validate PORT is a number
    if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
      warnings.push('PORT should be a valid number');
    }
  
    // Validate NODE_ENV
    if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
      warnings.push('NODE_ENV should be one of: development, production, test');
    }
  
    // Display results
    console.log('\nðŸ” Environment Variables Validation');
    console.log('=====================================');
  
    if (missingVars.length > 0) {
      console.error('\nâŒ CRITICAL: Missing required environment variables:');
      missingVars.forEach((varName) => {
        console.error(`   - ${varName}`);
      });
      console.error('\nðŸ’¡ Please create a .env file with all required variables.');
      console.error('   Check .env.example for reference.\n');
      process.exit(1);
    }
  
    if (warnings.length > 0) {
      console.warn('\nâš ï¸  Environment warnings:');
      warnings.forEach((warning) => {
        console.warn(`   - ${warning}`);
      });
    }
  
    console.log('\nâœ… All required environment variables are present');
    
    // Display configuration (masked sensitive values)
    console.log('\nðŸ“‹ Current Configuration:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   PORT: ${process.env.PORT}`);
    console.log(`   CORS_ORIGIN: ${process.env.CORS_ORIGIN}`);
    console.log(`   MONGODB_URI: ${maskMongoUri(process.env.MONGODB_URI)}`);
    console.log(`   ACCESS_TOKEN_EXPIRY: ${process.env.ACCESS_TOKEN_EXPIRY}`);
    console.log(`   REFRESH_TOKEN_EXPIRY: ${process.env.REFRESH_TOKEN_EXPIRY}`);
    console.log('=====================================\n');
  
    return true;
  };
  
  /**
   * Mask MongoDB URI to hide credentials
   */
  const maskMongoUri = (uri) => {
    if (!uri) return 'Not set';
    
    try {
      // Replace password with asterisks
      const masked = uri.replace(/:([^@:]+)@/, ':****@');
      return masked;
    } catch (error) {
      return 'Invalid URI format';
    }
  };
  
  /**
   * Check if running in production
   */
  export const isProduction = () => {
    return process.env.NODE_ENV === 'production';
  };
  
  /**
   * Check if running in development
   */
  export const isDevelopment = () => {
    return process.env.NODE_ENV === 'development';
  };