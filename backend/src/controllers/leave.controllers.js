// src/controllers/leave.controllers.js
import { Leave } from '../models/leave.model.js';
import { Staff } from '../models/staff.model.js';
import { Attendance } from '../models/attendance.model.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Apply for leave
 * POST /api/v1/leaves
 */
export const applyLeave = asyncHandler(async (req, res) => {
  const {
    staff,
    leaveType,
    startDate,
    endDate,
    reason,
    isHalfDay,
  } = req.body;

  // Check if staff exists
  const staffExists = await Staff.findById(staff);
  if (!staffExists) {
    throw new ApiError(404, 'Staff not found');
  }

  // Check for overlapping leaves
  const overlap = await Leave.findOne({
    staff,
    status: { $in: ['pending', 'approved'] },
    $or: [
      {
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) },
      },
    ],
  });

  if (overlap) {
    throw new ApiError(409, 'Leave already exists for this period');
  }

  const leave = await Leave.create({
    staff,
    leaveType,
    startDate,
    endDate,
    reason,
    isHalfDay,
  });

  const createdLeave = await Leave.findById(leave._id).populate(
    'staff',
    'name employeeId department'
  );

  return res
    .status(201)
    .json(new ApiResponse(201, createdLeave, 'Leave applied successfully'));
});

/**
 * Get all leaves
 * GET /api/v1/leaves
 */
export const getAllLeaves = asyncHandler(async (req, res) => {
  const {
    staff,
    status,
    leaveType,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {};
  if (staff) filter.staff = staff;
  if (status) filter.status = status;
  if (leaveType) filter.leaveType = leaveType;

  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = new Date(startDate);
    if (endDate) filter.startDate.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [leaves, totalCount] = await Promise.all([
    Leave.find(filter)
      .populate('staff', 'name employeeId department')
      .populate('approvedBy', 'username fullName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ appliedDate: -1 }),
    Leave.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        leaves,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit),
        },
      },
      'Leaves fetched successfully'
    )
  );
});

/**
 * Approve/Reject leave
 * PATCH /api/v1/leaves/:id/status
 */
export const updateLeaveStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  const leave = await Leave.findById(id);
  if (!leave) {
    throw new ApiError(404, 'Leave not found');
  }

  leave.status = status;
  leave.approvedBy = req.user._id;
  leave.approvedDate = new Date();
  if (rejectionReason) leave.rejectionReason = rejectionReason;

  await leave.save();

  // If approved, mark attendance
  if (status === 'approved') {
    const dates = [];
    const currentDate = new Date(leave.startDate);
    const end = new Date(leave.endDate);

    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    await Promise.all(
      dates.map((date) =>
        Attendance.create({
          staff: leave.staff,
          date,
          status: 'on-leave',
          leaveReference: leave._id,
          markedBy: req.user._id,
        })
      )
    );
  }

  const updatedLeave = await Leave.findById(id)
    .populate('staff', 'name employeeId')
    .populate('approvedBy', 'username fullName');

  return res
    .status(200)
    .json(new ApiResponse(200, updatedLeave, 'Leave status updated successfully'));
});

/**
 * Get staff leave balance
 * GET /api/v1/leaves/staff/:staffId/balance
 */
export const getLeaveBalance = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const { year = new Date().getFullYear() } = req.query;

  const staff = await Staff.findById(staffId);
  if (!staff) {
    throw new ApiError(404, 'Staff not found');
  }

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const taken = await Leave.aggregate([
    {
      $match: {
        staff: staff._id,
        status: 'approved',
        startDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$leaveType',
        days: { $sum: '$numberOfDays' },
      },
    },
  ]);

  // Standard allocations (can be customized)
  const allocations = {
    annual: 21,
    sick: 14,
    casual: 10,
  };

  const balance = Object.keys(allocations).map((type) => {
    const takenItem = taken.find((t) => t._id === type);
    const takenDays = takenItem ? takenItem.days : 0;

    return {
      leaveType: type,
      allocated: allocations[type],
      taken: takenDays,
      balance: allocations[type] - takenDays,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        staff: { _id: staff._id, name: staff.name, employeeId: staff.employeeId },
        year,
        balance,
      },
      'Leave balance fetched successfully'
    )
  );
});