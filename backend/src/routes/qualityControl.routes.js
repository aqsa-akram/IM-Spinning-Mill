// src/routes/qualityControl.routes.js
import { Router } from 'express';
import {
  createQualityTest,
  getAllQualityTests,
  getQualityTestById,
  updateQualityTest,
  getQualityStats,
  getProductQualityReport,
} from '../controllers/qualityControl.controllers.js';
import { verifyJWT, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.route('/').get(getAllQualityTests);
router.route('/stats/overview').get(getQualityStats);
router.route('/report/product/:productId').get(getProductQualityReport);
router.route('/:id').get(getQualityTestById);

router.use(verifyJWT);
router.use(authorize('admin', 'manager', 'supervisor'));

router.route('/').post(createQualityTest);
router.route('/:id').patch(updateQualityTest);

export default router;