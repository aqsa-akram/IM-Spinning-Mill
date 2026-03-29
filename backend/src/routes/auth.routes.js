// src/routes/auth.routes.js
import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changePassword,
  updateUserProfile,
} from '../controllers/auth.controllers.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import {
  userRegisterValidator,
  userLoginValidator,
  changePasswordValidator,
  updateProfileValidator,
} from '../validators/auth.validators.js';

const router = Router();

// ============= PUBLIC ROUTES =============
router
  .route('/register')
  .post(userRegisterValidator(), validate, registerUser);

router
  .route('/login')
  .post(userLoginValidator(), validate, loginUser);

router
  .route('/refresh-token')
  .post(refreshAccessToken);

// ============= PROTECTED ROUTES =============
router
  .route('/logout')
  .post(verifyJWT, logoutUser);

router
  .route('/me')
  .get(verifyJWT, getCurrentUser);

router
  .route('/change-password')
  .post(verifyJWT, changePasswordValidator(), validate, changePassword);

router
  .route('/update-profile')
  .patch(verifyJWT, updateProfileValidator(), validate, updateUserProfile);

export default router;