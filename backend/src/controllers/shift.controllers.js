// src/controllers/shift.controllers.js
import { Shift } from '../models/shift.model.js';
import { Staff } from '../models/staff.model.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Create a new shift
 * POST /api/v1/shifts
 */
export const createShift = asyncHandler(async (req, res) => {
  const { shiftName, shiftCode, startTime, endTime, breakTime } = req.body;

  // Validation
  if (!shiftName || !shiftCode || !startTime || !endTime) {
    throw new ApiError(400, 'Shift name, code, start time, and end time are required');
  }

  // Check if shift code already exists
  const existingShift = await Shift.findOne({ shiftCode: shiftCode.toUpperCase() });
  if (existingShift) {
    throw new ApiError(409, 'Shift with this code already exists');
  }

  // Create shift
  const shift = await Shift.create({
    shiftName,
    shiftCode: shiftCode.toUpperCase(),
    startTime,
    endTime,
    breakTime,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, shift, 'Shift created successfully'));
});

/**
 * Get all shifts
 * GET /api/v1/shifts
 */
export const getAllShifts = asyncHandler(async (req, res) => {
  const { isActive } = req.query;

  // Build filter
  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const shifts = await Shift.find(filter).sort({ shiftCode: 1 }).lean();

  // Get staff count for each shift
  const shiftsWithStats = await Promise.all(
    shifts.map(async (shift) => {
      const staffCount = await Staff.countDocuments({
        shift: shift._id,
        employmentStatus: 'active',
      });

      return {
        ...shift,
        staffCount,
      };
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, shiftsWithStats, 'Shifts fetched successfully'));
});

/**
 * Get shift by ID
 * GET /api/v1/shifts/:id
 */
export const getShiftById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const shift = await Shift.findById(id).lean();

  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  // Get staff assigned to this shift
  const [staffList, staffCount] = await Promise.all([
    Staff.find({ shift: id, employmentStatus: 'active' })
      .select('name employeeId role department')
      .populate('department', 'departmentName departmentCode'),
    Staff.countDocuments({ shift: id, employmentStatus: 'active' }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...shift,
        staffCount,
        staff: staffList,
      },
      'Shift details fetched successfully'
    )
  );
});

/**
 * Update shift
 * PATCH /api/v1/shifts/:id
 */
export const updateShift = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Remove fields that shouldn't be updated
  delete updates._id;
  delete updates.createdAt;

  const shift = await Shift.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, shift, 'Shift updated successfully'));
});

/**
 * Delete shift (soft delete - deactivate)
 * DELETE /api/v1/shifts/:id
 */
export const deleteShift = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if any staff is assigned to this shift
  const assignedStaff = await Staff.countDocuments({
    shift: id,
    employmentStatus: 'active',
  });

  if (assignedStaff > 0) {
    throw new ApiError(
      400,
      `Cannot delete shift. ${assignedStaff} staff members are assigned to it.`
    );
  }

  const shift = await Shift.findByIdAndUpdate(
    id,
    { $set: { isActive: false } },
    { new: true }
  );

  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, shift, 'Shift deactivated successfully'));
});

/**
 * Get staff in a specific shift
 * GET /api/v1/shifts/:id/staff
 */
export const getStaffInShift = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { department, role } = req.query;

  // Verify shift exists
  const shift = await Shift.findById(id);
  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  // Build filter
  const filter = {
    shift: id,
    employmentStatus: 'active',
  };
  if (department) filter.department = department;
  if (role) filter.role = role;

  const staff = await Staff.find(filter)
    .populate('department', 'departmentName departmentCode')
    .sort({ department: 1, role: 1, name: 1 });

  // Group by department
  const staffByDepartment = staff.reduce((acc, member) => {
    const deptName = member.department?.departmentName || 'Unassigned';
    if (!acc[deptName]) {
      acc[deptName] = [];
    }
    acc[deptName].push(member);
    return acc;
  }, {});

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        shift,
        totalStaff: staff.length,
        staffByDepartment,
        allStaff: staff,
      },
      'Shift staff fetched successfully'
    )
  );
});

/**
 * Assign staff to shift
 * POST /api/v1/shifts/assign
 */
export const assignStaffToShift = asyncHandler(async (req, res) => {
  const { staffId, shiftId } = req.body;

  if (!staffId || !shiftId) {
    throw new ApiError(400, 'Staff ID and Shift ID are required');
  }

  // Verify shift exists
  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  if (!shift.isActive) {
    throw new ApiError(400, 'Cannot assign staff to inactive shift');
  }

  // Verify staff exists
  const staff = await Staff.findById(staffId);
  if (!staff) {
    throw new ApiError(404, 'Staff member not found');
  }

  if (staff.employmentStatus !== 'active') {
    throw new ApiError(400, 'Cannot assign inactive staff to shift');
  }

  // Update staff shift
  staff.shift = shiftId;
  await staff.save();

  const updatedStaff = await Staff.findById(staffId)
    .populate('shift', 'shiftName shiftCode startTime endTime')
    .populate('department', 'departmentName departmentCode');

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedStaff, 'Staff assigned to shift successfully')
    );
});

/**
 * Bulk assign staff to shift
 * POST /api/v1/shifts/bulk-assign
 */
export const bulkAssignStaffToShift = asyncHandler(async (req, res) => {
  const { staffIds, shiftId } = req.body;

  if (!Array.isArray(staffIds) || staffIds.length === 0 || !shiftId) {
    throw new ApiError(400, 'Staff IDs array and Shift ID are required');
  }

  // Verify shift exists and is active
  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  if (!shift.isActive) {
    throw new ApiError(400, 'Cannot assign staff to inactive shift');
  }

  // Update all staff members
  const result = await Staff.updateMany(
    {
      _id: { $in: staffIds },
      employmentStatus: 'active',
    },
    {
      $set: { shift: shiftId },
    }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        assignedCount: result.modifiedCount,
        shiftName: shift.shiftName,
      },
      `${result.modifiedCount} staff members assigned to ${shift.shiftName}`
    )
  );
});

/**
 * Get shift statistics
 * GET /api/v1/shifts/stats/overview
 */
export const getShiftStats = asyncHandler(async (req, res) => {
  const [totalShifts, activeShifts, staffDistribution] = await Promise.all([
    Shift.countDocuments(),
    Shift.countDocuments({ isActive: true }),
    Staff.aggregate([
      { $match: { employmentStatus: 'active', shift: { $ne: null } } },
      {
        $group: {
          _id: '$shift',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'shifts',
          localField: '_id',
          foreignField: '_id',
          as: 'shift',
        },
      },
      { $unwind: '$shift' },
      {
        $project: {
          _id: 0,
          shiftName: '$shift.shiftName',
          shiftCode: '$shift.shiftCode',
          startTime: '$shift.startTime',
          endTime: '$shift.endTime',
          staffCount: '$count',
        },
      },
      { $sort: { staffCount: -1 } },
    ]),
  ]);

  const staffWithoutShift = await Staff.countDocuments({
    employmentStatus: 'active',
    shift: null,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalShifts,
        activeShifts,
        staffDistribution,
        staffWithoutShift,
      },
      'Shift statistics fetched successfully'
    )
  );
});