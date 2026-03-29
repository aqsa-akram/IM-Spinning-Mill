// src/controllers/payroll.controllers.js - FULLY FIXED
import mongoose from 'mongoose';
import { Payroll } from '../models/payroll.model.js';
import { Staff } from '../models/staff.model.js';
import { Attendance } from '../models/attendance.model.js';
import { Leave } from '../models/leave.model.js';
import { Finance } from '../models/finance.model.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Generate single payroll
 * POST /api/v1/payroll
 */
export const generatePayroll = asyncHandler(async (req, res) => {
  const {
    staff,
    month,
    year,
    basicSalary,
    allowances = {},
    bonuses = {},
    deductions = {},
    overtimeRate = 0,
  } = req.body;

  // Validation
  if (!staff || !month || !year || !basicSalary) {
    throw new ApiError(400, 'Staff, month, year, and basicSalary are required');
  }

  // Check if payroll already exists
  const existing = await Payroll.findOne({ staff, month, year });
  if (existing) {
    throw new ApiError(409, 'Payroll already generated for this period');
  }

  // Get attendance data
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const workingDays = endDate.getDate();

  const attendanceData = await Attendance.aggregate([
    {
      $match: {
        staff: new mongoose.Types.ObjectId(staff),
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalOvertime: { $sum: '$overtimeHours' },
      },
    },
  ]);

  const presentDays = attendanceData.find((d) => d._id === 'present')?.count || 0;
  const absentDays = attendanceData.find((d) => d._id === 'absent')?.count || 0;
  const leaveDays = attendanceData.find((d) => d._id === 'on-leave')?.count || 0;
  const overtimeHours = attendanceData.reduce((sum, d) => sum + (d.totalOvertime || 0), 0) || 0;

  // ✅ Calculate salary components correctly
  const allowancesObj = {
    housing: allowances?.housing || 0,
    transport: allowances?.transport || 0,
    medical: allowances?.medical || 0,
    food: allowances?.food || 0,
    other: allowances?.other || 0,
  };

  const bonusesObj = {
    performance: bonuses?.performance || 0,
    attendance: bonuses?.attendance || 0,
    production: bonuses?.production || 0,
    festive: bonuses?.festive || 0,
    other: bonuses?.other || 0,
  };

  const deductionsObj = {
    tax: deductions?.tax || 0,
    providentFund: deductions?.providentFund || 0,
    eobi: deductions?.eobi || 0,
    insurance: deductions?.insurance || 0,
    loan: deductions?.loan || 0,
    advance: deductions?.advance || 0,
    latePenalty: deductions?.latePenalty || 0,
    other: deductions?.other || 0,
  };

  const totalAllowances = Object.values(allowancesObj).reduce((a, b) => a + b, 0);
  const totalBonuses = Object.values(bonusesObj).reduce((a, b) => a + b, 0);
  const totalDeductionsAmount = Object.values(deductionsObj).reduce((a, b) => a + b, 0);

  // ✅ CORRECT CALCULATION:
  // Gross = Basic + Allowances + Bonuses + Overtime - Absent Deduction
  const perDaySalary = basicSalary / workingDays;
  const absentDeduction = absentDays * perDaySalary;
  const overtimePayAmount = overtimeHours * overtimeRate;

  const grossSalary = basicSalary + totalAllowances + totalBonuses + overtimePayAmount - absentDeduction;
  const netSalary = grossSalary - totalDeductionsAmount;

  const payroll = await Payroll.create({
    staff,
    month,
    year,
    basicSalary,
    allowances: allowancesObj,
    bonuses: bonusesObj,
    deductions: deductionsObj,
    workingDays,
    presentDays,
    absentDays,
    leaveDays,
    overtimeHours,
    overtimeRate,
    overtimePay: overtimePayAmount,
    grossSalary: Math.round(grossSalary * 100) / 100,
    totalDeductions: Math.round(totalDeductionsAmount * 100) / 100,
    netSalary: Math.round(netSalary * 100) / 100,
    generatedBy: req.user?._id,
  });

  const createdPayroll = await Payroll.findById(payroll._id).populate(
    'staff',
    'name employeeId department'
  );

  return res.status(201).json(
    new ApiResponse(201, createdPayroll, 'Payroll generated successfully')
  );
});

/**
 * Get all payrolls
 * GET /api/v1/payroll
 */
