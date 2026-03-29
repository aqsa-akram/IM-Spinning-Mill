// src/models/company.models.js
import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      default: 'IM Spinning Mills (Pvt) Ltd',
    },
    address: {
      type: String,
      required: true,
      default: 'Near Faisalabad bypass, Chowk Jeevan Kalan Sheikhupura, Pakistan',
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
    establishedYear: {
      type: Number,
      default: 1995,
    },
    // Company Details
    millType: {
      type: String,
      default: 'Open-End Spinning Mill',
    },
    mission: {
      type: String,
      default: 'To produce high-quality yarn through advanced technology and skilled workforce, ensuring customer satisfaction, sustainable growth, and contribution to the textile industry.',
    },
    // Statistics
    totalEmployees: {
      type: Number,
      default: 0,
    },
    totalDepartments: {
      type: Number,
      default: 13,
    },
    totalMachinery: {
      type: Number,
      default: 0,
    },
    productionCapacity: {
      value: Number,
      unit: String, // e.g., "tons/day"
    },
    // Leadership
    owner: {
      name: {
        type: String,
        default: 'CH Fahad Wirk',
      },
      designation: {
        type: String,
        default: 'Mill Owner & CEO',
      },
    },
    generalManager: {
      name: {
        type: String,
        default: 'Muhammad Asif',
      },
    },
    // Certifications
    certifications: [{
      name: String,
      issuedBy: String,
      issuedDate: Date,
      expiryDate: Date,
    }],
    // Settings
    workingDays: {
      type: Number,
      default: 7, // Operating 7 days a week
    },
    shiftsPerDay: {
      type: Number,
      default: 3,
    },
  },
  {
    timestamps: true,
  }
);

export const Company = mongoose.model('Company', companySchema);