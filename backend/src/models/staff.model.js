// src/models/staff.model.js
import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Staff name is required'],
      trim: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      uppercase: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: [
        'Engineer', 'Electrical Engineer', 'Technical Manager',
        'Foreman', 'Deputy Foreman', 'Assistant Foreman', 
        'Shift Incharge', 'Supervisor', 'Department Head',
        'Head Fitter', 'Fitter', 'Pipe Fitter', 'Head Jobber', 
        'Jobber', 'Electrician',
        'Operator', 'Spare Operator', 'Doffer', 'Machine Winder',
        'Helper', 'Waste Collector', 'Sweeper', 'Mali', 
        'Security Guard', 'Cook',
        'Accountant', 'Purchaser', 'Tax Officer', 'Time Keeper',
        'Lab Incharge', 'Lab Clerk', 'Cone Checker',
        'General Manager', 'Production Incharge', 'Labour Officer',
        'Store Incharge', 'Packing Incharge', 'Mixing Incharge'
      ],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
    },
    careerLevel: {
      type: String,
      enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'management'],
      default: 'entry',
    },
    // Contact Information
    contactInfo: {
      phone: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      emergencyContact: {
        name: String,
        phone: String,
        relationship: String,
      },
    },
    // Employment Details
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    employmentStatus: {
      type: String,
      enum: ['active', 'on-leave', 'terminated', 'resigned'],
      default: 'active',
    },
    // ✅ FIXED: Changed select from false to true - Always include salary in queries
    baseSalary: {
      type: Number,
      required: [true, 'Base salary is required'],
      min: [0, 'Salary cannot be negative'],
    },
    // Skills & Training
    skills: [{
      type: String,
    }],
    certifications: [{
      name: String,
      issuedDate: Date,
      expiryDate: Date,
    }],
    // Performance
    performanceRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
staffSchema.index({ department: 1, role: 1 });
staffSchema.index({ employmentStatus: 1 });
staffSchema.index({ name: 'text' });

// Virtual for calculating years of service
staffSchema.virtual('yearsOfService').get(function() {
  return Math.floor((Date.now() - this.joiningDate) / (365.25 * 24 * 60 * 60 * 1000));
});

export const Staff = mongoose.model('Staff', staffSchema);