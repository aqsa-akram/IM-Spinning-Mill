// src/models/finance.model.js
import mongoose from 'mongoose';

const financeSchema = new mongoose.Schema(
  {
    transactionDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    type: {
      type: String,
      enum: ['INCOME', 'EXPENSE'],
      required: [true, 'Transaction type is required'],
    },
    category: {
      type: String,
      // 'PRODUCTION' and 'RAWMATERIAL' to this list
      enum: [
        'PURCHASE', 
        'PAYROLL', 
        'SALE', 
        'UTILITY', 
        'MAINTENANCE', 
        'INVENTORY', 
        'SUPPLIER', 
        'PRODUCTION',  
        'RAWMATERIAL', 
        'OTHER'
      ],
      required: [true, 'Category is required'],
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'onModel',
    },
    onModel: {
      type: String,
      required: true,
      //  'Production' and 'RawMaterial' to this list
      enum: [
        'Purchase', 
        'Payroll', 
        'Order', 
        'MaintenanceLog', 
        'Inventory', 
        'Supplier',
        'Production',  // <--- Added
        'RawMaterial'  // <--- Added
      ],
    },
    status: {
      type: String,
      enum: ['pending', 'cleared'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank-transfer', 'cheque', 'credit'],
    },
    description: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    bankDetails: {
      accountNumber: String,
      bankName: String,
      transactionId: String,
      chequeNumber: String,
    },
    fiscalYear: {
      type: Number,
    },
    fiscalMonth: {
      type: Number,
      min: 1,
      max: 12,
    },
  },
  {
    timestamps: true,
  }
);

financeSchema.index({ type: 1, category: 1 });
financeSchema.index({ status: 1 });
financeSchema.index({ transactionDate: -1 });
financeSchema.index({ fiscalYear: 1, fiscalMonth: 1 });
financeSchema.index({ onModel: 1, referenceId: 1 });

financeSchema.pre('save', async function() {
  if (this.isNew || this.isModified('transactionDate')) {
    const date = new Date(this.transactionDate);
    this.fiscalYear = date.getFullYear();
    this.fiscalMonth = date.getMonth() + 1;
  }
});

// Helper statics
financeSchema.statics.createFromPurchasePayment = async function(purchaseId, amount, paymentMethod, recordedBy) {
  try {
    return await this.create({
      amount,
      type: 'EXPENSE',
      category: 'PURCHASE',
      referenceId: purchaseId,
      onModel: 'Purchase',
      status: 'cleared',
      paymentMethod,
      recordedBy,
      description: `Payment for Purchase Order`,
    });
  } catch (error) {
    console.error('Error creating finance entry from purchase:', error);
    throw error;
  }
};

financeSchema.statics.createFromPayrollPayment = async function(payrollId, amount, paymentMethod, recordedBy) {
  try {
    return await this.create({
      amount,
      type: 'EXPENSE',
      category: 'PAYROLL',
      referenceId: payrollId,
      onModel: 'Payroll',
      status: 'cleared',
      paymentMethod,
      recordedBy,
      description: `Salary payment`,
    });
  } catch (error) {
    console.error('Error creating finance entry from payroll:', error);
    throw error;
  }
};

financeSchema.methods.populateReference = async function() {
  await this.populate('referenceId');
  return this;
};

export const Finance = mongoose.model('Finance', financeSchema);