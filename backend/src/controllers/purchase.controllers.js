// src/controllers/purchase.controllers.js
import { Purchase } from '../models/purchase.model.js';
import { RawMaterial } from '../models/rawMaterial.model.js';
import { Supplier } from '../models/supplier.model.js';
import { Finance } from '../models/finance.model.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Create new purchase order
 * POST /api/v1/purchases
 */
export const createPurchase = asyncHandler(async (req, res) => {
  const {
    purchaseOrderNumber,
    supplier,
    items,
    expectedDeliveryDate,
    taxAmount,
    shippingCost,
    discount,
    notes,
  } = req.body;

  // Verify supplier exists
  const supplierExists = await Supplier.findById(supplier);
  if (!supplierExists) {
    throw new ApiError(404, 'Supplier not found');
  }

  // Check if PO number exists
  const existingPO = await Purchase.findOne({ purchaseOrderNumber });
  if (existingPO) {
    throw new ApiError(409, 'Purchase order number already exists');
  }

  // Calculate item totals and verify materials
  const processedItems = await Promise.all(
    items.map(async (item) => {
      const material = await RawMaterial.findById(item.material);
      if (!material) {
        throw new ApiError(404, `Material ${item.material} not found`);
      }

      return {
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      };
    })
  );

  // Calculate totals using static method
  const { subtotal, totalAmount } = Purchase.calculateTotals(
    processedItems,
    taxAmount || 0,
    shippingCost || 0,
    discount || 0
  );

  // Create purchase with calculated totals
  const purchase = await Purchase.create({
    purchaseOrderNumber: purchaseOrderNumber.toUpperCase(),
    supplier,
    items: processedItems,
    expectedDeliveryDate,
    taxAmount: taxAmount || 0,
    shippingCost: shippingCost || 0,
    discount: discount || 0,
    subtotal,
    totalAmount,
    notes,
  });

  // Populate related data
  const createdPurchase = await Purchase.findById(purchase._id)
    .populate('supplier', 'supplierName supplierCode contactPerson')
    .populate('items.material', 'materialName materialCode unit');

  return res
    .status(201)
    .json(
      new ApiResponse(201, createdPurchase, 'Purchase order created successfully')
    );
});

/**
 * Get all purchases
 * GET /api/v1/purchases
 */
export const getAllPurchases = asyncHandler(async (req, res) => {
  const {
    supplier,
    status,
    paymentStatus,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {};
  if (supplier) filter.supplier = supplier;
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [purchases, totalCount] = await Promise.all([
    Purchase.find(filter)
      .populate('supplier', 'supplierName supplierCode')
      .populate('items.material', 'materialName materialCode')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ orderDate: -1 }),
    Purchase.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        purchases,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit),
        },
      },
      'Purchases fetched successfully'
    )
  );
});

/**
 * Get purchase by ID
 * GET /api/v1/purchases/:id
 */
export const getPurchaseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const purchase = await Purchase.findById(id)
    .populate('supplier', 'supplierName supplierCode contactPerson phone email')
    .populate('items.material', 'materialName materialCode unit stockQuantity')
    .populate('receivedBy', 'name employeeId')
    .populate('approvedBy', 'username fullName');

  if (!purchase) {
    throw new ApiError(404, 'Purchase not found');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...purchase.toObject(),
        remainingAmount: purchase.remainingAmount,
        deliveryStatus: purchase.deliveryStatus,
      },
      'Purchase fetched successfully'
    )
  );
});

/**
 * Update purchase status
 * PATCH /api/v1/purchases/:id/status
 */
export const updatePurchaseStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const purchase = await Purchase.findById(id);
  if (!purchase) {
    throw new ApiError(404, 'Purchase not found');
  }

  purchase.status = status;
  if (notes) purchase.notes = notes;
  
  // Recalculate totals if needed
  purchase.recalculateTotals();
  await purchase.save();

  const updatedPurchase = await Purchase.findById(id)
    .populate('supplier', 'supplierName supplierCode')
    .populate('items.material', 'materialName materialCode');

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPurchase, 'Purchase status updated successfully')
    );
});

/**
 * ✅ FIXED: Receive purchase items - Use LINE ITEM ID instead of Purchase ID
 * POST /api/v1/purchases/:id/receive
 */
