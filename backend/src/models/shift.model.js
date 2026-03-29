// src/models/shift.model.js (FIXED)
import mongoose from 'mongoose';
import { AvailableShiftNames } from '../utils/constants.js';

const shiftSchema = new mongoose.Schema(
  {
    shiftName: {
      type: String,
      required: [true, 'Shift name is required'],
      trim: true,
      // Removed enum - validation is now in validator file
      validate: {
        validator: function(value) {
          return AvailableShiftNames.includes(value);
        },
        message: props => `${props.value} is not a valid shift name. Must be one of: ${AvailableShiftNames.join(', ')}`
      }
    },
    shiftCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      validate: {
        validator: function(value) {
          // Validate HH:MM format (24-hour)
          const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
          return timeRegex.test(value);
        },
        message: 'Start time must be in HH:MM format (24-hour), e.g., 08:00 or 14:30'
      }
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      validate: {
        validator: function(value) {
          // Validate HH:MM format (24-hour)
          const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
          return timeRegex.test(value);
        },
        message: 'End time must be in HH:MM format (24-hour), e.g., 17:00 or 22:30'
      }
    },
    duration: {
      type: Number,
      // NOT required - will be calculated
      min: [1, 'Duration must be at least 1 hour'],
      max: [24, 'Duration cannot exceed 24 hours']
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    breakTime: {
      duration: {
        type: Number,
        default: 60,
        min: [0, 'Break duration cannot be negative'],
        max: [180, 'Break duration cannot exceed 180 minutes']
      },
      startTime: {
        type: String,
        validate: {
          validator: function(value) {
            if (!value) return true; // Optional field
            const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
            return timeRegex.test(value);
          },
          message: 'Break start time must be in HH:MM format (24-hour)'
        }
      }
    },
  },
  {
    timestamps: true,
  }
);

// âœ… FIXED: Improved duration calculation with proper error handling
shiftSchema.pre('validate', function() {
  // Only calculate if times are present and duration not manually set
  if (this.startTime && this.endTime && !this.duration) {
    try {
      // Validate time format before processing
      const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
      
      if (!timeRegex.test(this.startTime)) {
        throw new Error(`Invalid start time format: ${this.startTime}. Expected HH:MM (24-hour)`);
      }
      
      if (!timeRegex.test(this.endTime)) {
        throw new Error(`Invalid end time format: ${this.endTime}. Expected HH:MM (24-hour)`);
      }
      
      // Parse hours and minutes
      const [startHour, startMin] = this.startTime.split(':').map(Number);
      const [endHour, endMin] = this.endTime.split(':').map(Number);
      
      // Convert to total minutes since midnight
      const startTotalMinutes = startHour * 60 + startMin;
      const endTotalMinutes = endHour * 60 + endMin;
      
      // Calculate duration in hours
      let durationInMinutes;
      if (endTotalMinutes >= startTotalMinutes) {
        // Same day shift
        durationInMinutes = endTotalMinutes - startTotalMinutes;
      } else {
        // Overnight shift (crosses midnight)
        durationInMinutes = (24 * 60 - startTotalMinutes) + endTotalMinutes;
      }
      
      // Convert to hours (rounded to 1 decimal place)
      this.duration = Math.round((durationInMinutes / 60) * 10) / 10;
      
      // Validate calculated duration
      if (this.duration < 1 || this.duration > 24) {
        throw new Error(`Calculated duration (${this.duration}h) is invalid. Must be between 1 and 24 hours.`);
      }
      
    } catch (error) {
      // Log error for debugging
      console.error('âŒ Shift duration calculation error:', error.message);
      
      // Set a reasonable default based on shift type
      if (this.shiftName === 'Night' || this.shiftName === 'Morning' || this.shiftName === 'Evening') {
        this.duration = 8; // Standard 8-hour shift
      } else {
        this.duration = 9; // Day/General shift (typically 9 hours with break)
      }
      
      console.warn(`âš ï¸  Using default duration: ${this.duration} hours for ${this.shiftName} shift`);
    }
  }
});

// Index for faster queries
// shiftSchema.index({ shiftCode: 1 });
shiftSchema.index({ isActive: 1 });
shiftSchema.index({ shiftName: 1 });

// Virtual for formatted shift info
shiftSchema.virtual('shiftInfo').get(function() {
  return `${this.shiftName} (${this.startTime} - ${this.endTime})`;
});

export const Shift = mongoose.model('Shift', shiftSchema);