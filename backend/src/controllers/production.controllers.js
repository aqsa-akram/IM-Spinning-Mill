// src/controllers/production.controllers.js
import { Production } from '../models/production.model.js';
import { RawMaterial } from '../models/rawMaterial.model.js';
import { Product } from '../models/product.model.js';
import { Finance } from '../models/finance.model.js'; // Added Finance
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Create new production record & Record Cost of Goods Manufactured
 * POST /api/v1/production
 */
export const createProduction = asyncHandler(async (req, res) => {
  const {
    productionDate,
    department,
    product,
    shift,
    machine,
    operator,
    quantityProduced,
    unit,
    targetQuantity,
    rawMaterialsUsed,
    qualityGrade,
    defectQuantity,
    startTime,
    endTime,
    downtime,
    downtimeReason,
    batchNumber,
    notes,
  } = req.body;

  // 1. Initialize total cost (This was likely missing)
  let totalMaterialCost = 0;

  // Deduct raw materials from stock
  if (rawMaterialsUsed && rawMaterialsUsed.length > 0) {
    for (const item of rawMaterialsUsed) {
      const material = await RawMaterial.findById(item.material);
      if (!material) {
        throw new ApiError(404, `Material ${item.material} not found`);
      }

      if (material.stockQuantity < item.quantityUsed) {
        throw new ApiError(
          400,
          `Insufficient stock for ${material.materialName}. Available: ${material.stockQuantity}`
        );
      }

      // 2. Calculate Cost (This was likely missing)
      const costForMaterial = item.quantityUsed * (material.unitPrice || 0);
      totalMaterialCost += costForMaterial;

      material.stockQuantity -= item.quantityUsed;
      await material.save();
    }
  }

  // Update product stock
  await Product.findByIdAndUpdate(product, {
    $inc: { stockQuantity: quantityProduced - (defectQuantity || 0) },
  });

  const production = await Production.create({
    productionDate,
    department,
    product,
    shift,
    machine,
    operator,
    quantityProduced,
    unit,
    targetQuantity,
    rawMaterialsUsed,
    qualityGrade,
    defectQuantity,
    startTime,
    endTime,
    downtime,
    downtimeReason,
    batchNumber,
    notes,
    approvedBy: req.user._id,
  });

  // ==========================================
  // 3. FINANCE ENTRY CREATION (This was likely missing)
  // ==========================================
  if (totalMaterialCost > 0) {
    try {
      await Finance.create({
        amount: totalMaterialCost,
        type: 'EXPENSE',
        category: 'PRODUCTION',
        referenceId: production._id,
        onModel: 'Production',
        status: 'cleared',
        paymentMethod: 'credit', // Internal consumption
        description: `Production Cost (Materials) for Batch: ${batchNumber || 'N/A'}`,
        transactionDate: new Date(),
        // recordedBy: req.user._id
      });
      console.log(`✅ Finance entry created: ${totalMaterialCost}`);
    } catch (error) {
      console.error('❌ Failed to create finance entry:', error);
    }
  }

  const createdProduction = await Production.findById(production._id)
    .populate('department', 'departmentName departmentCode')
    .populate('product', 'productName productCode')
    .populate('shift', 'shiftName')
    .populate('machine', 'machineName machineCode')
    .populate('operator', 'name employeeId')
    .populate('rawMaterialsUsed.material', 'materialName materialCode unitPrice');

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdProduction,
        'Production record created and cost recorded successfully'
      )
    );
});

// ... [Keep getAllProduction, getProductionById, etc. exactly as they were] ...
// (I will include the rest of the file content below for copy-paste convenience)

