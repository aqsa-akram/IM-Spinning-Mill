// src/models/department.models.js
import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    departmentName: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    departmentCode: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [10, 'Code cannot exceed 10 characters'],
    },
    departmentType: {
      type: String,
      enum: ['production', 'support', 'executive', 'administrative'],
      required: true,
    },
    sequenceOrder: {
      type: Number,
      min: 1,
      max: 20,
    },
    description: {
      type: String,
      trim: true,
    },
    responsibilities: {
      type: String,
      trim: true,
    },
    // Staff capacity
    totalStaff: {
      type: Number,
      default: 0,
    },
    // Operational details
    shiftHours: {
      type: Number,
      default: 24,
    },
    dailyCapacity: {
      type: Number,
      default: 0,
    },
    // Department head
    departmentHead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
departmentSchema.index({ departmentType: 1, sequenceOrder: 1 });

// Virtual for staff count (we'll populate this later)
departmentSchema.virtual('staffMembers', {
  ref: 'Staff',
  localField: '_id',
  foreignField: 'department',
});

// Virtual for machinery count
departmentSchema.virtual('machinery', {
  ref: 'Machinery',
  localField: '_id',
  foreignField: 'department',
});

export const Department = mongoose.model('Department', departmentSchema);