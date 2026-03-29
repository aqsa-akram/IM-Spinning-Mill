// src/routes/rawMaterial.routes.js
import { Router } from 'express';
import {
  createRawMaterial,
  getAllRawMaterials,
  getRawMaterialById,
  updateRawMaterial,
  deleteRawMaterial,
  updateStock,
  getMaterialsNeedingReorder,
  getRawMaterialStats,
} from '../controllers/rawMaterial.controllers.js';
import { verifyJWT, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import {
  createRawMaterialValidator,
  updateRawMaterialValidator,
  updateStockValidator,
  materialIdValidator,
} from '../validators/rawMaterial.validators.js';

const router = Router();

// ============= PUBLIC ROUTES =============
router.route('/').get(getAllRawMaterials);
router.route('/stats/overview').get(getRawMaterialStats);
router.route('/reorder/needed').get(getMaterialsNeedingReorder);
router.route('/:id').get(materialIdValidator(), validate, getRawMaterialById);

// ============= PROTECTED ROUTES =============
router.use(verifyJWT);
router.use(authorize('admin', 'manager', 'supervisor'));

router
  .route('/')
  .post(createRawMaterialValidator(), validate, createRawMaterial);

router
  .route('/:id/stock')
  // This controller now automatically handles Finance (Expense for Manual Add/Loss)
  .patch(updateStockValidator(), validate, updateStock);

router
  .route('/:id')
  .patch(updateRawMaterialValidator(), validate, updateRawMaterial)
  .delete(materialIdValidator(), validate, deleteRawMaterial);

export default router;