export const getAllPayrolls = asyncHandler(async (req, res) => {
  const { staff, month, year, paymentStatus, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (staff) filter.staff = staff;
  if (month) filter.month = parseInt(month);
  if (year) filter.year = parseInt(year);
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [payrolls, totalCount] = await Promise.all([
    Payroll.find(filter)
      .populate('staff', 'name employeeId department')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ year: -1, month: -1 }),
    Payroll.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        payrolls,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit),
        },
      },
      'Payrolls fetched successfully'
    )
  );
});

/**
 * Get payroll by ID
 * GET /api/v1/payroll/:id
 */
export const getPayrollById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payroll = await Payroll.findById(id)
    .populate('staff', 'name employeeId department role')
    .populate('generatedBy', 'username fullName')
    .populate('approvedBy', 'username fullName');

  if (!payroll) {
    throw new ApiError(404, 'Payroll not found');
  }

  return res.status(200).json(new ApiResponse(200, payroll, 'Payroll fetched successfully'));
});

/**
 * Update payroll status + Auto-create Finance entry
 * PATCH /api/v1/payroll/:id/status
 */
export const updatePayrollStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentStatus, paymentDate, paymentMethod, bankDetails } = req.body;

  const payroll = await Payroll.findById(id);
  if (!payroll) {
    throw new ApiError(404, 'Payroll not found');
  }

  const oldStatus = payroll.paymentStatus;
  payroll.paymentStatus = paymentStatus;
  if (paymentDate) payroll.paymentDate = paymentDate;
  if (paymentMethod) payroll.paymentMethod = paymentMethod;
  if (bankDetails) payroll.bankDetails = bankDetails;

  if (paymentStatus === 'paid') {
    payroll.approvedBy = req.user._id;
    payroll.approvedDate = new Date();
  }

  await payroll.save();

  // Auto-create Finance entry when status changes to 'paid'
  if (paymentStatus === 'paid' && oldStatus !== 'paid') {
    try {
      await Finance.createFromPayrollPayment(
        payroll._id,
        payroll.netSalary,
        paymentMethod || 'cash',
        req.user._id
      );
      console.log(`✅ Finance entry created for Payroll ${payroll._id}`);
    } catch (error) {
      console.error('❌ Error creating finance entry:', error);
    }
  }

  return res.status(200).json(new ApiResponse(200, payroll, 'Payroll status updated successfully'));
});

/**
 * Get payroll statistics
 * GET /api/v1/payroll/stats/overview
 */
export const getPayrollStats = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  const filter = {};
  if (month) filter.month = parseInt(month);
  if (year) filter.year = parseInt(year);

  const [totalPayrolls, byStatus, summary] = await Promise.all([
    Payroll.countDocuments(filter),
    Payroll.aggregate([
      { $match: filter },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
    ]),
    Payroll.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalGross: { $sum: '$grossSalary' },
          totalDeductions: { $sum: '$totalDeductions' },
          totalNet: { $sum: '$netSalary' },
          totalOvertime: { $sum: '$overtimePay' },
        },
      },
    ]),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { totalPayrolls, byStatus, summary: summary[0] || {} },
      'Payroll statistics fetched successfully'
    )
  );
});

/**
 * ✅ FULLY FIXED: Bulk Generate Payroll with CORRECT calculation
 * POST /api/v1/payroll/bulk-generate
 */
