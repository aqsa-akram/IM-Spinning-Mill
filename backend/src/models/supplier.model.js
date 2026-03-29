// src/models/supplier.model.js
import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    supplierName: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
    },
    supplierCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    contactPerson: {
      name: String,
      designation: String,
      phone: String,
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: {
        type: String,
        default: 'Pakistan',
      },
      postalCode: String,
    },
    phone: [{
      type: String,
    }],
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    materialsSupplied: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RawMaterial',
    }],
    materialTypes: [{
      type: String,
      enum: [
        'Cotton Fiber',
        'Polyester Fiber',
        'Recycled Material',
        'Chemical',
        'Dye',
        'Machinery',
        'Spare Parts',
        'Other',
      ],
    }],
    paymentTerms: {
      type: String,
      enum: ['cash', 'credit-15', 'credit-30', 'credit-45', 'credit-60', 'advance'],
      default: 'credit-30',
    },
    creditLimit: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    taxId: {
      type: String,
      trim: true,
    },
    ntn: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    contractStartDate: {
      type: Date,
    },
    contractEndDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
supplierSchema.index({ supplierName: 'text', supplierCode: 'text' });
supplierSchema.index({ isActive: 1 });

// Virtual for available credit
supplierSchema.virtual('availableCredit').get(function () {
  return this.creditLimit - this.currentBalance;
});

export const Supplier = mongoose.model('Supplier', supplierSchema);