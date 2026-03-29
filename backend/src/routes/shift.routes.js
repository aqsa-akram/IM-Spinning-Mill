// src/routes/shift.routes.js
import { Router } from 'express';
import {
  createShift,
  getAllShifts,
  getShiftById,
  updateShift,
  deleteShift,
  getStaffInShift,
  assignStaffToShift,
  bulkAssignStaffToShift,
  getShiftStats,
} from '../controllers/shift.controllers.js';
import { verifyJWT, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import {
  createShiftValidator,
  updateShiftValidator,
  shiftIdValidator,
  assignStaffValidator,
  bulkAssignValidator,
} from '../validators/shift.validators.js';

const router = Router();

// ============= PUBLIC ROUTES =============
router.route('/').get(getAllShifts);

router.route('/stats/overview').get(getShiftStats);

router.route('/:id').get(shiftIdValidator(), validate, getShiftById);

router
  .route('/:id/staff')
  .get(shiftIdValidator(), validate, getStaffInShift);

// ============= PROTECTED ROUTES =============
router.use(verifyJWT);
router.use(authorize('admin', 'manager'));

router.route('/').post(createShiftValidator(), validate, createShift);

router
  .route('/assign')
  .post(assignStaffValidator(), validate, assignStaffToShift);

router
  .route('/bulk-assign')
  .post(bulkAssignValidator(), validate, bulkAssignStaffToShift);

router
  .route('/:id')
  .patch(updateShiftValidator(), validate, updateShift)
  .delete(shiftIdValidator(), validate, deleteShift);

export default router;