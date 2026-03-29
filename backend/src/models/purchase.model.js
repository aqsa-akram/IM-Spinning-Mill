// src/models/purchase.model.js
import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema(
  {
    purchaseOrderNumber: {
      type: String,
      required: [true, 'Purchase order number is required'],
      unique: true,
      uppercase: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required'],
    },
    items: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'RawMaterial',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
        unit: {
          type: String,
          required: true,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        totalPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        receivedQuantity: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
    orderDate: {
      type: Date,
      default: Date.now,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    actualDeliveryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'partially-received', 'received', 'cancelled'],
      default: 'pending',
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partially-paid', 'paid'],
      default: 'unpaid',
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'cheque', 'bank-transfer', 'credit'],
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
purchaseSchema.index({ supplier: 1, orderDate: -1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ paymentStatus: 1 });

// Static method to calculate totals
purchaseSchema.statics.calculateTotals = function(items, taxAmount = 0, shippingCost = 0, discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const totalAmount = subtotal + taxAmount + shippingCost - discount;
  
  return { subtotal, totalAmount };
};

// Instance method to recalculate totals
purchaseSchema.methods.recalculateTotals = function() {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0
    );

    this.totalAmount =
      this.subtotal + 
      (this.taxAmount || 0) + 
      (this.shippingCost || 0) - 
      (this.discount || 0);
  }
  
  return this;
};

// Virtual for remaining payment
purchaseSchema.virtual('remainingAmount').get(function () {
  return this.totalAmount - this.paidAmount;
});

// Virtual for delivery status
purchaseSchema.virtual('deliveryStatus').get(function () {
  if (!this.expectedDeliveryDate) return 'not-scheduled';
  if (this.actualDeliveryDate) return 'delivered';
  if (new Date() > this.expectedDeliveryDate) return 'delayed';
  return 'on-time';
});

// Ensure virtuals are included in JSON
purchaseSchema.set('toJSON', { virtuals: true });
purchaseSchema.set('toObject', { virtuals: true });

export const Purchase = mongoose.model('Purchase', purchaseSchema);