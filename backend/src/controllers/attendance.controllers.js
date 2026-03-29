// src/controllers/attendance.controllers.js
import { Attendance } from '../models/attendance.model.js';
import { Staff } from '../models/staff.model.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Mark attendance
 * POST /api/v1/attendance
 */
export const markAttendance = asyncHandler(async (req, res) => {
  const {
    staff,
    date,
    shift,
    status,
    checkIn,
    checkOut,
    remarks,
  } = req.body;

  // Check if attendance already marked
  const existing = await Attendance.findOne({
    staff,
    date: new Date(date),
  });

  if (existing) {
    throw new ApiError(409, 'Attendance already marked for this date');
  }

  const attendance = await Attendance.create({
    staff,
    date,
    shift,
    status,
    checkIn,
    checkOut,
    remarks,
    markedBy: req.user._id,
  });

  const createdAttendance = await Attendance.findById(attendance._id)
    .populate('staff', 'name employeeId department')
    .populate('shift', 'shiftName');

  return res
    .status(201)
    .json(
      new ApiResponse(201, createdAttendance, 'Attendance marked successfully')
    );
});

/**
 * Get attendance records
 * GET /api/v1/attendance
 */
export const getAttendance = asyncHandler(async (req, res) => {
  const {
    staff,
    startDate,
    endDate,
    status,
    page = 1,
    limit = 20,
  } = req.query;  // ✅ CORRECT for GET requests

  const filter = {};
  if (staff) filter.staff = staff;
  if (status) filter.status = status;

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [records, totalCount] = await Promise.all([
    Attendance.find(filter)
      .populate('staff', 'name employeeId department')
      .populate('shift', 'shiftName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1 }),
    Attendance.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        records,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit),
        },
      },
      'Attendance records fetched successfully'
    )
  );
});

/**
 * Update attendance
 * PATCH /api/v1/attendance/:id
 */
export const updateAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const attendance = await Attendance.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate('staff', 'name employeeId')
    .populate('shift', 'shiftName');

  if (!attendance) {
    throw new ApiError(404, 'Attendance record not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, attendance, 'Attendance updated successfully'));
});

/**
 * Get staff attendance summary
 * GET /api/v1/attendance/staff/:staffId/summary
 */
export const getStaffAttendanceSummary = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const { month, year } = req.query;

  const staff = await Staff.findById(staffId);
  if (!staff) {
    throw new ApiError(404, 'Staff not found');
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const summary = await Attendance.aggregate([
    {
      $match: {
        staff: staff._id,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalHours: { $sum: '$workingHours' },
        totalOvertime: { $sum: '$overtimeHours' },
      },
    },
  ]);

  const totalRecords = await Attendance.countDocuments({
    staff: staffId,
    date: { $gte: startDate, $lte: endDate },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        staff: {
          _id: staff._id,
          name: staff.name,
          employeeId: staff.employeeId,
        },
        month,
        year,
        totalRecords,
        summary,
      },
      'Attendance summary fetched successfully'
    )
  );
});

/**
 * Get daily attendance report
 * GET /api/v1/attendance/report/daily
 */
export const getDailyAttendanceReport = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const targetDate = date ? new Date(date) : new Date();

  const report = await Attendance.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          $lte: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const totalStaff = await Staff.countDocuments({ employmentStatus: 'active' });
  const markedAttendance = report.reduce((sum, item) => sum + item.count, 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        date: targetDate.toISOString().split('T')[0],
        totalStaff,
        markedAttendance,
        unmarked: totalStaff - markedAttendance,
        breakdown: report,
      },
      'Daily attendance report fetched successfully'
    )
  );
});

/**
 * Bulk mark attendance
 * POST /api/v1/attendance/bulk
 */
export const bulkMarkAttendance = asyncHandler(async (req, res) => {
  const { date, records } = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    throw new ApiError(400, 'Records array is required');
  }

  const attendanceRecords = records.map((record) => ({
    ...record,
    date,
    markedBy: req.user._id,
  }));

  const result = await Attendance.insertMany(attendanceRecords, {
    ordered: false,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { count: result.length },
        `${result.length} attendance records marked successfully`
      )
    );
});