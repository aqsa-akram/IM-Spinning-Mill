// src/routes/finance.routes.js
import { Router } from 'express';
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransactionStatus,
  deleteTransaction,
  getFinancialOverview,
  getMonthlyReport,
  getExpenseBreakdown,
  getCashflowStatement,
} from '../controllers/finance.controllers.js';
import { verifyJWT, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// ============= PROTECTED ROUTES (All finance routes require authentication) =============
router.use(verifyJWT);

// Basic CRUD Operations
router
  .route('/')
  .get(authorize('admin', 'manager', 'accountant'), getAllTransactions)
  .post(authorize('admin', 'manager', 'accountant'), createTransaction);

router
  .route('/:id')
  .get(authorize('admin', 'manager', 'accountant'), getTransactionById)
  .delete(authorize('admin', 'accountant'), deleteTransaction);

router
  .route('/:id/status')
  .patch(authorize('admin', 'manager', 'accountant'), updateTransactionStatus);

// Reports & Analytics
router
  .route('/stats/overview')
  .get(authorize('admin', 'manager', 'accountant'), getFinancialOverview);

router
  .route('/reports/monthly')
  .get(authorize('admin', 'manager', 'accountant'), getMonthlyReport);

router
  .route('/reports/expense-breakdown')
  .get(authorize('admin', 'manager', 'accountant'), getExpenseBreakdown);

router
  .route('/reports/cashflow')
  .get(authorize('admin', 'manager', 'accountant'), getCashflowStatement);

export default router;