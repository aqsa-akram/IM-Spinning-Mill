// src/controllers/inventory.controllers.js
import { Inventory } from '../models/inventory.model.js';
import { Warehouse } from '../models/warehouse.model.js';
import { InventoryTransaction } from '../models/inventoryTransaction.model.js';
import { Finance } from '../models/finance.model.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Create warehouse
 * POST /api/v1/warehouses
 */
export const createWarehouse = asyncHandler(async (req, res) => {
  const {
    warehouseName,
    warehouseCode,
    location,
    capacity,
    manager,
    sections,
    notes,
  } = req.body;

  const existing = await Warehouse.findOne({ warehouseCode });
  if (existing) {
    throw new ApiError(409, 'Warehouse code already exists');
  }

  const warehouse = await Warehouse.create({
    warehouseName,
    warehouseCode: warehouseCode.toUpperCase(),
    location,
    capacity,
    manager,
    sections,
    notes,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, warehouse, 'Warehouse created successfully'));
});

/**
 * Get all warehouses
 * GET /api/v1/warehouses
 */
export const getAllWarehouses = asyncHandler(async (req, res) => {
  const { isActive } = req.query;

  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const warehouses = await Warehouse.find(filter)
    .populate('manager', 'name employeeId')
    .sort({ warehouseName: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, warehouses, 'Warehouses fetched successfully'));
});

/**
 * Add item to inventory
 * POST /api/v1/inventory
 */
export const addToInventory = asyncHandler(async (req, res) => {
  const {
    itemType,
    item,
    itemModel,
    warehouse,
    location,
    quantity,
    unit,
  } = req.body;

  // Check if item already exists in this warehouse
  const existing = await Inventory.findOne({ item, warehouse });
  if (existing) {
    throw new ApiError(409, 'Item already exists in this warehouse. Use update instead.');
  }

  const inventory = await Inventory.create({
    itemType,
    item,
    itemModel,
    warehouse,
    location,
    quantity,
    unit,
  });

  // Log transaction
  await InventoryTransaction.create({
    transactionType: 'in',
    inventory: inventory._id,
    quantity,
    unit,
    toWarehouse: warehouse,
    reason: 'purchase',
    performedBy: req.user._id,
  });

  const createdInventory = await Inventory.findById(inventory._id)
    .populate('warehouse', 'warehouseName warehouseCode')
    .populate('item');

  return res
    .status(201)
    .json(
      new ApiResponse(201, createdInventory, 'Item added to inventory successfully')
    );
});

/**
 * Update inventory quantity & Record Financial Loss
 * PATCH /api/v1/inventory/:id
 */

export const updateInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Added manualUnitCost to allow overriding price if item is missing
  const { quantity, reason, notes, manualUnitCost } = req.body; 

  const inventory = await Inventory.findById(id).populate('item');
  if (!inventory) {
    throw new ApiError(404, 'Inventory item not found');
  }

  const oldQuantity = inventory.quantity;
  const quantityDifference = quantity - oldQuantity;

  // Update quantity
  inventory.quantity = quantity;
  await inventory.save();

  // Log transaction
  await InventoryTransaction.create({
    transactionType: quantityDifference > 0 ? 'in' : 'out',
    inventory: id,
    quantity: Math.abs(quantityDifference),
    unit: inventory.unit,
    toWarehouse: quantityDifference > 0 ? inventory.warehouse : undefined,
    fromWarehouse: quantityDifference < 0 ? inventory.warehouse : undefined,
    reason: reason || 'adjustment',
    performedBy: req.user._id,
    notes,
  });

  // ==========================================
  // 💰 FINANCE INTEGRATION (Stock Loss/Adjustment)
  // ==========================================
  // Only record finance entry if stock is REDUCED (Negative difference)
  if (quantityDifference < 0) {
    
    let unitCost = 0;
    
    // 1. Try to find cost from the linked item (Product or RawMaterial)
    if (inventory.item) {
      unitCost = inventory.item.unitPrice || inventory.item.costPrice || inventory.item.purchaseCost || 0;
    }

    // 2. Fallback: If no cost found (or item deleted), use manualUnitCost from body
    if ((!unitCost || unitCost === 0) && manualUnitCost) {
      unitCost = parseFloat(manualUnitCost);
    }

    if (unitCost > 0) {
      const totalLoss = Math.abs(quantityDifference) * unitCost;
      
      try {
        await Finance.create({
          amount: totalLoss,
          type: 'EXPENSE',
          category: 'INVENTORY',
          referenceId: inventory._id,
          onModel: 'Inventory',
          status: 'cleared',
          paymentMethod: 'credit', // Internal adjustment
          description: `Stock Adjustment (${reason}): Reduced ${Math.abs(quantityDifference)} ${inventory.unit}`,
          transactionDate: new Date(),
          recordedBy: req.user._id 
        });
        console.log(`✅ Finance entry created for Inventory Loss: ${totalLoss}`);
      } catch (error) {
        console.error('❌ Failed to create finance entry for inventory:', error);
      }
    } else {
      console.warn(`⚠️ Skipped finance entry: Cost is 0. Provide 'manualUnitCost' in body.`);
    }
  }

  const updatedInventory = await Inventory.findById(id)
    .populate('warehouse', 'warehouseName warehouseCode')
    .populate('item');

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedInventory, 'Inventory updated successfully')
    );
});

