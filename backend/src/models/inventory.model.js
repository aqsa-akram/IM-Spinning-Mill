// src/models/inventory.model.js
import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ['raw-material', 'finished-product', 'semi-finished', 'spare-part'],
      required: [true, 'Item type is required'],
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Item reference is required'],
      refPath: 'itemModel',
    },
    itemModel: {
      type: String,
      required: true,
      enum: ['RawMaterial', 'Product', 'Machinery'],
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse is required'],
    },
    location: {
      section: String,
      rack: String,
      bin: String,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0,
    },
    unit: {
      type: String,
      required: true,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastStockCheck: {
      type: Date,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
inventorySchema.index({ warehouse: 1, itemType: 1 });
inventorySchema.index({ item: 1, warehouse: 1 }, { unique: true });

// Virtual for available quantity
inventorySchema.virtual('availableQuantity').get(function () {
  return this.quantity - this.reservedQuantity;
});

export const Inventory = mongoose.model('Inventory', inventorySchema);