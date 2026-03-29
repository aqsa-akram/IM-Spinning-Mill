// src/controllers/product.controllers.js
import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Create new product
 * POST /api/v1/products
 */
export const createProduct = asyncHandler(async (req, res) => {
  const {
    productName,
    productCode,
    productType,
    threadCount,
    blendRatio,
    productionDepartment,
    description,
    specifications,
    costPrice,
    sellingPrice,
    currency,
    stockQuantity,
    reorderLevel,
    unit,
    applications,
  } = req.body;

  // Check if product code exists
  if (productCode) {
    const existing = await Product.findOne({ productCode });
    if (existing) {
      throw new ApiError(409, 'Product with this code already exists');
    }
  }

  const product = await Product.create({
    productName,
    productCode: productCode?.toUpperCase(),
    productType,
    threadCount,
    blendRatio,
    productionDepartment,
    description,
    specifications,
    costPrice,
    sellingPrice,
    currency,
    stockQuantity,
    reorderLevel,
    unit,
    applications,
  });

  const createdProduct = await Product.findById(product._id).populate(
    'productionDepartment',
    'departmentName departmentCode'
  );

  return res
    .status(201)
    .json(new ApiResponse(201, createdProduct, 'Product created successfully'));
});

/**
 * Get all products
 * GET /api/v1/products
 */
export const getAllProducts = asyncHandler(async (req, res) => {
  const {
    productType,
    isActive = 'true',
    isFeatured,
    page = 1,
    limit = 20,
    search,
  } = req.query;

  const filter = {};
  if (productType) filter.productType = productType;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';

  if (search) {
    filter.$or = [
      { productName: { $regex: search, $options: 'i' } },
      { productCode: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, totalCount] = await Promise.all([
    Product.find(filter)
      .populate('productionDepartment', 'departmentName departmentCode')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ productType: 1, productName: 1 }),
    Product.countDocuments(filter),
  ]);

  const productsWithVirtuals = products.map((product) => ({
    ...product.toObject(),
    profitMargin: product.profitMargin,
    needsReorder: product.needsReorder,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products: productsWithVirtuals,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit),
        },
      },
      'Products fetched successfully'
    )
  );
});

/**
 * Get product by ID
 * GET /api/v1/products/:id
 */
export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id).populate(
    'productionDepartment',
    'departmentName departmentCode departmentType'
  );

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...product.toObject(),
        profitMargin: product.profitMargin,
        needsReorder: product.needsReorder,
      },
      'Product fetched successfully'
    )
  );
});

/**
 * Update product
 * PATCH /api/v1/products/:id
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  delete updates._id;
  delete updates.createdAt;

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('productionDepartment', 'departmentName departmentCode');

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, 'Product updated successfully'));
});

/**
 * Delete product (soft delete)
 * DELETE /api/v1/products/:id
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: { isActive: false } },
    { new: true }
  );

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, 'Product deactivated successfully'));
});

/**
 * Get product statistics
 * GET /api/v1/products/stats/overview
 */
export const getProductStats = asyncHandler(async (req, res) => {
  const [
    totalProducts,
    activeProducts,
    byType,
    needsReorder,
    featuredProducts,
    totalStockValue,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$productType',
          count: { $sum: 1 },
          totalStock: { $sum: '$stockQuantity' },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Product.countDocuments({
      isActive: true,
      $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
    }),
    Product.countDocuments({ isFeatured: true, isActive: true }),
    Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: { $multiply: ['$stockQuantity', '$sellingPrice'] },
          },
          totalCost: {
            $sum: { $multiply: ['$stockQuantity', '$costPrice'] },
          },
        },
      },
    ]),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalProducts,
        activeProducts,
        inactiveProducts: totalProducts - activeProducts,
        byType,
        needsReorder,
        featuredProducts,
        stockValue: totalStockValue[0] || { totalValue: 0, totalCost: 0 },
      },
      'Product statistics fetched successfully'
    )
  );
});