/**
 * Get inventory
 * GET /api/v1/inventory
 */
export const getInventory = asyncHandler(async (req, res) => {
  const { warehouse, itemType, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (warehouse) filter.warehouse = warehouse;
  if (itemType) filter.itemType = itemType;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [items, totalCount] = await Promise.all([
    Inventory.find(filter)
      .populate('warehouse', 'warehouseName')
      .populate('item')
      .skip(skip)
      .limit(parseInt(limit)),
    Inventory.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
        },
      },
      'Inventory fetched successfully'
    )
  );
});

/**
 * Transfer inventory
 * POST /api/v1/inventory/transfer
 */
export const transferInventory = asyncHandler(async (req, res) => {
  const { inventoryId, toWarehouse, quantity, notes } = req.body;

  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) {
    throw new ApiError(404, 'Inventory item not found');
  }

  if (inventory.availableQuantity < quantity) {
    throw new ApiError(400, 'Insufficient quantity available');
  }

  // Reduce from source
  inventory.quantity -= quantity;
  await inventory.save();

  // Add to destination
  let destInventory = await Inventory.findOne({
    item: inventory.item,
    warehouse: toWarehouse,
  });

  if (destInventory) {
    destInventory.quantity += quantity;
    await destInventory.save();
  } else {
    destInventory = await Inventory.create({
      itemType: inventory.itemType,
      item: inventory.item,
      itemModel: inventory.itemModel,
      warehouse: toWarehouse,
      quantity,
      unit: inventory.unit,
    });
  }

  // Log transaction
  await InventoryTransaction.create({
    transactionType: 'transfer',
    inventory: inventoryId,
    quantity,
    unit: inventory.unit,
    fromWarehouse: inventory.warehouse,
    toWarehouse,
    reason: 'transfer',
    performedBy: req.user._id,
    notes,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Inventory transferred successfully'));
});

/**
 * Get inventory statistics
 * GET /api/v1/inventory/stats/overview
 */
export const getInventoryStats = asyncHandler(async (req, res) => {
  const [totalItems, byWarehouse, byItemType, lowStock] = await Promise.all([
    Inventory.countDocuments(),
    Inventory.aggregate([
      {
        $group: {
          _id: '$warehouse',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      {
        $lookup: {
          from: 'warehouses',
          localField: '_id',
          foreignField: '_id',
          as: 'warehouse',
        },
      },
      { $unwind: '$warehouse' },
      {
        $project: {
          warehouseName: '$warehouse.warehouseName',
          totalItems: 1,
          totalQuantity: 1,
        },
      },
    ]),
    Inventory.aggregate([
      {
        $group: {
          _id: '$itemType',
          count: { $sum: 1 },
        },
      },
    ]),
    Inventory.find({ quantity: { $lt: 10 } })
      .limit(10)
      .populate('warehouse', 'warehouseName')
      .populate('item'),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalItems,
        byWarehouse,
        byItemType,
        lowStock,
      },
      'Inventory statistics fetched successfully'
    )
  );
});