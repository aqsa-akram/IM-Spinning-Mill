// src/models/attendance.model.js
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Staff reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'half-day', 'late', 'on-leave'],
      required: [true, 'Status is required'],
      default: 'present',
    },
    checkIn: {
      time: Date,
      method: {
        type: String,
        enum: ['manual', 'biometric', 'rfid', 'mobile-app'],
        default: 'manual',
      },
      location: String,
    },
    checkOut: {
      time: Date,
      method: {
        type: String,
        enum: ['manual', 'biometric', 'rfid', 'mobile-app'],
        default: 'manual',
      },
      location: String,
    },
    workingHours: {
      type: Number,
      min: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    earlyLeaveMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    leaveReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Leave',
    },
    remarks: String,
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
attendanceSchema.index({ staff: 1, date: -1 });
attendanceSchema.index({ date: -1, status: 1 });
attendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

// ✅ FIXED: Calculate working hours AND overtime based on Shift duration
attendanceSchema.pre('save', async function () {
  // Calculate working hours if check-in and check-out exist
  if (this.checkIn?.time && this.checkOut?.time) {
    const diff = this.checkOut.time - this.checkIn.time;
    const hours = diff / (1000 * 60 * 60);
    this.workingHours = Math.max(0, hours);

    // ✅ Calculate overtime based on assigned Shift duration
    if (this.shift) {
      try {
        // Populate shift to get duration
        const Shift = mongoose.model('Shift');
        const shiftData = await Shift.findById(this.shift).select('duration');
        
        if (shiftData && shiftData.duration) {
          const regularHours = shiftData.duration;
          this.overtimeHours = this.workingHours > regularHours ? this.workingHours - regularHours : 0;
        } else {
          // Fallback to 8 hours if shift duration not found
          const regularHours = 8;
          this.overtimeHours = this.workingHours > regularHours ? this.workingHours - regularHours : 0;
        }
      } catch (error) {
        console.error('Error fetching shift data:', error);
        // Fallback to 8 hours on error
        const regularHours = 8;
        this.overtimeHours = this.workingHours > regularHours ? this.workingHours - regularHours : 0;
      }
    } else {
      // No shift assigned, use default 8 hours
      const regularHours = 8;
      this.overtimeHours = this.workingHours > regularHours ? this.workingHours - regularHours : 0;
    }
  }
});

export const Attendance = mongoose.model('Attendance', attendanceSchema);