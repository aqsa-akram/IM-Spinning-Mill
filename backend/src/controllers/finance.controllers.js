// src/controllers/finance.controllers.js
import { Finance } from '../models/finance.model.js';
import { Purchase } from '../models/purchase.model.js';
import { Payroll } from '../models/payroll.model.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Create manual finance transaction
 * POST /api/v1/finance
 */
export const createTransaction = asyncHandler(async (req, res) => {
  const {
    amount,
    type,
    category,
    referenceId,
    onModel,
    status,
    paymentMethod,
    description,
    bankDetails,
    transactionDate,
  } = req.body;

  // Validate reference document exists
  let refModel;
  if (onModel === 'Purchase') {
    refModel = await Purchase.findById(referenceId);
  } else if (onModel === 'Payroll') {
    refModel = await Payroll.findById(referenceId);
  }

  if (!refModel) {
    throw new ApiError(404, `${onModel} with ID ${referenceId} not found`);
  }

  const transaction = await Finance.create({
    amount,
    type,
    category,
    referenceId,
    onModel,
    status,
    paymentMethod,
    description,
    bankDetails,
    transactionDate: transactionDate || new Date(),
    recordedBy: req.user._id,
  });

  const createdTransaction = await Finance.findById(transaction._id)
    .populate('referenceId')
    .populate('recordedBy', 'username fullName');

  return res
    .status(201)
    .json(
      new ApiResponse(201, createdTransaction, 'Transaction created successfully')
    );
});

/**
 * Get all transactions with filters
 * GET /api/v1/finance
 */
export const getAllTransactions = asyncHandler(async (req, res) => {
  const {
    type,
    category,
    status,
    startDate,
    endDate,
    onModel,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (onModel) filter.onModel = onModel;

  if (startDate || endDate) {
    filter.transactionDate = {};
    if (startDate) filter.transactionDate.$gte = new Date(startDate);
    if (endDate) filter.transactionDate.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [transactions, totalCount] = await Promise.all([
    Finance.find(filter)
      .populate('referenceId')
      .populate('recordedBy', 'username fullName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ transactionDate: -1 }),
    Finance.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit),
        },
      },
      'Transactions fetched successfully'
    )
  );
});

/**
 * Get transaction by ID with deep population
 * GET /api/v1/finance/:id
 */
export const getTransactionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await Finance.findById(id)
    .populate({
      path: 'referenceId',
      populate: [
        { path: 'supplier', select: 'supplierName supplierCode' },
        { path: 'staff', select: 'name employeeId department' },
        { path: 'items.material', select: 'materialName materialCode' },
      ],
    })
    .populate('recordedBy', 'username fullName email');

  if (!transaction) {
    throw new ApiError(404, 'Transaction not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, transaction, 'Transaction fetched successfully'));
});

/**
 * Update transaction status
 * PATCH /api/v1/finance/:id/status
 */
export const updateTransactionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, bankDetails } = req.body;

  const transaction = await Finance.findById(id);
  if (!transaction) {
    throw new ApiError(404, 'Transaction not found');
  }

  transaction.status = status;
  if (bankDetails) {
    transaction.bankDetails = {
      ...transaction.bankDetails,
      ...bankDetails,
    };
  }

  await transaction.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, transaction, 'Transaction status updated successfully')
    );
});

/**
 * Delete transaction (soft delete)
 * DELETE /api/v1/finance/:id
 */
export const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await Finance.findByIdAndDelete(id);

  if (!transaction) {
    throw new ApiError(404, 'Transaction not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, transaction, 'Transaction deleted successfully')
    );
});

/**
 * Get financial overview/dashboard
 * GET /api/v1/finance/stats/overview
 */
