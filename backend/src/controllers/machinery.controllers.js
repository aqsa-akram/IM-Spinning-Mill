// src/controllers/machinery.controllers.js
import { Machinery } from '../models/machinery.model.js';
import { MaintenanceLog } from '../models/maintenanceLog.model.js';
import { Department } from '../models/department.model.js';
import { Finance } from '../models/finance.model.js'; // Added Finance Import
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Create new machinery
 * POST /api/v1/machinery
 */
export const createMachinery = asyncHandler(async (req, res) => {
  const {
    machineName,
    machineCode,
    model,
    manufacturer,
    yearOfManufacture,
    department,
    quantity,
    maintenanceStatus,
    specifications,
    lastMaintenanceDate,
    maintenanceInterval,
    purchaseDate,
    purchaseCost,
    supplier,
    assignedOperator,
    notes,
  } = req.body;

  // Verify department exists
  const deptExists = await Department.findById(department);
  if (!deptExists) {
    throw new ApiError(404, 'Department not found');
  }

  // Check if machine code already exists (if provided)
  if (machineCode) {
    const existingMachine = await Machinery.findOne({ machineCode });
    if (existingMachine) {
      throw new ApiError(409, 'Machine with this code already exists');
    }
  }

  // Calculate next maintenance date
  let nextMaintenanceDate;
  if (lastMaintenanceDate && maintenanceInterval) {
    const lastDate = new Date(lastMaintenanceDate);
    nextMaintenanceDate = new Date(
      lastDate.getTime() + maintenanceInterval * 24 * 60 * 60 * 1000
    );
  }

  // Create machinery
  const machinery = await Machinery.create({
    machineName,
    machineCode: machineCode?.toUpperCase(),
    model,
    manufacturer,
    yearOfManufacture,
    department,
    quantity,
    maintenanceStatus,
    specifications,
    lastMaintenanceDate,
    nextMaintenanceDate,
    maintenanceInterval,
    purchaseDate,
    purchaseCost,
    supplier,
    assignedOperator,
    notes,
  });

  const createdMachinery = await Machinery.findById(machinery._id)
    .populate('department', 'departmentName departmentCode')
    .populate('assignedOperator', 'name employeeId role');

  return res
    .status(201)
    .json(
      new ApiResponse(201, createdMachinery, 'Machinery created successfully')
    );
});

/**
 * Get all machinery
 * GET /api/v1/machinery
 */
export const getAllMachinery = asyncHandler(async (req, res) => {
  const {
    department,
    maintenanceStatus,
    manufacturer,
    isActive = 'true',
    page = 1,
    limit = 20,
    search,
  } = req.query;

  // Build filter
  const filter = {};
  if (department) filter.department = department;
  if (maintenanceStatus) filter.maintenanceStatus = maintenanceStatus;
  if (manufacturer) filter.manufacturer = new RegExp(manufacturer, 'i');
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  // Search by name, code, or model
  if (search) {
    filter.$or = [
      { machineName: { $regex: search, $options: 'i' } },
      { machineCode: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
    ];
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [machinery, totalCount] = await Promise.all([
    Machinery.find(filter)
      .populate('department', 'departmentName departmentCode')
      .populate('assignedOperator', 'name employeeId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ department: 1, machineName: 1 }),
    Machinery.countDocuments(filter),
  ]);

  // Check maintenance due status for each machine
  const machineryWithStatus = machinery.map((machine) => ({
    ...machine.toObject(),
    isMaintenanceDue: machine.isMaintenanceDue,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        machinery: machineryWithStatus,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit),
        },
      },
      'Machinery fetched successfully'
    )
  );
});

/**
 * Get machinery by ID
 * GET /api/v1/machinery/:id
 */
export const getMachineryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const machinery = await Machinery.findById(id)
    .populate('department', 'departmentName departmentCode departmentType')
    .populate('assignedOperator', 'name employeeId role contactInfo');

  if (!machinery) {
    throw new ApiError(404, 'Machinery not found');
  }

  // Get maintenance history
  const maintenanceHistory = await MaintenanceLog.find({
    machine: id,
  })
    .populate('performedBy', 'name employeeId')
    .sort({ maintenanceDate: -1 })
    .limit(10);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...machinery.toObject(),
        isMaintenanceDue: machinery.isMaintenanceDue,
        maintenanceHistory,
      },
      'Machinery details fetched successfully'
    )
  );
});

