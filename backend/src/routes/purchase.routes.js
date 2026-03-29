// src/routes/purchase.routes.js
import { Router } from 'express';
import {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchaseStatus,
  receivePurchaseItems,
  recordPayment,
  getPurchaseStats,
} from '../controllers/purchase.controllers.js';
import { verifyJWT, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import {
  createPurchaseValidator,
  updatePurchaseStatusValidator,
  receivePurchaseValidator,
  recordPaymentValidator,
  purchaseIdValidator,
} from '../validators/purchase.validators.js';

const router = Router();

// ============= PUBLIC ROUTES =============
router.route('/').get(getAllPurchases);
router.route('/stats/overview').get(getPurchaseStats);
router.route('/:id').get(purchaseIdValidator(), validate, getPurchaseById);

// ============= PROTECTED ROUTES =============
router.use(verifyJWT);
router.use(authorize('admin', 'manager', 'supervisor'));

router
  .route('/')
  .post(createPurchaseValidator(), validate, createPurchase);

router
  .route('/:id/status')
  .patch(updatePurchaseStatusValidator(), validate, updatePurchaseStatus);

router
  .route('/:id/receive')
  .post(receivePurchaseValidator(), validate, receivePurchaseItems);

router
  .route('/:id/payment')
  .post(recordPaymentValidator(), validate, recordPayment);

export default router;