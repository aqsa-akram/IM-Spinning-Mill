// src/models/inventoryTransaction.model.js
import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema(
  {
    transactionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ['in', 'out', 'transfer', 'adjustment'],
      required: [true, 'Transaction type is required'],
    },
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: [true, 'Inventory reference is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
    },
    unit: {
      type: String,
      required: true,
    },
    fromWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    toWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    reason: {
      type: String,
      enum: [
        'purchase',
        'production',
        'sale',
        'damage',
        'expired',
        'transfer',
        'return',
        'adjustment',
        'other',
      ],
      required: true,
    },
    referenceType: {
      type: String,
      enum: ['Purchase', 'Production', 'Sale', 'Manual'],
    },
    reference: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'referenceType',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
inventoryTransactionSchema.index({ transactionDate: -1, inventory: 1 });
inventoryTransactionSchema.index({ transactionType: 1 });

export const InventoryTransaction = mongoose.model(
  'InventoryTransaction',
  inventoryTransactionSchema
);