/**
 * Update machinery
 * PATCH /api/v1/machinery/:id
 */
export const updateMachinery = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Remove fields that shouldn't be updated directly
  delete updates._id;
  delete updates.createdAt;

  // If maintenance completed, update next maintenance date
  if (updates.lastMaintenanceDate) {
    const machinery = await Machinery.findById(id);
    if (machinery && machinery.maintenanceInterval) {
      const lastDate = new Date(updates.lastMaintenanceDate);
      updates.nextMaintenanceDate = new Date(
        lastDate.getTime() +
          machinery.maintenanceInterval * 24 * 60 * 60 * 1000
      );
    }
  }

  const machinery = await Machinery.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate('department', 'departmentName departmentCode')
    .populate('assignedOperator', 'name employeeId');

  if (!machinery) {
    throw new ApiError(404, 'Machinery not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, machinery, 'Machinery updated successfully'));
});

/**
 * Delete machinery (soft delete)
 * DELETE /api/v1/machinery/:id
 */
export const deleteMachinery = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const machinery = await Machinery.findByIdAndUpdate(
    id,
    { $set: { isActive: false } },
    { new: true }
  );

  if (!machinery) {
    throw new ApiError(404, 'Machinery not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, machinery, 'Machinery deactivated successfully')
    );
});

/**
 * Get machinery by department
 * GET /api/v1/machinery/department/:departmentId
 */
export const getMachineryByDepartment = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;
  const { maintenanceStatus } = req.query;

  // Verify department exists
  const department = await Department.findById(departmentId);
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  const filter = {
    department: departmentId,
    isActive: true,
  };

  if (maintenanceStatus) {
    filter.maintenanceStatus = maintenanceStatus;
  }

  const machinery = await Machinery.find(filter)
    .populate('assignedOperator', 'name employeeId')
    .sort({ machineName: 1 });

  // Group by status
  const machineryByStatus = machinery.reduce((acc, machine) => {
    const status = machine.maintenanceStatus;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(machine);
    return acc;
  }, {});

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        department: {
          _id: department._id,
          departmentName: department.departmentName,
          departmentCode: department.departmentCode,
        },
        totalCount: machinery.length,
        machineryByStatus,
        allMachinery: machinery,
      },
      'Department machinery fetched successfully'
    )
  );
});

/**
 * Log maintenance
 * POST /api/v1/machinery/maintenance
 */
export const logMaintenance = asyncHandler(async (req, res) => {
  const {
    machineId,
    maintenanceType,
    description,
    cost,
    performedBy,
    partsReplaced,
    priority,
    notes,
  } = req.body;

  // Verify machine exists
  const machine = await Machinery.findById(machineId);
  if (!machine) {
    throw new ApiError(404, 'Machine not found');
  }

  // Create maintenance log
  const maintenanceLog = await MaintenanceLog.create({
    machine: machineId,
    maintenanceType,
    description,
    maintenanceDate: new Date(),
    performedBy,
    cost,
    partsReplaced,
    priority,
    notes,
    status: 'in-progress',
  });

  // Update machine status
  machine.maintenanceStatus = 'under-maintenance';
  machine.lastMaintenanceDate = new Date();
  await machine.save();

  const createdLog = await MaintenanceLog.findById(maintenanceLog._id)
    .populate('machine', 'machineName machineCode')
    .populate('performedBy', 'name employeeId');

  return res
    .status(201)
    .json(
      new ApiResponse(201, createdLog, 'Maintenance logged successfully')
    );
});

/**
 * Complete maintenance & Create Finance Entry
 * PATCH /api/v1/machinery/maintenance/:logId/complete
 */
