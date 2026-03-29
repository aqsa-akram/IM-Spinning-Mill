// src/routes/inventory.routes.js
import { Router } from 'express';
import {
  createWarehouse,
  getAllWarehouses,
  addToInventory,
  getInventory,
  transferInventory,
  getInventoryStats,
  updateInventory, // <--- ✅ ADDED THIS IMPORT
} from '../controllers/inventory.controllers.js';
import { verifyJWT, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.route('/warehouses').get(getAllWarehouses);
router.route('/inventory').get(getInventory);
router.route('/inventory/stats/overview').get(getInventoryStats);

// Protected Routes
router.use(verifyJWT);
router.use(authorize('admin', 'manager', 'supervisor'));

router.route('/warehouses').post(createWarehouse);
router.route('/inventory').post(addToInventory);
router.route('/inventory/transfer').post(transferInventory);

router.route('/inventory/:id').patch(updateInventory);

export default router;