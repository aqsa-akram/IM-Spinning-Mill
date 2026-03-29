// src/models/leave.model.js
import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Staff reference is required'],
    },
    leaveType: {
      type: String,
      enum: [
        'annual',
        'sick',
        'casual',
        'maternity',
        'paternity',
        'unpaid',
        'compensatory',
        'emergency',
      ],
      required: [true, 'Leave type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function(value) {
          return value >= this.startDate;
        },
        message: 'End date must be after start date'
      }
    },
    numberOfDays: {
      type: Number,
      min: 0.5,
      default: 1,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    // ✅ Required for Payroll Integration
    isUnpaid: {
      type: Boolean,
      default: false,
      required: true,
    },
    appliedDate: {
      type: Date,
      default: Date.now,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedDate: Date,
    rejectionReason: String,
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        filename: String,
        path: String,
        uploadDate: { type: Date, default: Date.now },
      },
    ],
    remarks: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
leaveSchema.index({ staff: 1, startDate: -1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ leaveType: 1 });

// ✅ FIXED: Auto-calculate numberOfDays and set isUnpaid
leaveSchema.pre('save', function() {
  // Calculate number of days
  if (this.startDate && this.endDate) {
    if (this.isHalfDay) {
      this.numberOfDays = 0.5;
    } else {
      const diff = this.endDate - this.startDate;
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
      this.numberOfDays = Math.max(days, 1);
    }
  }

  // Automatically mark 'unpaid' leave type as unpaid
  if (this.isNew || this.isModified('leaveType')) {
    if (this.leaveType === 'unpaid') {
      this.isUnpaid = true;
    } else {
      this.isUnpaid = false;
    }
  }
});

// Static method to calculate days (for external use)
leaveSchema.statics.calculateDays = function(startDate, endDate, isHalfDay) {
  if (!startDate || !endDate) return 1;
  
  if (isHalfDay) return 0.5;
  
  const diff = endDate - startDate;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(days, 1);
};

export const Leave = mongoose.model('Leave', leaveSchema);