// src/routes/product.routes.js
import { Router } from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductStats,
} from '../controllers/product.controllers.js';
import { verifyJWT, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import { param } from 'express-validator';

const router = Router();

// ============= PUBLIC ROUTES =============
router.route('/').get(getAllProducts);

router.route('/stats/overview').get(getProductStats);

router
  .route('/:id')
  .get(
    param('id').isMongoId().withMessage('Invalid product ID'),
    validate,
    getProductById
  );

// ============= PROTECTED ROUTES =============
router.use(verifyJWT);
router.use(authorize('admin', 'manager'));

router.route('/').post(createProduct);

router
  .route('/:id')
  .patch(
    param('id').isMongoId().withMessage('Invalid product ID'),
    validate,
    updateProduct
  )
  .delete(
    param('id').isMongoId().withMessage('Invalid product ID'),
    validate,
    deleteProduct
  );

export default router;