export const getFinancialOverview = asyncHandler(async (req, res) => {
  const { startDate, endDate, fiscalYear, fiscalMonth } = req.query;

  const filter = {};
  
  if (fiscalYear) filter.fiscalYear = parseInt(fiscalYear);
  if (fiscalMonth) filter.fiscalMonth = parseInt(fiscalMonth);
  
  if (startDate || endDate) {
    filter.transactionDate = {};
    if (startDate) filter.transactionDate.$gte = new Date(startDate);
    if (endDate) filter.transactionDate.$lte = new Date(endDate);
  }

  const [
    totalTransactions,
    incomeVsExpense,
    byCategory,
    byStatus,
    recentTransactions,
  ] = await Promise.all([
    Finance.countDocuments(filter),
    Finance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Finance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]),
    Finance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
    ]),
    Finance.find(filter)
      .populate('referenceId')
      .sort({ transactionDate: -1 })
      .limit(10)
      .select('transactionDate amount type category status onModel'),
  ]);

  // Calculate net profit/loss
  const income = incomeVsExpense.find((t) => t._id === 'INCOME')?.total || 0;
  const expense = incomeVsExpense.find((t) => t._id === 'EXPENSE')?.total || 0;
  const netProfit = income - expense;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalTransactions,
        income,
        expense,
        netProfit,
        incomeVsExpense,
        byCategory,
        byStatus,
        recentTransactions,
      },
      'Financial overview fetched successfully'
    )
  );
});

/**
 * Get monthly financial report
 * GET /api/v1/finance/reports/monthly
 */
export const getMonthlyReport = asyncHandler(async (req, res) => {
  const { year, month } = req.query;

  if (!year || !month) {
    throw new ApiError(400, 'Year and month are required');
  }

  const filter = {
    fiscalYear: parseInt(year),
    fiscalMonth: parseInt(month),
  };

  const [summary, transactions, categoryBreakdown] = await Promise.all([
    Finance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Finance.find(filter)
      .populate('referenceId')
      .populate('recordedBy', 'username')
      .sort({ transactionDate: -1 }),
    Finance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]),
  ]);

  const income = summary.find((s) => s._id === 'INCOME')?.total || 0;
  const expense = summary.find((s) => s._id === 'EXPENSE')?.total || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        period: { year: parseInt(year), month: parseInt(month) },
        summary: {
          income,
          expense,
          netProfit: income - expense,
        },
        categoryBreakdown,
        transactions,
      },
      'Monthly report generated successfully'
    )
  );
});

/**
 * Get expense breakdown by category
 * GET /api/v1/finance/reports/expense-breakdown
 */
export const getExpenseBreakdown = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const filter = { type: 'EXPENSE' };
  
  if (startDate || endDate) {
    filter.transactionDate = {};
    if (startDate) filter.transactionDate.$gte = new Date(startDate);
    if (endDate) filter.transactionDate.$lte = new Date(endDate);
  }

  const breakdown = await Finance.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        avgTransaction: { $avg: '$amount' },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const totalExpenses = breakdown.reduce((sum, item) => sum + item.total, 0);

  // Calculate percentages
  const withPercentages = breakdown.map((item) => ({
    ...item,
    percentage: totalExpenses > 0 ? ((item.total / totalExpenses) * 100).toFixed(2) : 0,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalExpenses,
        breakdown: withPercentages,
      },
      'Expense breakdown fetched successfully'
    )
  );
});

/**
 * Get cashflow statement
 * GET /api/v1/finance/reports/cashflow
 */
export const getCashflowStatement = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const filter = { status: 'cleared' };
  
  if (startDate || endDate) {
    filter.transactionDate = {};
    if (startDate) filter.transactionDate.$gte = new Date(startDate);
    if (endDate) filter.transactionDate.$lte = new Date(endDate);
  }

  const transactions = await Finance.find(filter)
    .sort({ transactionDate: 1 })
    .select('transactionDate amount type category status');

  let runningBalance = 0;
  const cashflow = transactions.map((transaction) => {
    if (transaction.type === 'INCOME') {
      runningBalance += transaction.amount;
    } else {
      runningBalance -= transaction.amount;
    }

    return {
      date: transaction.transactionDate,
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      balance: runningBalance,
    };
  });

  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalIncome,
        totalExpense,
        netCashflow: totalIncome - totalExpense,
        finalBalance: runningBalance,
        transactions: cashflow,
      },
      'Cashflow statement generated successfully'
    )
  );
});