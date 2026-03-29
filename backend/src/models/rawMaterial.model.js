
// src/models/rawMaterial.model.js
import mongoose from 'mongoose';

const rawMaterialSchema = new mongoose.Schema(
  {
    materialName: {
      type: String,
      required: [true, 'Material name is required'],
      trim: true,
    },
    materialCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    materialType: {
      type: String,
      enum: [
        'Cotton Fiber',
        'Polyester Fiber',
        'Recycled Material',
        'Cotton PC2',
        'Blended Fiber',
        'Chemical',
        'Dye',
        'Other',
      ],
      required: [true, 'Material type is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      enum: ['kg', 'ton', 'litre', 'meter', 'piece', 'bale'],
      required: [true, 'Unit is required'],
      default: 'kg',
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: 0,
      default: 0,
    },
    reorderLevel: {
      type: Number,
      required: [true, 'Reorder level is required'],
      min: 0,
      default: 100,
    },
    maxStockLevel: {
      type: Number,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'PKR',
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    location: {
      warehouse: String,
      section: String,
      rack: String,
    },
    specifications: {
      quality: String,
      grade: String,
      origin: String,
      certifications: [String],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastPurchaseDate: {
      type: Date,
    },
    lastPurchasePrice: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
rawMaterialSchema.index({ materialType: 1 });
rawMaterialSchema.index({ stockQuantity: 1 });
rawMaterialSchema.index({ materialName: 'text', materialCode: 'text' });

// Virtual for checking if reorder needed
rawMaterialSchema.virtual('needsReorder').get(function () {
  return this.stockQuantity <= this.reorderLevel;
});

// Virtual for stock status
rawMaterialSchema.virtual('stockStatus').get(function () {
  if (this.stockQuantity === 0) return 'out-of-stock';
  if (this.stockQuantity <= this.reorderLevel) return 'low-stock';
  if (this.maxStockLevel && this.stockQuantity >= this.maxStockLevel)
    return 'overstock';
  return 'in-stock';
});

// Virtual for stock value
rawMaterialSchema.virtual('stockValue').get(function () {
  return this.stockQuantity * this.unitPrice;
});

export const RawMaterial = mongoose.model('RawMaterial', rawMaterialSchema);