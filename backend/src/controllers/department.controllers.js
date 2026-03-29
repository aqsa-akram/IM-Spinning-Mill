// src/controllers/department.controllers.js
import { Department } from '../models/department.model.js';
import { Staff } from '../models/staff.model.js';
import { Machinery } from '../models/machinery.model.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';


/**
 * Create a new department
 * POST /api/v1/departments
 */
export const createDepartment = asyncHandler(async (req, res) => {
  const {
    departmentName,
    departmentCode,
    departmentType,
    sequenceOrder,
    description,
    responsibilities,
    shiftHours,
    dailyCapacity,
  } = req.body;

  // Validation
  if (!departmentName || !departmentCode || !departmentType) {
    throw new ApiError(400, 'Department name, code, and type are required');
  }

  // Check if department already exists
  const existingDepartment = await Department.findOne({
    $or: [{ departmentName }, { departmentCode }],
  });

  if (existingDepartment) {
    throw new ApiError(409, 'Department with this name or code already exists');
  }

  // Create department
  const department = await Department.create({
    departmentName,
    departmentCode: departmentCode.toUpperCase(),
    departmentType,
    sequenceOrder,
    description,
    responsibilities,
    shiftHours,
    dailyCapacity,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, department, 'Department created successfully'));
});

/**
 * Get all departments
 * GET /api/v1/departments
 */
export const getAllDepartments = asyncHandler(async (req, res) => {
  const { type, isActive, sortBy = 'sequenceOrder' } = req.query;

  // Build filter
  const filter = {};
  if (type) filter.departmentType = type;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  // Fetch departments
  const departments = await Department.find(filter)
    .populate('departmentHead', 'name employeeId role')
    .sort(sortBy)
    .lean();

  // Get staff count for each department
  const departmentsWithStats = await Promise.all(
    departments.map(async (dept) => {
      const staffCount = await Staff.countDocuments({ 
        department: dept._id,
        employmentStatus: 'active' 
      });
      const machineryCount = await Machinery.countDocuments({ 
        department: dept._id,
        isActive: true 
      });

      return {
        ...dept,
        staffCount,
        machineryCount,
      };
    })
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        departmentsWithStats,
        'Departments fetched successfully'
      )
    );
});

/**
 * Get department by ID
 * GET /api/v1/departments/:id
 */
export const getDepartmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const department = await Department.findById(id)
    .populate('departmentHead', 'name employeeId role contactInfo')
    .lean();

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  // Get detailed stats
  const [staffList, machineryList, staffCount, machineryCount] = await Promise.all([
    Staff.find({ department: id, employmentStatus: 'active' })
      .select('name employeeId role shift')
      .populate('shift', 'shiftName'),
    Machinery.find({ department: id, isActive: true })
      .select('machineName model maintenanceStatus'),
    Staff.countDocuments({ department: id, employmentStatus: 'active' }),
    Machinery.countDocuments({ department: id, isActive: true }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...department,
        staffCount,
        machineryCount,
        staff: staffList,
        machinery: machineryList,
      },
      'Department details fetched successfully'
    )
  );
});

/**
 * Update department
 * PATCH /api/v1/departments/:id
 */
export const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Remove fields that shouldn't be updated directly
  delete updates._id;
  delete updates.createdAt;

  const department = await Department.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('departmentHead', 'name employeeId');

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, department, 'Department updated successfully'));
});

/**
 * Delete department (soft delete)
 * DELETE /api/v1/departments/:id
 */
export const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if department has active staff
  const activeStaff = await Staff.countDocuments({
    department: id,
    employmentStatus: 'active',
  });

  if (activeStaff > 0) {
    throw new ApiError(
      400,
      `Cannot delete department. It has ${activeStaff} active staff members.`
    );
  }

  const department = await Department.findByIdAndUpdate(
    id,
    { $set: { isActive: false } },
    { new: true }
  );

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, department, 'Department deactivated successfully'));
});

/**
 * Get departments by type
 * GET /api/v1/departments/type/:type
 */
export const getDepartmentsByType = asyncHandler(async (req, res) => {
  const { type } = req.params;

  const validTypes = ['production', 'support', 'executive', 'administrative'];
  if (!validTypes.includes(type)) {
    throw new ApiError(400, `Invalid department type. Must be one of: ${validTypes.join(', ')}`);
  }

  const departments = await Department.find({ 
    departmentType: type,
    isActive: true 
  })
    .sort('sequenceOrder')
    .populate('departmentHead', 'name employeeId');

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        departments,
        `${type.charAt(0).toUpperCase() + type.slice(1)} departments fetched successfully`
      )
    );
});

/**
 * Get department statistics
 * GET /api/v1/departments/stats/overview
 */
export const getDepartmentStats = asyncHandler(async (req, res) => {
  const stats = await Department.aggregate([
    {
      $group: {
        _id: '$departmentType',
        count: { $sum: 1 },
        totalCapacity: { $sum: '$dailyCapacity' },
      },
    },
    {
      $project: {
        _id: 0,
        type: '$_id',
        count: 1,
        totalCapacity: 1,
      },
    },
  ]);

  const [totalDepartments, activeDepartments, totalStaff, totalMachinery] = await Promise.all([
    Department.countDocuments(),
    Department.countDocuments({ isActive: true }),
    Staff.countDocuments({ employmentStatus: 'active' }),
    Machinery.countDocuments({ isActive: true }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalDepartments,
        activeDepartments,
        totalStaff,
        totalMachinery,
        byType: stats,
      },
      'Department statistics fetched successfully'
    )
  );
});