// src/controllers/supplier.controllers.js
import { Supplier } from '../models/supplier.model.js';
import { Purchase } from '../models/purchase.model.js';
import { Finance } from '../models/finance.model.js'; // Added Finance
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Create new supplier
 * POST /api/v1/suppliers
 */
export const createSupplier = asyncHandler(async (req, res) => {
  const {
    supplierName,
    supplierCode,
    contactPerson,
    address,
    phone,
    email,
    website,
    materialTypes,
    paymentTerms,
    creditLimit,
    taxId,
    ntn,
    rating,
    contractStartDate,
    contractEndDate,
    notes,
  } = req.body;

  // Check if supplier code exists
  if (supplierCode) {
    const existing = await Supplier.findOne({ supplierCode });
    if (existing) {
      throw new ApiError(409, 'Supplier with this code already exists');
    }
  }

  const supplier = await Supplier.create({
    supplierName,
    supplierCode: supplierCode?.toUpperCase(),
    contactPerson,
    address,
    phone,
    email,
    website,
    materialTypes,
    paymentTerms,
    creditLimit,
    taxId,
    ntn,
    rating,
    contractStartDate,
    contractEndDate,
    notes,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, supplier, 'Supplier created successfully'));
});

/**
 * Get all suppliers
 * GET /api/v1/suppliers
 */
export const getAllSuppliers = asyncHandler(async (req, res) => {
  const {
    isActive = 'true',
    materialType,
    page = 1,
    limit = 20,
    search,
  } = req.query;

  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (materialType) filter.materialTypes = materialType;

  if (search) {
    filter.$or = [
      { supplierName: { $regex: search, $options: 'i' } },
      { supplierCode: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [suppliers, totalCount] = await Promise.all([
    Supplier.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ supplierName: 1 }),
    Supplier.countDocuments(filter),
  ]);

  const suppliersWithCredit = suppliers.map((supplier) => ({
    ...supplier.toObject(),
    availableCredit: supplier.availableCredit,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        suppliers: suppliersWithCredit,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit),
        },
      },
      'Suppliers fetched successfully'
    )
  );
});

/**
 * Get supplier by ID
 * GET /api/v1/suppliers/:id
 */
export const getSupplierById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const supplier = await Supplier.findById(id).populate(
    'materialsSupplied',
    'materialName materialCode'
  );

  if (!supplier) {
    throw new ApiError(404, 'Supplier not found');
  }

  // Get purchase history
  const purchases = await Purchase.find({ supplier: id })
    .sort({ orderDate: -1 })
    .limit(10)
    .select('purchaseOrderNumber orderDate totalAmount status');

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...supplier.toObject(),
        availableCredit: supplier.availableCredit,
        recentPurchases: purchases,
      },
      'Supplier fetched successfully'
    )
  );
});

/**
 * Update supplier
 * PATCH /api/v1/suppliers/:id
 */
export const updateSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  delete updates._id;
  delete updates.createdAt;

  const supplier = await Supplier.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!supplier) {
    throw new ApiError(404, 'Supplier not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, supplier, 'Supplier updated successfully'));
});

/**
 * Delete supplier (soft delete)
 * DELETE /api/v1/suppliers/:id
 */
export const deleteSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check for pending purchases
  const pendingPurchases = await Purchase.countDocuments({
    supplier: id,
    status: { $in: ['pending', 'confirmed'] },
  });

  if (pendingPurchases > 0) {
    throw new ApiError(
      400,
      `Cannot delete supplier. ${pendingPurchases} pending purchase orders exist.`
    );
  }

  const supplier = await Supplier.findByIdAndUpdate(
    id,
    { $set: { isActive: false } },
    { new: true }
  );

  if (!supplier) {
    throw new ApiError(404, 'Supplier not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, supplier, 'Supplier deactivated successfully'));
});

/**
 * Get supplier statistics
 * GET /api/v1/suppliers/stats/overview
 */
export const getSupplierStats = asyncHandler(async (req, res) => {
  const [totalSuppliers, activeSuppliers, byMaterialType, topSuppliers] =
    await Promise.all([
      Supplier.countDocuments(),
      Supplier.countDocuments({ isActive: true }),
      Supplier.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$materialTypes' },
        {
          $group: {
            _id: '$materialTypes',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Purchase.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: '$supplier',
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
        {
          $lookup: {
            from: 'suppliers',
            localField: '_id',
            foreignField: '_id',
            as: 'supplier',
          },
        },
        { $unwind: '$supplier' },
        {
          $project: {
            supplierName: '$supplier.supplierName',
            supplierCode: '$supplier.supplierCode',
            totalOrders: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 },
      ]),
    ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalSuppliers,
        activeSuppliers,
        inactiveSuppliers: totalSuppliers - activeSuppliers,
        byMaterialType,
        topSuppliers,
      },
      'Supplier statistics fetched successfully'
    )
  );
});

/**
 * Pay Supplier (Reduces Balance + Creates Finance Entry)
 * POST /api/v1/suppliers/:id/pay
 */
export const paySupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, paymentMethod, notes, transactionDate } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, 'Valid payment amount is required');
  }

  const supplier = await Supplier.findById(id);
  if (!supplier) {
    throw new ApiError(404, 'Supplier not found');
  }

  // 1. Decrease Supplier Balance
  supplier.currentBalance = (supplier.currentBalance || 0) - amount;
  await supplier.save();

  // 2. Create Finance Entry
  const financeEntry = await Finance.create({
    amount,
    type: 'EXPENSE',
    category: 'SUPPLIER',
    referenceId: supplier._id,
    onModel: 'Supplier',
    status: 'cleared',
    paymentMethod: paymentMethod || 'bank-transfer',
    description: `Payment to Supplier: ${supplier.supplierName} ${notes ? `(${notes})` : ''}`,
    transactionDate: transactionDate || new Date(),
    recordedBy: req.user._id
  });

  return res.status(200).json(
    new ApiResponse(
      200, 
      { 
        supplierBalance: supplier.currentBalance,
        financeId: financeEntry._id 
      }, 
      'Payment recorded successfully'
    )
  );
});