export const completeMaintenance = asyncHandler(async (req, res) => {
  const { logId } = req.params;
  const { notes, finalCost } = req.body; // Added finalCost to allow cost updates

  const maintenanceLog = await MaintenanceLog.findById(logId);
  if (!maintenanceLog) {
    throw new ApiError(404, 'Maintenance log not found');
  }

  // Check if it was already completed to prevent double finance entries
  if (maintenanceLog.status === 'completed') {
    throw new ApiError(400, 'Maintenance is already completed');
  }

  // Update log details
  maintenanceLog.status = 'completed';
  maintenanceLog.completionDate = new Date();
  
  if (notes) maintenanceLog.notes = notes;
  
  // If user provides a final cost, update it. Otherwise keep the original cost.
  if (finalCost !== undefined) {
    maintenanceLog.cost = finalCost;
  }

  await maintenanceLog.save();

  // Update machine status
  const machine = await Machinery.findById(maintenanceLog.machine);
  if (machine) {
    machine.maintenanceStatus = 'operational';
    machine.lastMaintenanceDate = new Date();

    if (machine.maintenanceInterval) {
      machine.nextMaintenanceDate = new Date(
        Date.now() + machine.maintenanceInterval * 24 * 60 * 60 * 1000
      );
    }
    await machine.save();
  }

  // ==========================================
  // 💰 FINANCE INTEGRATION START
  // ==========================================
  if (maintenanceLog.cost > 0) {
    try {
      await Finance.create({
        amount: maintenanceLog.cost,
        type: 'EXPENSE',
        category: 'MAINTENANCE',
        referenceId: maintenanceLog._id,
        onModel: 'MaintenanceLog',
        status: 'cleared', // Assuming completed maintenance is paid/cleared
        paymentMethod: 'cash', // Default or you can add this to req.body
        description: `Maintenance Cost for ${machine ? machine.machineName : 'Machine'} (${maintenanceLog.maintenanceType})`,
        transactionDate: new Date(),
        // recordedBy: req.user._id // Optional: Use if you have user context
      });
      console.log(`✅ Finance entry created for Maintenance Log ${maintenanceLog._id}`);
    } catch (error) {
      console.error('❌ Failed to create finance entry for maintenance:', error);
      // We don't throw error here to avoid rolling back the completion status
    }
  }
  // ==========================================
  // 💰 FINANCE INTEGRATION END
  // ==========================================

  const updatedLog = await MaintenanceLog.findById(logId)
    .populate('machine', 'machineName machineCode')
    .populate('performedBy', 'name employeeId');

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedLog, 'Maintenance completed and finance recorded successfully')
    );
});

/**
 * Get machinery statistics
 * GET /api/v1/machinery/stats/overview
 */
export const getMachineryStats = asyncHandler(async (req, res) => {
  const [
    totalMachinery,
    activeMachinery,
    byStatus,
    byDepartment,
    maintenanceDue,
    recentMaintenance,
  ] = await Promise.all([
    Machinery.countDocuments(),
    Machinery.countDocuments({ isActive: true }),
    Machinery.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$maintenanceStatus',
          count: { $sum: 1 },
        },
      },
    ]),
    Machinery.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
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
          machineCount: '$count',
          totalQuantity: 1,
        },
      },
      { $sort: { machineCount: -1 } },
    ]),
    Machinery.countDocuments({
      isActive: true,
      nextMaintenanceDate: { $lte: new Date() },
    }),
    MaintenanceLog.find({ status: { $in: ['in-progress', 'scheduled'] } })
      .populate('machine', 'machineName machineCode')
      .populate('performedBy', 'name employeeId')
      .sort({ maintenanceDate: -1 })
      .limit(5),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalMachinery,
        activeMachinery,
        inactiveMachinery: totalMachinery - activeMachinery,
        maintenanceDue,
        byStatus,
        byDepartment,
        recentMaintenance,
      },
      'Machinery statistics fetched successfully'
    )
  );
});

/**
 * Get maintenance history
 * GET /api/v1/machinery/:id/maintenance-history
 */
export const getMaintenanceHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Verify machine exists
  const machine = await Machinery.findById(id);
  if (!machine) {
    throw new ApiError(404, 'Machine not found');
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [history, totalCount] = await Promise.all([
    MaintenanceLog.find({ machine: id })
      .populate('performedBy', 'name employeeId role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ maintenanceDate: -1 }),
    MaintenanceLog.countDocuments({ machine: id }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        machine: {
          _id: machine._id,
          machineName: machine.machineName,
          machineCode: machine.machineCode,
        },
        history,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit),
        },
      },
      'Maintenance history fetched successfully'
    )
  );
});