// src/routes/hr.routes.js
import { Router } from 'express';
import {
  markAttendance,
  getAttendance,
  updateAttendance,
  getStaffAttendanceSummary,
  getDailyAttendanceReport,
  bulkMarkAttendance,
} from '../controllers/attendance.controllers.js';
import {
  applyLeave,
  getAllLeaves,
  updateLeaveStatus,
  getLeaveBalance,
} from '../controllers/leave.controllers.js';
import {
  generatePayroll,
  getAllPayrolls,
  getPayrollById,
  updatePayrollStatus,
  getPayrollStats,
  bulkGeneratePayroll,
  bulkDeletePayroll, // dELL
} from '../controllers/payroll.controllers.js';
import { verifyJWT, authorize } from '../middleware/auth.middleware.js';

// ============= ATTENDANCE ROUTES =============
const attendanceRouter = Router();

attendanceRouter.route('/').get(getAttendance);
attendanceRouter.route('/report/daily').get(getDailyAttendanceReport);
attendanceRouter.route('/staff/:staffId/summary').get(getStaffAttendanceSummary);

attendanceRouter.use(verifyJWT);
attendanceRouter.use(authorize('admin', 'manager', 'supervisor'));

attendanceRouter.route('/').post(markAttendance);
attendanceRouter.route('/bulk').post(bulkMarkAttendance);
attendanceRouter.route('/:id').patch(updateAttendance);

// ============= LEAVE ROUTES =============
const leaveRouter = Router();

leaveRouter.route('/').get(getAllLeaves);
leaveRouter.route('/staff/:staffId/balance').get(getLeaveBalance);

leaveRouter.use(verifyJWT);
leaveRouter.use(authorize('admin', 'manager', 'supervisor'));

leaveRouter.route('/').post(applyLeave);
leaveRouter.route('/:id/status').patch(updateLeaveStatus);

// ============= PAYROLL ROUTES =============
const payrollRouter = Router();

payrollRouter.route('/').get(getAllPayrolls);
payrollRouter.route('/stats/overview').get(getPayrollStats);
payrollRouter.route('/:id').get(getPayrollById);

payrollRouter.use(verifyJWT);
payrollRouter.use(authorize('admin', 'manager'));

payrollRouter.route('/').post(generatePayroll);
payrollRouter.route('/bulk-generate').post(bulkGeneratePayroll);
payrollRouter.route('/bulk-delete').delete(bulkDeletePayroll); // 🆕 Added
payrollRouter.route('/:id/status').patch(updatePayrollStatus);

export { attendanceRouter, leaveRouter, payrollRouter };