// src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// ============= MIDDLEWARE CONFIGURATION =============

// CORS Configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Cookie parser
app.use(cookieParser());

// Static files
app.use(express.static('public'));

// ============= ROUTES IMPORT =============
import healthcheckRoutes from './routes/healthcheck.routes.js';
import authRoutes from './routes/auth.routes.js';
import departmentRoutes from './routes/department.routes.js';
import staffRoutes from './routes/staff.routes.js';
import shiftRoutes from './routes/shift.routes.js';
import machineryRoutes from './routes/machinery.routes.js';
import rawMaterialRoutes from './routes/rawMaterial.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import purchaseRoutes from './routes/purchase.routes.js';
import productionRoutes from './routes/production.routes.js';
import qualityControlRoutes from './routes/qualityControl.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import { attendanceRouter, leaveRouter, payrollRouter } from './routes/hr.routes.js';
import financeRoutes from './routes/finance.routes.js'; // Finnc

// ============= ROUTES DECLARATION =============
app.use('/api/v1/health', healthcheckRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/shifts', shiftRoutes);
app.use('/api/v1/machinery', machineryRoutes);
app.use('/api/v1/raw-materials', rawMaterialRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/production', productionRoutes);
app.use('/api/v1/quality-control', qualityControlRoutes);
app.use('/api/v1/warehouse', inventoryRoutes);
app.use('/api/v1/attendance', attendanceRouter);
app.use('/api/v1/leaves', leaveRouter);
app.use('/api/v1/payroll', payrollRouter);
app.use('/api/v1/finance', financeRoutes); // Finance

// ============= ERROR HANDLING =============

// 404 Handler - Route not found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    errors: err.errors || [],
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

export default app;