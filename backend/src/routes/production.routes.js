// src/routes/production.routes.js
import { Router } from 'express';
import {
  createProduction,
  getAllProduction,
  getProductionById,
  updateProduction,
  getProductionStats,
  getDailyProductionReport,
} from '../controllers/production.controllers.js';
import { verifyJWT, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import {
  createProductionValidator,
  updateProductionValidator,
  productionIdValidator,
  dateRangeValidator,
} from '../validators/production.validators.js';

const router = Router();

// ============= PUBLIC ROUTES =============
router
  .route('/')
  .get(dateRangeValidator(), validate, getAllProduction);

router
  .route('/stats/overview')
  .get(dateRangeValidator(), validate, getProductionStats);

router
  .route('/report/daily')
  .get(getDailyProductionReport);

router
  .route('/:id')
  .get(productionIdValidator(), validate, getProductionById);

// ============= PROTECTED ROUTES =============
router.use(verifyJWT);
router.use(authorize('admin', 'manager', 'supervisor'));

router
  .route('/')
  // This controller now automatically handles Finance (Cost of Goods Manufactured)
  .post(createProductionValidator(), validate, createProduction);

router
  .route('/:id')
  .patch(updateProductionValidator(), validate, updateProduction);

export default router;