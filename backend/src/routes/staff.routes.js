// src/routes/staff.routes.js
import { Router } from 'express';
import {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  getStaffByDepartment,
  getStaffStats,
  bulkImportStaff,
} from '../controllers/staff.controllers.js';
import { verifyJWT, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import {
  createStaffValidator,
  updateStaffValidator,
  staffIdValidator,
  bulkImportStaffValidator,
} from '../validators/staff.validators.js';
import { param } from 'express-validator';

const router = Router();

// ============= PUBLIC ROUTES =============
router.route('/').get(getAllStaff);

router.route('/stats/overview').get(getStaffStats);

router
  .route('/department/:departmentId')
  .get(
    param('departmentId').isMongoId().withMessage('Invalid department ID'),
    validate,
    getStaffByDepartment
  );

router.route('/:id').get(staffIdValidator(), validate, getStaffById);

// ============= PROTECTED ROUTES =============
router.use(verifyJWT);
router.use(authorize('admin', 'manager'));

router.route('/').post(createStaffValidator(), validate, createStaff);

router
  .route('/bulk-import')
  .post(bulkImportStaffValidator(), validate, bulkImportStaff);

router
  .route('/:id')
  .patch(updateStaffValidator(), validate, updateStaff)
  .delete(staffIdValidator(), validate, deleteStaff);

export default router;