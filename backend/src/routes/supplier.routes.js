// src/routes/supplier.routes.js
import { Router } from 'express';
import {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  getSupplierStats,
  paySupplier, // Added Import
} from '../controllers/supplier.controllers.js';
import { verifyJWT, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import {
  createSupplierValidator,
  updateSupplierValidator,
  supplierIdValidator,
} from '../validators/supplier.validators.js';

const router = Router();

// ============= PUBLIC ROUTES =============
router.route('/').get(getAllSuppliers);
router.route('/stats/overview').get(getSupplierStats);
router.route('/:id').get(supplierIdValidator(), validate, getSupplierById);

// ============= PROTECTED ROUTES =============
router.use(verifyJWT);
router.use(authorize('admin', 'manager'));

router
  .route('/')
  .post(createSupplierValidator(), validate, createSupplier);

// ✅ NEW PAYMENT ROUTE
router
  .route('/:id/pay')
  .post(supplierIdValidator(), validate, paySupplier);

router
  .route('/:id')
  .patch(updateSupplierValidator(), validate, updateSupplier)
  .delete(supplierIdValidator(), validate, deleteSupplier);

export default router;