// src/controllers/staff.controllers.js - FULLY FIXED
import { Staff } from '../models/staff.model.js';
import { Department } from '../models/department.model.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Create new staff member
 * POST /api/v1/staff
 */
export const createStaff = asyncHandler(async (req, res) => {
  const {
    name,
    employeeId,
    role,
    department,
    shift,
    careerLevel,
    contactInfo,
    joiningDate,
    baseSalary,
    skills,
  } = req.body;

  // ✅ Validation - baseSalary is REQUIRED
  if (!name || !employeeId || !role || !department || !baseSalary) {
    throw new ApiError(400, 'Name, employee ID, role, department, and baseSalary are required');
  }

  if (baseSalary <= 0) {
    throw new ApiError(400, 'BaseSalary must be greater than 0');
  }

  // Check if employee ID already exists
  const existingStaff = await Staff.findOne({ employeeId: employeeId.toUpperCase() });
  if (existingStaff) {
    throw new ApiError(409, `Employee ID '${employeeId}' already exists`);
  }

  // Verify department exists and is active
  const deptExists = await Department.findById(department);
  if (!deptExists) {
    throw new ApiError(404, 'Department not found');
  }

  if (!deptExists.isActive) {
    throw new ApiError(400, 'Cannot assign staff to inactive department');
  }

  // Create staff
  const staff = await Staff.create({
    name,
    employeeId: employeeId.toUpperCase(),
    role,
    department,
    shift,
    careerLevel,
    contactInfo,
    joiningDate,
    baseSalary,
    skills,
  });

  // ✅ Only increment if staff is active
  if (staff.employmentStatus === 'active') {
    await Department.findByIdAndUpdate(department, {
      $inc: { totalStaff: 1 },
    });
  }

  const createdStaff = await Staff.findById(staff._id)
    .populate('department', 'departmentName departmentCode')
    .populate('shift', 'shiftName startTime endTime');

  return res.status(201).json(new ApiResponse(201, createdStaff, 'Staff member created successfully'));
});

/**
 * Get all staff members
 * GET /api/v1/staff
 */
export const getAllStaff = asyncHandler(async (req, res) => {
  const {
    department,
    role,
    employmentStatus = 'active',
    page = 1,
    limit = 20,
    search,
  } = req.query;

  const filter = {};
  if (department) filter.department = department;
  if (role) filter.role = role;
  if (employmentStatus) filter.employmentStatus = employmentStatus;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [staff, totalCount] = await Promise.all([
    Staff.find(filter)
      .populate('department', 'departmentName departmentCode')
      .populate('shift', 'shiftName startTime endTime')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 }),
    Staff.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        staff,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit),
        },
      },
      'Staff members fetched successfully'
    )
  );
});

/**
 * Get staff member by ID
 * GET /api/v1/staff/:id
 */
export const getStaffById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const staff = await Staff.findById(id)
    .populate('department', 'departmentName departmentCode departmentType')
    .populate('shift', 'shiftName startTime endTime duration');

  if (!staff) {
    throw new ApiError(404, 'Staff member not found');
  }

  return res.status(200).json(new ApiResponse(200, staff, 'Staff member fetched successfully'));
});

/**
 * Update staff member
 * PATCH /api/v1/staff/:id
 */
export const updateStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let updates = req.body;

  // Remove protected fields
  delete updates._id;
  delete updates.createdAt;
  delete updates.employeeId;

  // ✅ Get current staff data
  const currentStaff = await Staff.findById(id);
  if (!currentStaff) {
    throw new ApiError(404, 'Staff member not found');
  }

  // ✅ Validate salary if being updated
  if (updates.baseSalary && updates.baseSalary <= 0) {
    throw new ApiError(400, 'BaseSalary must be greater than 0');
  }

  // Handle department change
  if (updates.department && updates.department !== currentStaff.department.toString()) {
    const newDept = await Department.findById(updates.department);
    if (!newDept) {
      throw new ApiError(404, 'New department not found');
    }
    if (!newDept.isActive) {
      throw new ApiError(400, 'Cannot assign staff to inactive department');
    }

    if (currentStaff.employmentStatus === 'active') {
      await Department.findByIdAndUpdate(currentStaff.department, {
        $inc: { totalStaff: -1 },
      });
      await Department.findByIdAndUpdate(updates.department, {
        $inc: { totalStaff: 1 },
      });
    }
  }

  // Handle employment status change
  if (updates.employmentStatus && updates.employmentStatus !== currentStaff.employmentStatus) {
    const oldStatus = currentStaff.employmentStatus;
    const newStatus = updates.employmentStatus;

    if (oldStatus === 'active' && newStatus !== 'active') {
      await Department.findByIdAndUpdate(currentStaff.department, {
        $inc: { totalStaff: -1 },
      });
    } else if (oldStatus !== 'active' && newStatus === 'active') {
      await Department.findByIdAndUpdate(currentStaff.department, {
        $inc: { totalStaff: 1 },
      });
    }
  }

  const staff = await Staff.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true })
    .populate('department', 'departmentName departmentCode')
    .populate('shift', 'shiftName startTime endTime');

  return res.status(200).json(new ApiResponse(200, staff, 'Staff member updated successfully'));
});

/**
 * Delete staff member (soft delete - change status to terminated)
 * DELETE /api/v1/staff/:id
 */
