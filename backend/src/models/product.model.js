// src/models/product.models.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    productCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    productType: {
      type: String,
      required: true,
      enum: [
        'Industrial Thread', 'Textile Thread', 'Wiper Thread',
        'Lycra Thread', 'Khadar Thread', 'Karandi Thread',
        'Wash & Wear Thread', 'Specialty Thread', 'Custom Thread'
      ],
    },
    // Thread Specifications
    threadCount: {
      type: Number,
      required: [true, 'Thread count is required'],
      min: 0.6,
      max: 40,
    },
    blendRatio: {
      cotton: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      polyester: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      recycled: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },
    // Production Details
    productionDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    description: {
      type: String,
      trim: true,
    },
    specifications: {
      strength: String, // e.g., "High", "Medium", "Low"
      finish: String, // e.g., "Smooth", "Rough"
      color: String,
      weight: String, // e.g., "per cone"
      packaging: String, // e.g., "Cone", "Bale"
    },
    // Pricing
    costPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'PKR',
    },
    // Inventory
    stockQuantity: {
      type: Number,
      default: 0,
    },
    reorderLevel: {
      type: Number,
      default: 100,
    },
    unit: {
      type: String,
      enum: ['kg', 'cone', 'bale', 'piece'],
      default: 'kg',
    },
    // Applications
    applications: [{
      type: String,
    }],
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
productSchema.index({ productType: 1, threadCount: 1 });
productSchema.index({ productName: 'text', productCode: 'text' });

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  return ((this.sellingPrice - this.costPrice) / this.costPrice * 100).toFixed(2);
});

// Check if reorder needed
productSchema.virtual('needsReorder').get(function() {
  return this.stockQuantity <= this.reorderLevel;
});

export const Product = mongoose.model('Product', productSchema);