export const bulkGeneratePayroll = asyncHandler(async (req, res) => {
  const month = parseInt(req.body.month, 10);
  const year = parseInt(req.body.year, 10);
  const overtimeRate = parseFloat(req.body.overtimeRate || 0);

  // ✅ Validation
  if (!month || !year || month < 1 || month > 12) {
    throw new ApiError(400, 'Valid month (1-12) and year are required');
  }

  // ✅ Fetch all active staff with baseSalary (NOT using select: false anymore)
  const allStaff = await Staff.find({ employmentStatus: 'active' }).lean();

  if (!allStaff.length) {
    throw new ApiError(404, 'No active staff found in database');
  }

  console.log(`📊 Processing ${allStaff.length} staff for ${month}/${year}`);

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const totalDaysInMonth = endDate.getDate();

  const payrollPromises = allStaff.map(async (staff) => {
    try {
      // ✅ Skip if already exists
      const exists = await Payroll.findOne({ staff: staff._id, month, year });
      if (exists) {
        console.log(`⭕ Skipping ${staff.name} (${staff.employeeId}) - payroll exists`);
        return null;
      }

      // ✅ Validate salary
      const basicSalary = parseFloat(staff.baseSalary) || 0;
      if (!basicSalary || basicSalary <= 0) {
        console.warn(`⚠️ ${staff.name} (${staff.employeeId}) has invalid salary: ${staff.baseSalary}`);
        return null;
      }

      // ✅ Get attendance data
      const attendanceData = await Attendance.aggregate([
        {
          $match: {
            staff: staff._id,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalOvertime: { $sum: { $ifNull: ['$overtimeHours', 0] } },
          },
        },
      ]);

      const presentDays = attendanceData.find(a => a._id === 'present')?.count || 0;
      const absentDays = attendanceData.find(a => a._id === 'absent')?.count || 0;
      const leaveDays = attendanceData.find(a => a._id === 'on-leave')?.count || 0;
      const overtimeHours = attendanceData.reduce((sum, a) => sum + (a.totalOvertime || 0), 0) || 0;

      // ✅ CORRECT CALCULATION LOGIC:
      // Deductions from basic salary
      const perDaySalary = basicSalary / totalDaysInMonth;
      const absentDeduction = absentDays * perDaySalary;

      // Overtime pay
      const overtimePayAmount = overtimeHours * overtimeRate;

      // Unpaid leave deduction (if applicable)
      const unpaidLeaveData = await Leave.aggregate([
        {
          $match: {
            staff: staff._id,
            status: 'approved',
            leaveType: 'unpaid',
            startDate: { $lte: endDate },
            endDate: { $gte: startDate },
          },
        },
        {
          $project: {
            days: {
              $divide: [{ $subtract: ['$endDate', '$startDate'] }, 1000 * 60 * 60 * 24],
            },
          },
        },
        { $group: { _id: null, totalDays: { $sum: '$days' } } },
      ]);

      const unpaidDays = unpaidLeaveData[0]?.totalDays || 0;
      const unpaidDeduction = unpaidDays * perDaySalary;

      // ✅ CORRECT FORMULA:
      // Gross Salary = Basic + Overtime - Absent - Unpaid Leave
      // Net Salary = Gross - Tax/Insurance/Loan/etc
      const totalDeductions = Math.round((absentDeduction + unpaidDeduction) * 100) / 100;
      const grossSalary = Math.round((basicSalary + overtimePayAmount - totalDeductions) * 100) / 100;
      const netSalary = Math.max(0, grossSalary); // Net = Gross (deductions applied above)

      // ✅ Sanity check
      if (grossSalary > basicSalary * 2 || grossSalary < 0) {
        console.error(`❌ Invalid calculation for ${staff.name}:`, { basicSalary, grossSalary, overtimePayAmount, totalDeductions });
        return null;
      }

      // ✅ Create payroll
      return await Payroll.create({
        staff: staff._id,
        month,
        year,
        basicSalary,
        workingDays: totalDaysInMonth,
        presentDays,
        absentDays,
        leaveDays,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        overtimeRate,
        overtimePay: Math.round(overtimePayAmount * 100) / 100,
        grossSalary,
        totalDeductions,
        netSalary,
        generatedBy: req.user._id,
        paymentStatus: 'pending',
      });
    } catch (error) {
      console.error(`❌ Error processing ${staff.name}:`, error.message);
      return null;
    }
  });

  const results = await Promise.all(payrollPromises);
  const generated = results.filter(r => r !== null);

  console.log(`✅ Successfully generated ${generated.length}/${allStaff.length} payroll records`);

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        count: generated.length,
        month,
        year,
        totalStaffProcessed: allStaff.length,
      },
      `${generated.length} payroll records generated successfully`
    )
  );
});

/**
 * Delete payroll records (for testing)
 * DELETE /api/v1/payroll/bulk-delete
 */
export const bulkDeletePayroll = asyncHandler(async (req, res) => {
  const { month, year } = req.body;

  if (!month || !year) {
    throw new ApiError(400, 'Month and year are required');
  }

  const result = await Payroll.deleteMany({
    month: parseInt(month),
    year: parseInt(year),
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { deletedCount: result.deletedCount },
      `Deleted ${result.deletedCount} payroll records for ${month}/${year}`
    )
  );
});