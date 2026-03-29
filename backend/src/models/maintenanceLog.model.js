// src/models/maintenanceLog.model.js
import mongoose from 'mongoose';

const maintenanceLogSchema = new mongoose.Schema(
  {
    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machinery',
      required: [true, 'Machine reference is required'],
    },
    maintenanceType: {
      type: String,
      enum: ['routine', 'repair', 'breakdown', 'upgrade'],
      required: [true, 'Maintenance type is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    maintenanceDate: {
      type: Date,
      default: Date.now,
    },
    completionDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    cost: {
      type: Number,
      min: 0,
      default: 0,
    },
    partsReplaced: [{
      partName: String,
      quantity: Number,
      cost: Number,
    }],
    downtime: {
      type: Number, // in hours
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
maintenanceLogSchema.index({ machine: 1, maintenanceDate: -1 });
maintenanceLogSchema.index({ status: 1 });
maintenanceLogSchema.index({ maintenanceType: 1 });

// Calculate downtime automatically when completed
maintenanceLogSchema.pre('save', async function() {
  if (this.status === 'completed' && this.completionDate && this.maintenanceDate) {
    const diff = this.completionDate - this.maintenanceDate;
    this.downtime = Math.round(diff / (1000 * 60 * 60)); // Convert to hours
  }
});

export const MaintenanceLog = mongoose.model('MaintenanceLog', maintenanceLogSchema);