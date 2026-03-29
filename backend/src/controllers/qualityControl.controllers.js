// src/controllers/qualityControl.controllers.js
import { QualityControl } from '../models/qualityControl.model.js';
import { Product } from '../models/product.model.js';
import { Production } from '../models/production.model.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Helper function to determine overall status based on grade
 */
const determineOverallStatus = (grade) => {
  if (['A+', 'A'].includes(grade)) {
    return 'approved';
  } else if (grade === 'Rejected') {
    return 'rejected';
  } else {
    return 'approved'; // B or C grades default to approved
  }
};

/**
 * Create quality control test
 * POST /api/v1/quality-control
 */
export const createQualityTest = asyncHandler(async (req, res) => {
  const {
    testDate,
    product,
    production,
    batchNumber,
    yarnTests,
    blendRatio,
    overallGrade,
    testedBy,
    testLocation,
    sampleSize,
    sampleUnit,
    defects,
    correctiveActions,
    notes,
  } = req.body;

  // Verify product exists
  const productExists = await Product.findById(product);
  if (!productExists) {
    throw new ApiError(404, 'Product not found');
  }

  // Determine overall status based on grade
  const overallStatus = determineOverallStatus(overallGrade);

  const qualityTest = await QualityControl.create({
    testDate,
    product,
    production,
    batchNumber,
    yarnTests,
    blendRatio,
    overallGrade,
    overallStatus, // Set calculated status
    testedBy,
    approvedBy: req.user._id,
    testLocation,
    sampleSize,
    sampleUnit,
    defects,
    correctiveActions,
    notes,
  });

  // Update production quality if linked
  if (production) {
    await Production.findByIdAndUpdate(production, {
      qualityGrade: overallGrade,
    });
  }

  const createdTest = await QualityControl.findById(qualityTest._id)
    .populate('product', 'productName productCode')
    .populate('production', 'quantityProduced productionDate')
    .populate('testedBy', 'name employeeId')
    .populate('approvedBy', 'username fullName');

  return res
    .status(201)
    .json(
      new ApiResponse(201, createdTest, 'Quality test created successfully')
    );
});

/**
 * Get all quality tests
 * GET /api/v1/quality-control
 */
export const getAllQualityTests = asyncHandler(async (req, res) => {
  const {
    product,
    overallGrade,
    overallStatus,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {};
  if (product) filter.product = product;
  if (overallGrade) filter.overallGrade = overallGrade;
  if (overallStatus) filter.overallStatus = overallStatus;

  if (startDate || endDate) {
    filter.testDate = {};
    if (startDate) filter.testDate.$gte = new Date(startDate);
    if (endDate) filter.testDate.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [tests, totalCount] = await Promise.all([
    QualityControl.find(filter)
      .populate('product', 'productName productCode')
      .populate('testedBy', 'name employeeId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ testDate: -1 }),
    QualityControl.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        tests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit),
        },
      },
      'Quality tests fetched successfully'
    )
  );
});

/**
 * Get quality test by ID
 * GET /api/v1/quality-control/:id
 */
export const getQualityTestById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const test = await QualityControl.findById(id)
    .populate('product', 'productName productCode threadCount')
    .populate('production', 'quantityProduced productionDate department')
    .populate('testedBy', 'name employeeId role')
    .populate('approvedBy', 'username fullName')
    .populate('correctiveActions.actions.assignedTo', 'name employeeId');

  if (!test) {
    throw new ApiError(404, 'Quality test not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, test, 'Quality test fetched successfully'));
});

/**
 * Update quality test
 * PATCH /api/v1/quality-control/:id
 */
export const updateQualityTest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  delete updates._id;
  delete updates.createdAt;

  // If grade is being updated, recalculate status
  if (updates.overallGrade) {
    updates.overallStatus = determineOverallStatus(updates.overallGrade);
  }

  const test = await QualityControl.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate('product', 'productName')
    .populate('testedBy', 'name employeeId');

  if (!test) {
    throw new ApiError(404, 'Quality test not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, test, 'Quality test updated successfully'));
});

/**
 * Get quality statistics
 * GET /api/v1/quality-control/stats/overview
 */
export const getQualityStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.testDate = {};
    if (startDate) dateFilter.testDate.$gte = new Date(startDate);
    if (endDate) dateFilter.testDate.$lte = new Date(endDate);
  }

  const [
    totalTests,
    byGrade,
    byStatus,
    recentRejected,
    defectAnalysis,
    passRate,
  ] = await Promise.all([
    QualityControl.countDocuments(dateFilter),
    QualityControl.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$overallGrade',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    QualityControl.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$overallStatus',
          count: { $sum: 1 },
        },
      },
    ]),
    QualityControl.find({
      ...dateFilter,
      overallStatus: 'rejected',
    })
      .populate('product', 'productName')
      .sort({ testDate: -1 })
      .limit(5)
      .select('product testDate overallGrade batchNumber defects'),
    QualityControl.aggregate([
      { $match: dateFilter },
      { $unwind: '$defects' },
      {
        $group: {
          _id: '$defects.defectType',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    QualityControl.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$overallStatus', 'approved'] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const passRatePercent = passRate[0]
    ? ((passRate[0].approved / passRate[0].total) * 100).toFixed(2)
    : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalTests,
        byGrade,
        byStatus,
        passRate: passRatePercent,
        recentRejected,
        defectAnalysis,
      },
      'Quality statistics fetched successfully'
    )
  );
});

/**
 * Get quality report by product
 * GET /api/v1/quality-control/report/product/:productId
 */
export const getProductQualityReport = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { startDate, endDate } = req.query;

  const dateFilter = { product: productId };
  if (startDate || endDate) {
    dateFilter.testDate = {};
    if (startDate) dateFilter.testDate.$gte = new Date(startDate);
    if (endDate) dateFilter.testDate.$lte = new Date(endDate);
  }

  const [product, tests, summary] = await Promise.all([
    Product.findById(productId),
    QualityControl.find(dateFilter)
      .sort({ testDate: -1 })
      .limit(20)
      .select('testDate overallGrade overallStatus yarnTests'),
    QualityControl.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalTests: { $sum: 1 },
          avgStrength: { $avg: '$yarnTests.strength.value' },
          avgEvenness: { $avg: '$yarnTests.evenness.cv' },
          approved: {
            $sum: { $cond: [{ $eq: ['$overallStatus', 'approved'] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        product: {
          _id: product._id,
          productName: product.productName,
          productCode: product.productCode,
        },
        tests,
        summary: summary[0] || {},
      },
      'Product quality report fetched successfully'
    )
  );
});