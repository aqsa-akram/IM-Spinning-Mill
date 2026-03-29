// src/controllers/rawMaterial.controllers.js
import { RawMaterial } from '../models/rawMaterial.model.js';
import { Finance } from '../models/finance.model.js'; // Added Finance
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

// ... [Keep createRawMaterial, getAllRawMaterials, getRawMaterialById as they were] ...

export const createRawMaterial = asyncHandler(async (req, res) => {
  const {
    materialName,
    materialCode,
    materialType,
    description,
    unit,
    stockQuantity,
    reorderLevel,
    maxStockLevel,
    unitPrice,
    currency,
    supplier,
    location,
    specifications,
  } = req.body;

  if (materialCode) {
    const existing = await RawMaterial.findOne({ materialCode });
    if (existing) {
      throw new ApiError(409, 'Material with this code already exists');
    }
  }

  const material = await RawMaterial.create({
    materialName,
    materialCode: materialCode?.toUpperCase(),
    materialType,
    description,
    unit,
    stockQuantity,
    reorderLevel,
    maxStockLevel,
    unitPrice,
    currency,
    supplier,
    location,
    specifications,
    lastPurchaseDate: new Date(),
    lastPurchasePrice: unitPrice,
  });

  const createdMaterial = await RawMaterial.findById(material._id).populate(
    'supplier',
    'supplierName supplierCode'
  );

  return res
    .status(201)
    .json(
      new ApiResponse(201, createdMaterial, 'Raw material created successfully')
    );
});

export const getAllRawMaterials = asyncHandler(async (req, res) => {
  const {
    materialType,
    supplier,
    needsReorder,
    isActive = 'true',
    page = 1,
    limit = 20,
    search,
  } = req.query;

  const filter = {};
  if (materialType) filter.materialType = materialType;
  if (supplier) filter.supplier = supplier;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  if (needsReorder === 'true') {
    filter.$expr = { $lte: ['$stockQuantity', '$reorderLevel'] };
  }

  if (search) {
    filter.$or = [
      { materialName: { $regex: search, $options: 'i' } },
      { materialCode: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [materials, totalCount] = await Promise.all([
    RawMaterial.find(filter)
      .populate('supplier', 'supplierName supplierCode contactPerson')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ materialType: 1, materialName: 1 }),
    RawMaterial.countDocuments(filter),
  ]);

  const materialsWithStatus = materials.map((material) => ({
    ...material.toObject(),
    needsReorder: material.needsReorder,
    stockStatus: material.stockStatus,
    stockValue: material.stockValue,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        materials: materialsWithStatus,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit),
        },
      },
      'Raw materials fetched successfully'
    )
  );
});

export const getRawMaterialById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const material = await RawMaterial.findById(id).populate(
    'supplier',
    'supplierName supplierCode contactPerson phone email'
  );

  if (!material) {
    throw new ApiError(404, 'Raw material not found');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...material.toObject(),
        needsReorder: material.needsReorder,
        stockStatus: material.stockStatus,
        stockValue: material.stockValue,
      },
      'Raw material fetched successfully'
    )
  );
});

export const updateRawMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  delete updates._id;
  delete updates.createdAt;

  const material = await RawMaterial.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('supplier', 'supplierName supplierCode');

  if (!material) {
    throw new ApiError(404, 'Raw material not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, material, 'Raw material updated successfully'));
});

export const deleteRawMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const material = await RawMaterial.findByIdAndUpdate(
    id,
    { $set: { isActive: false } },
    { new: true }
  );

  if (!material) {
    throw new ApiError(404, 'Raw material not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, material, 'Raw material deactivated successfully')
    );
});

/**
 * Update stock quantity & Record Finance Entry
 * PATCH /api/v1/raw-materials/:id/stock
 */
export const updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, type, reason } = req.body;

  const material = await RawMaterial.findById(id);
  if (!material) {
    throw new ApiError(404, 'Raw material not found');
  }

  let newQuantity;
  let financeAmount = 0;
  
  switch (type) {
    case 'add':
      newQuantity = material.stockQuantity + quantity;
      financeAmount = quantity * material.unitPrice; // Cost of adding stock
      break;
    case 'remove':
      newQuantity = material.stockQuantity - quantity;
      if (newQuantity < 0) {
        throw new ApiError(400, 'Insufficient stock quantity');
      }
      financeAmount = quantity * material.unitPrice; // Cost of removing/loss
      break;
    case 'set':
      newQuantity = quantity;
      // 'set' is ambiguous for finance calculation, so we might skip or calculate diff
      break;
    default:
      throw new ApiError(400, 'Invalid transaction type');
  }

  material.stockQuantity = newQuantity;
  await material.save();

  // ==========================================
  // 💰 FINANCE INTEGRATION (Manual Stock Update)
  // ==========================================
  if (financeAmount > 0 && type !== 'set') {
    try {
      await Finance.create({
        amount: financeAmount,
        type: 'EXPENSE',
        category: 'RAWMATERIAL',
        referenceId: material._id,
        onModel: 'RawMaterial',
        status: 'cleared',
        paymentMethod: 'cash', // Assumed for manual update
        description: `Manual Stock Update (${type.toUpperCase()}): ${reason || 'Adjustment'}`,
        transactionDate: new Date(),
        // recordedBy: req.user._id
      });
      console.log(`✅ Finance entry created for Raw Material ${type}: ${financeAmount}`);
    } catch (error) {
      console.error('❌ Failed to create finance entry for raw material:', error);
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        material,
        previousQuantity: type === 'add' ? newQuantity - quantity : newQuantity + quantity,
        newQuantity: material.stockQuantity,
        transactionType: type,
        reason,
      },
      'Stock updated successfully'
    )
  );
});

export const getMaterialsNeedingReorder = asyncHandler(async (req, res) => {
  const materials = await RawMaterial.find({
    isActive: true,
    $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
  })
    .populate('supplier', 'supplierName supplierCode contactPerson phone')
    .sort({ stockQuantity: 1 });

  const materialsWithDetails = materials.map((material) => ({
    ...material.toObject(),
    quantityNeeded: material.reorderLevel - material.stockQuantity,
    stockStatus: material.stockStatus,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: materials.length,
        materials: materialsWithDetails,
      },
      'Materials needing reorder fetched successfully'
    )
  );
});

export const getRawMaterialStats = asyncHandler(async (req, res) => {
  const [
    totalMaterials,
    activeMaterials,
    needsReorder,
    outOfStock,
    byType,
    totalStockValue,
  ] = await Promise.all([
    RawMaterial.countDocuments(),
    RawMaterial.countDocuments({ isActive: true }),
    RawMaterial.countDocuments({
      isActive: true,
      $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
    }),
    RawMaterial.countDocuments({ stockQuantity: 0, isActive: true }),
    RawMaterial.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$materialType',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$stockQuantity' },
          totalValue: {
            $sum: { $multiply: ['$stockQuantity', '$unitPrice'] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]),
    RawMaterial.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$stockQuantity', '$unitPrice'] } },
        },
      },
    ]),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalMaterials,
        activeMaterials,
        needsReorder,
        outOfStock,
        byType,
        totalStockValue: totalStockValue[0]?.total || 0,
      },
      'Raw material statistics fetched successfully'
    )
  );
});