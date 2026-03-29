import mongoose from 'mongoose';

const productionSchema = new mongoose.Schema(
  {
    productionDate: {
      type: Date,
      required: [true, 'Production date is required'],
      default: Date.now,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      required: [true, 'Shift is required'],
    },
    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machinery',
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Operator is required'],
    },
    // Production Quantities
    quantityProduced: {
      type: Number,
      required: [true, 'Quantity produced is required'],
      min: 0,
    },
    unit: {
      type: String,
      enum: ['kg', 'cone', 'bale', 'meter', 'piece'],
      required: [true, 'Unit is required'],
      default: 'kg',
    },
    targetQuantity: {
      type: Number,
      min: 0,
    },
    // Raw Materials Used
    rawMaterialsUsed: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'RawMaterial',
        },
        quantityUsed: {
          type: Number,
          required: true,
          min: 0,
        },
        unit: String,
      },
    ],
    // Quality Metrics
    qualityGrade: {
      type: String,
      enum: ['A', 'B', 'C', 'rejected'],
      default: 'A',
    },
    defectQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    defectPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Performance Metrics
    efficiency: {
      type: Number,
      min: 0,
      max: 100,
    },
    downtime: {
      type: Number,
      default: 0,
      min: 0,
    },
    downtimeReason: {
      type: String,
      trim: true,
    },
    // Time Tracking
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    actualHours: {
      type: Number,
      min: 0,
    },
    // Status
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'paused', 'cancelled'],
      default: 'in-progress',
    },
    // Additional Info
    batchNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
productionSchema.index({ productionDate: -1, department: 1 });
productionSchema.index({ product: 1, productionDate: -1 });
productionSchema.index({ shift: 1, productionDate: -1 });
productionSchema.index({ status: 1 });

// Calculate defect percentage, efficiency, and actual hours before saving
productionSchema.pre('save', async function () {
  if (this.quantityProduced > 0) {
    this.defectPercentage = Number(
      ((this.defectQuantity / this.quantityProduced) * 100).toFixed(2)
    );
  }

  // Calculate efficiency if target is set
  if (this.targetQuantity > 0) {
    this.efficiency = Number(
      ((this.quantityProduced / this.targetQuantity) * 100).toFixed(2)
    );
  }

  // Calculate actual hours
  if (this.startTime && this.endTime) {
    const diff = this.endTime - this.startTime;
    this.actualHours = Number(
      (diff / (1000 * 60 * 60)).toFixed(2)
    );
  }
});

// Virtual for net production (good quantity)
productionSchema.virtual('netProduction').get(function () {
  return this.quantityProduced - this.defectQuantity;
});

// Virtual for achievement percentage
productionSchema.virtual('achievementPercentage').get(function () {
  if (!this.targetQuantity) return null;
  return Number(
    ((this.quantityProduced / this.targetQuantity) * 100).toFixed(2)
  );
});

export const Production = mongoose.model('Production', productionSchema);
