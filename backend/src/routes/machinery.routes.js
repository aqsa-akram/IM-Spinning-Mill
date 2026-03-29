// src/routes/machinery.routes.js
import { Router } from 'express';
import {
  createMachinery,
  getAllMachinery,
  getMachineryById,
  updateMachinery,
  deleteMachinery,
  getMachineryByDepartment,
  logMaintenance,
  completeMaintenance,
  getMachineryStats,
  getMaintenanceHistory,
} from '../controllers/machinery.controllers.js';
import { verifyJWT, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import {
  createMachineryValidator,
  updateMachineryValidator,
  machineryIdValidator,
  logMaintenanceValidator,
  machineryQueryValidator,
} from '../validators/machinery.validators.js';
// Added 'body' to imports for validating finalCost
import { param, body } from 'express-validator';

const router = Router();

// ============= PUBLIC ROUTES =============
router
  .route('/')
  .get(machineryQueryValidator(), validate, getAllMachinery);

router.route('/stats/overview').get(getMachineryStats);

router
  .route('/department/:departmentId')
  .get(
    param('departmentId').isMongoId().withMessage('Invalid department ID'),
    validate,
    getMachineryByDepartment
  );

router
  .route('/:id')
  .get(machineryIdValidator(), validate, getMachineryById);

router
  .route('/:id/maintenance-history')
  .get(machineryIdValidator(), validate, getMaintenanceHistory);

// ============= PROTECTED ROUTES =============
router.use(verifyJWT);
router.use(authorize('admin', 'manager', 'supervisor'));

router
  .route('/')
  .post(createMachineryValidator(), validate, createMachinery);

router
  .route('/maintenance')
  .post(logMaintenanceValidator(), validate, logMaintenance);

// ✅ UPDATED: Added validation for finalCost and notes
router
  .route('/maintenance/:logId/complete')
  .patch(
    [
      param('logId').isMongoId().withMessage('Invalid log ID'),
      body('finalCost').optional().isNumeric().withMessage('Final cost must be a number'),
      body('notes').optional().isString().trim(),
    ],
    validate,
    completeMaintenance
  );

router
  .route('/:id')
  .patch(updateMachineryValidator(), validate, updateMachinery)
  .delete(machineryIdValidator(), validate, deleteMachinery);

export default router;