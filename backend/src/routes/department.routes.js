// src/routes/department.routes.js
import { Router } from 'express';
import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getDepartmentsByType,
  getDepartmentStats,
} from '../controllers/department.controllers.js';
import { verifyJWT, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import {
  createDepartmentValidator,
  updateDepartmentValidator,
  departmentIdValidator,
  departmentTypeValidator,
} from '../validators/department.validators.js';

const router = Router();

// ============= PUBLIC ROUTES =============
router.route('/').get(getAllDepartments);

router.route('/stats/overview').get(getDepartmentStats);

router
  .route('/type/:type')
  .get(departmentTypeValidator(), validate, getDepartmentsByType);

router
  .route('/:id')
  .get(departmentIdValidator(), validate, getDepartmentById);

// ============= PROTECTED ROUTES =============
router.use(verifyJWT);
router.use(authorize('admin', 'manager'));

router
  .route('/')
  .post(createDepartmentValidator(), validate, createDepartment);

router
  .route('/:id')
  .patch(updateDepartmentValidator(), validate, updateDepartment)
  .delete(departmentIdValidator(), validate, deleteDepartment);

export default router;