export const receivePurchaseItems = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { items, receivedBy } = req.body;

  const purchase = await Purchase.findById(id);
  if (!purchase) {
    throw new ApiError(404, 'Purchase not found');
  }

  // ✅ CRITICAL FIX: Use itemId (line item _id) instead of Purchase ID
  for (const receivedItem of items) {
    if (!receivedItem.itemId) {
      throw new ApiError(400, 'itemId is required for each received item');
    }

    // Find the specific line item in purchase.items array by its _id
    const purchaseItem = purchase.items.find(
      item => item._id.toString() === receivedItem.itemId.toString()
    );
    
    if (!purchaseItem) {
      throw new ApiError(404, `Item with ID ${receivedItem.itemId} not found in purchase order`);
    }

    // Validate received quantity
    if (receivedItem.receivedQuantity <= 0) {
      throw new ApiError(400, 'Received quantity must be greater than 0');
    }

    const totalReceived = purchaseItem.receivedQuantity + receivedItem.receivedQuantity;
    if (totalReceived > purchaseItem.quantity) {
      throw new ApiError(400, 
        `Cannot receive ${receivedItem.receivedQuantity} units. ` +
        `Only ${purchaseItem.quantity - purchaseItem.receivedQuantity} units remaining for this item.`
      );
    }

    // Update received quantity for this line item
    purchaseItem.receivedQuantity += receivedItem.receivedQuantity;

    // ✅ Update raw material stock with proper validation
    const material = await RawMaterial.findById(purchaseItem.material);
    if (!material) {
      throw new ApiError(404, `Material ${purchaseItem.material} not found`);
    }

    material.stockQuantity += receivedItem.receivedQuantity;
    material.lastPurchaseDate = new Date();
    material.lastPurchasePrice = purchaseItem.unitPrice;
    
    await material.save();
    
    console.log(`✅ Updated stock for ${material.materialName}: +${receivedItem.receivedQuantity} units`);
  }

  // Update purchase status based on received items
  const allReceived = purchase.items.every(
    (item) => item.receivedQuantity >= item.quantity
  );
  const anyReceived = purchase.items.some((item) => item.receivedQuantity > 0);

  if (allReceived) {
    purchase.status = 'received';
    purchase.actualDeliveryDate = new Date();
  } else if (anyReceived) {
    purchase.status = 'partially-received';
  }

  purchase.receivedBy = receivedBy;
  await purchase.save();

  const updatedPurchase = await Purchase.findById(id)
    .populate('supplier', 'supplierName')
    .populate('items.material', 'materialName materialCode stockQuantity');

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPurchase, 'Items received and stock updated successfully')
    );
});

/**
 * ✅ UPDATED: Record payment + Auto-create Finance entry
 * POST /api/v1/purchases/:id/payment
 */
export const recordPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, paymentMethod, notes } = req.body;

  const purchase = await Purchase.findById(id);
  if (!purchase) {
    throw new ApiError(404, 'Purchase not found');
  }

  if (amount <= 0) {
    throw new ApiError(400, 'Payment amount must be greater than 0');
  }

  if (amount > purchase.remainingAmount) {
    throw new ApiError(400, 
      `Payment amount (${amount}) exceeds remaining balance (${purchase.remainingAmount})`
    );
  }

  const oldPaymentStatus = purchase.paymentStatus;
  purchase.paidAmount += amount;
  purchase.paymentMethod = paymentMethod;
  if (notes) purchase.notes = notes;

  // Update payment status
  if (purchase.paidAmount >= purchase.totalAmount) {
    purchase.paymentStatus = 'paid';
  } else if (purchase.paidAmount > 0) {
    purchase.paymentStatus = 'partially-paid';
  }

  await purchase.save();

  // ✅ AUTO-CREATE FINANCE ENTRY for this payment
  try {
    await Finance.createFromPurchasePayment(
      purchase._id,
      amount,
      paymentMethod || 'cash',
      req.user?._id
    );
    console.log(`✅ Finance entry created for Purchase ${purchase.purchaseOrderNumber} payment: ${amount}`);
  } catch (error) {
    console.error('❌ Error creating finance entry:', error);
    // Don't fail the payment recording if finance entry fails
  }

  const updatedPurchase = await Purchase.findById(id)
    .populate('supplier', 'supplierName supplierCode');

  return res
    .status(200)
    .json(new ApiResponse(200, {
      purchase: updatedPurchase,
      paymentRecorded: amount,
      remainingBalance: updatedPurchase.remainingAmount,
    }, 'Payment recorded successfully'));
});

/**
 * Get purchase statistics
 * GET /api/v1/purchases/stats/overview
 */
export const getPurchaseStats = asyncHandler(async (req, res) => {
  const [totalPurchases, byStatus, byPaymentStatus, recentPurchases, totalValue] =
    await Promise.all([
      Purchase.countDocuments(),
      Purchase.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Purchase.aggregate([
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
            total: { $sum: '$totalAmount' },
          },
        },
      ]),
      Purchase.find()
        .populate('supplier', 'supplierName')
        .sort({ orderDate: -1 })
        .limit(5)
        .select('purchaseOrderNumber supplier orderDate totalAmount status'),
      Purchase.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
            paid: { $sum: '$paidAmount' },
          },
        },
      ]),
    ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalPurchases,
        byStatus,
        byPaymentStatus,
        recentPurchases,
        totalValue: totalValue[0] || { total: 0, paid: 0 },
      },
      'Purchase statistics fetched successfully'
    )
  );
});