export const deleteStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const staff = await Staff.findById(id);
  if (!staff) {
    throw new ApiError(404, 'Staff member not found');
  }

  const wasActive = staff.employmentStatus === 'active';

  staff.employmentStatus = 'terminated';
  await staff.save();

  // ✅ Only decrement if staff was active
  if (wasActive) {
    await Department.findByIdAndUpdate(staff.department, {
      $inc: { totalStaff: -1 },
    });
  }

  return res.status(200).json(new ApiResponse(200, staff, 'Staff member terminated successfully'));
});

/**
 * Get staff by department
 * GET /api/v1/staff/department/:departmentId
 */
export const getStaffByDepartment = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;
  const { employmentStatus = 'active' } = req.query;

  const department = await Department.findById(departmentId);
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  const staff = await Staff.find({
    department: departmentId,
    employmentStatus,
  })
    .populate('shift', 'shiftName')
    .sort({ role: 1, name: 1 });

  const staffByRole = staff.reduce((acc, member) => {
    if (!acc[member.role]) {
      acc[member.role] = [];
    }
    acc[member.role].push(member);
    return acc;
  }, {});

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        department: {
          _id: department._id,
          name: department.departmentName,
          code: department.departmentCode,
        },
        totalCount: staff.length,
        staffByRole,
        allStaff: staff,
      },
      'Department staff fetched successfully'
    )
  );
});

/**
 * Get staff statistics
 * GET /api/v1/staff/stats/overview
 */
export const getStaffStats = asyncHandler(async (req, res) => {
  const [
    totalStaff,
    activeStaff,
    onLeave,
    byDepartment,
    byRole,
    byCareerLevel,
  ] = await Promise.all([
    Staff.countDocuments(),
    Staff.countDocuments({ employmentStatus: 'active' }),
    Staff.countDocuments({ employmentStatus: 'on-leave' }),
    Staff.aggregate([
      { $match: { employmentStatus: 'active' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department',
        },
      },
      { $unwind: '$department' },
      {
        $project: {
          _id: 0,
          departmentName: '$department.departmentName',
          departmentCode: '$department.departmentCode',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]),
    Staff.aggregate([
      { $match: { employmentStatus: 'active' } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Staff.aggregate([
      { $match: { employmentStatus: 'active' } },
      { $group: { _id: '$careerLevel', count: { $sum: 1 } } },
    ]),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalStaff,
        activeStaff,
        onLeave,
        terminated: totalStaff - activeStaff - onLeave,
        byDepartment,
        topRoles: byRole,
        byCareerLevel,
      },
      'Staff statistics fetched successfully'
    )
  );
});

/**
 * Bulk import staff
 * POST /api/v1/staff/bulk-import
 */
export const bulkImportStaff = asyncHandler(async (req, res) => {
  const { staffList } = req.body;

  if (!Array.isArray(staffList) || staffList.length === 0) {
    throw new ApiError(400, 'Staff list is required and must be an array');
  }

  // ✅ Validate all staff have required fields including baseSalary
  const errors = [];
  staffList.forEach((staff, index) => {
    if (!staff.name || !staff.employeeId || !staff.role || !staff.department || !staff.baseSalary) {
      errors.push(`Staff at index ${index} is missing required fields (name, employeeId, role, department, baseSalary)`);
    }
    if (staff.baseSalary && staff.baseSalary <= 0) {
      errors.push(`Staff at index ${index} has invalid baseSalary: ${staff.baseSalary}`);
    }
  });

  if (errors.length > 0) {
    throw new ApiError(400, errors.join('; '));
  }

  // Check for duplicate employee IDs
  const employeeIds = staffList.map(s => s.employeeId.toUpperCase());
  const duplicates = employeeIds.filter((id, index) => employeeIds.indexOf(id) !== index);
  if (duplicates.length > 0) {
    throw new ApiError(400, `Duplicate employee IDs found: ${[...new Set(duplicates)].join(', ')}`);
  }

  // Check if IDs already exist in database
  const existingStaff = await Staff.find({ employeeId: { $in: employeeIds } }).select('employeeId');
  if (existingStaff.length > 0) {
    const existingIds = existingStaff.map(s => s.employeeId);
    throw new ApiError(409, `Employee IDs already exist: ${existingIds.join(', ')}`);
  }

  // Verify departments exist
  const departmentIds = [...new Set(staffList.map(s => s.department))];
  const departments = await Department.find({ _id: { $in: departmentIds } });

  if (departments.length !== departmentIds.length) {
    throw new ApiError(404, 'One or more departments not found');
  }

  // Insert staff
  const insertedStaff = await Staff.insertMany(
    staffList.map(staff => ({
      ...staff,
      employeeId: staff.employeeId.toUpperCase(),
    }))
  );

  // ✅ Update department counts (only active staff)
  const activeStaffByDept = insertedStaff
    .filter(s => s.employmentStatus === 'active')
    .reduce((acc, staff) => {
      const deptId = staff.department.toString();
      acc[deptId] = (acc[deptId] || 0) + 1;
      return acc;
    }, {});

  await Promise.all(
    Object.entries(activeStaffByDept).map(([deptId, count]) =>
      Department.findByIdAndUpdate(deptId, { $inc: { totalStaff: count } })
    )
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        count: insertedStaff.length,
        activeCount: insertedStaff.filter(s => s.employmentStatus === 'active').length,
        staff: insertedStaff,
      },
      `${insertedStaff.length} staff members imported successfully`
    )
  );
});