export const getAllProduction = asyncHandler(async (req, res) => {
  const {
    department,
    product,
    shift,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {};
  if (department) filter.department = department;
  if (product) filter.product = product;
  if (shift) filter.shift = shift;
  if (status) filter.status = status;

  if (startDate || endDate) {
    filter.productionDate = {};
    if (startDate) filter.productionDate.$gte = new Date(startDate);
    if (endDate) filter.productionDate.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [records, totalCount] = await Promise.all([
    Production.find(filter)
      .populate('department', 'departmentName')
      .populate('product', 'productName productCode')
      .populate('shift', 'shiftName')
      .populate('operator', 'name employeeId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ productionDate: -1 }),
    Production.countDocuments(filter),
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
      'Production records fetched successfully'
    )
  );
});

export const getProductionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const production = await Production.findById(id)
    .populate('department', 'departmentName departmentCode')
    .populate('product', 'productName productCode threadCount')
    .populate('shift', 'shiftName startTime endTime')
    .populate('machine', 'machineName machineCode maintenanceStatus')
    .populate('operator', 'name employeeId role')
    .populate('rawMaterialsUsed.material', 'materialName materialCode unit')
    .populate('approvedBy', 'username fullName');

  if (!production) {
    throw new ApiError(404, 'Production record not found');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...production.toObject(),
        netProduction: production.netProduction,
        achievementPercentage: production.achievementPercentage,
      },
      'Production record fetched successfully'
    )
  );
});

export const updateProduction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  delete updates._id;
  delete updates.createdAt;

  const production = await Production.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate('department', 'departmentName')
    .populate('product', 'productName')
    .populate('operator', 'name employeeId');

  if (!production) {
    throw new ApiError(404, 'Production record not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, production, 'Production record updated successfully')
    );
});

export const getProductionStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.productionDate = {};
    if (startDate) dateFilter.productionDate.$gte = new Date(startDate);
    if (endDate) dateFilter.productionDate.$lte = new Date(endDate);
  }

  const [
    totalRecords,
    totalProduction,
    byDepartment,
    byProduct,
    byQuality,
    efficiency,
  ] = await Promise.all([
    Production.countDocuments(dateFilter),
    Production.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          total: { $sum: '$quantityProduced' },
          defects: { $sum: '$defectQuantity' },
          avgEfficiency: { $avg: '$efficiency' },
        },
      },
    ]),
    Production.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$department',
          totalProduction: { $sum: '$quantityProduced' },
          recordCount: { $sum: 1 },
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
          departmentName: '$department.departmentName',
          totalProduction: 1,
          recordCount: 1,
        },
      },
      { $sort: { totalProduction: -1 } },
    ]),
    Production.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$product',
          totalProduction: { $sum: '$quantityProduced' },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.productName',
          totalProduction: 1,
        },
      },
      { $sort: { totalProduction: -1 } },
      { $limit: 10 },
    ]),
    Production.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$qualityGrade',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantityProduced' },
        },
      },
    ]),
    Production.aggregate([
      { $match: { ...dateFilter, targetQuantity: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avgEfficiency: { $avg: '$efficiency' },
          avgDowntime: { $avg: '$downtime' },
        },
      },
    ]),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalRecords,
        totalProduction: totalProduction[0] || {
          total: 0,
          defects: 0,
          avgEfficiency: 0,
        },
        byDepartment,
        byProduct,
        byQuality,
        efficiency: efficiency[0] || { avgEfficiency: 0, avgDowntime: 0 },
      },
      'Production statistics fetched successfully'
    )
  );
});

export const getDailyProductionReport = asyncHandler(async (req, res) => {
  const { date } = req.query;

  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const report = await Production.aggregate([
    {
      $match: {
        productionDate: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: '$department',
        totalProduction: { $sum: '$quantityProduced' },
        totalDefects: { $sum: '$defectQuantity' },
        avgEfficiency: { $avg: '$efficiency' },
        recordCount: { $sum: 1 },
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
        departmentName: '$department.departmentName',
        departmentCode: '$department.departmentCode',
        totalProduction: 1,
        totalDefects: 1,
        avgEfficiency: 1,
        recordCount: 1,
      },
    },
    { $sort: { totalProduction: -1 } },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        date: targetDate.toISOString().split('T')[0],
        report,
      },
      'Daily production report fetched successfully'
    )
  );
});