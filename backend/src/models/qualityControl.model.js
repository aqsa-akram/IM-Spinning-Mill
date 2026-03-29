// src/models/qualityControl.model.js
import mongoose from 'mongoose';

const qualityControlSchema = new mongoose.Schema(
  {
    testDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    production: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Production',
    },
    batchNumber: {
      type: String,
      trim: true,
    },
    // Yarn Quality Tests
    yarnTests: {
      // Strength Tests
      strength: {
        value: Number,
        unit: { type: String, default: 'cN/tex' },
        standard: Number,
        status: {
          type: String,
          enum: ['pass', 'fail', 'marginal'],
        },
      },
      // Count/Fineness
      count: {
        value: Number,
        tolerance: Number,
        status: {
          type: String,
          enum: ['pass', 'fail', 'marginal'],
        },
      },
      // Evenness
      evenness: {
        cv: Number, // Coefficient of Variation
        u: Number, // Uster U%
        standard: Number,
        status: {
          type: String,
          enum: ['pass', 'fail', 'marginal'],
        },
      },
      // Moisture Content
      moistureContent: {
        value: Number,
        unit: { type: String, default: '%' },
        standard: Number,
        status: {
          type: String,
          enum: ['pass', 'fail', 'marginal'],
        },
      },
      // Twist
      twist: {
        tpi: Number, // Twists Per Inch
        standard: Number,
        status: {
          type: String,
          enum: ['pass', 'fail', 'marginal'],
        },
      },
      // Imperfections
      imperfections: {
        thinPlaces: Number,
        thickPlaces: Number,
        neps: Number,
      },
    },
    // Blend Ratio Test (for mixed materials)
    blendRatio: {
      cotton: Number,
      polyester: Number,
      recycled: Number,
      other: Number,
      status: {
        type: String,
        enum: ['pass', 'fail', 'marginal'],
      },
    },
    // Overall Quality
    overallGrade: {
      type: String,
      enum: ['A+', 'A', 'B', 'C', 'Rejected'],
      required: true,
    },
    overallStatus: {
      type: String,
      enum: ['approved', 'rejected', 'rework'],
      default: 'approved',
    },
    // Testing Details
    testedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    testLocation: {
      type: String,
      enum: ['Laboratory', 'Production Floor', 'Warehouse'],
      default: 'Laboratory',
    },
    // Sample Details
    sampleSize: {
      type: Number,
      min: 1,
    },
    sampleUnit: {
      type: String,
      enum: ['kg', 'cone', 'meter', 'piece'],
    },
    // Defects Found
    defects: [
      {
        defectType: {
          type: String,
          enum: [
            'thick-place',
            'thin-place',
            'nep',
            'slub',
            'contamination',
            'color-variation',
            'weak-spot',
            'other',
          ],
        },
        severity: {
          type: String,
          enum: ['minor', 'major', 'critical'],
        },
        description: String,
      },
    ],
    // Corrective Actions
    correctiveActions: {
      required: Boolean,
      actions: [
        {
          action: String,
          assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff',
          },
          completedDate: Date,
          status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed'],
            default: 'pending',
          },
        },
      ],
    },
    notes: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        filename: String,
        path: String,
        uploadDate: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
qualityControlSchema.index({ testDate: -1, product: 1 });
qualityControlSchema.index({ overallGrade: 1 });
qualityControlSchema.index({ overallStatus: 1 });
qualityControlSchema.index({ batchNumber: 1 });

export const QualityControl = mongoose.model(
  'QualityControl',
  qualityControlSchema
);