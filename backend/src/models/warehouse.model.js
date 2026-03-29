// src/models/warehouse.model.js
import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema(
  {
    warehouseName: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
    },
    warehouseCode: {
      type: String,
      required: [true, 'Warehouse code is required'],
      unique: true,
      uppercase: true,
    },
    location: {
      address: String,
      city: String,
      area: String,
    },
    capacity: {
      total: Number,
      unit: { type: String, default: 'sq_ft' },
      utilized: { type: Number, default: 0 },
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    sections: [
      {
        sectionName: String,
        sectionCode: String,
        capacity: Number,
        itemType: {
          type: String,
          enum: ['raw-material', 'finished-product', 'semi-finished', 'spare-part'],
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Virtual for capacity utilization percentage
warehouseSchema.virtual('utilizationPercentage').get(function () {
  if (!this.capacity.total) return 0;
  return ((this.capacity.utilized / this.capacity.total) * 100).toFixed(2);
});

export const Warehouse = mongoose.model('Warehouse', warehouseSchema);