// src/models/machinery.models.js
import mongoose from 'mongoose';

const machinerySchema = new mongoose.Schema(
  {
    machineName: {
      type: String,
      required: [true, 'Machine name is required'],
      trim: true,
    },
    machineCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },
    manufacturer: {
      type: String,
      trim: true,
      // e.g., 'Trutzchler', 'Toyoda', 'China', 'Pakistan'
    },
    yearOfManufacture: {
      type: Number,
      min: 1980,
      max: new Date().getFullYear(),
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Operational Status
    maintenanceStatus: {
      type: String,
      enum: ['operational', 'under-maintenance', 'breakdown', 'idle'],
      default: 'operational',
    },
    specifications: {
      capacity: Number,
      powerConsumption: String, // e.g., "75 KW"
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
          type: String,
          default: 'meters'
        }
      },
      weight: Number, // in kg
    },
    // Maintenance Details
    lastMaintenanceDate: {
      type: Date,
    },
    nextMaintenanceDate: {
      type: Date,
    },
    maintenanceInterval: {
      type: Number, // in days
      default: 90,
    },
    // Performance
    operatingHours: {
      type: Number,
      default: 0,
    },
    averageOutput: {
      value: Number,
      unit: String, // e.g., "kg/hour"
    },
    // Purchase Information
    purchaseDate: {
      type: Date,
    },
    purchaseCost: {
      type: Number,
    },
    supplier: {
      type: String,
      trim: true,
    },
    warrantyExpiryDate: {
      type: Date,
    },
    // Assignment
    assignedOperator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    notes: {
      type: String,
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

// Indexes
machinerySchema.index({ department: 1, maintenanceStatus: 1 });
machinerySchema.index({ machineName: 'text' });

// Virtual for maintenance due status
machinerySchema.virtual('isMaintenanceDue').get(function() {
  if (!this.nextMaintenanceDate) return false;
  return new Date() >= this.nextMaintenanceDate;
});

export const Machinery = mongoose.model('Machinery', machinerySchema);