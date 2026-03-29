// api/index.js
// Complete API services for all modules

import axios from 'axios';
import toast from 'react-hot-toast';

// 1. Configuration
const BASE_URL = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// 2. Token Management
export const getAccessToken = () => localStorage.getItem('accessToken');
export const setAccessToken = (token) => localStorage.setItem('accessToken', token);
export const clearTokens = () => localStorage.removeItem('accessToken');

// 3. Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// 4. Response Interceptor (Silent Refresh)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes('/auth/refresh-token')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh-token');
        const { accessToken } = data.data;

        setAccessToken(accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// API SERVICES FOR ALL MODULES
// ============================================================================

// AUTHENTICATION
export const authAPI = {
  login: (creds) => api.post('/auth/login', creds),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// SUPPLIERS
export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.patch(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  getStats: () => api.get('/suppliers/stats/overview'),
  pay: (id, data) => api.post(`/suppliers/${id}/pay`, data),
};

// PURCHASES
export const purchaseAPI = {
  getAll: (params) => api.get('/purchases', { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  updateStatus: (id, data) => api.patch(`/purchases/${id}/status`, data),
  receive: (id, data) => api.post(`/purchases/${id}/receive`, data),
  recordPayment: (id, data) => api.post(`/purchases/${id}/payment`, data),
  getStats: () => api.get('/purchases/stats/overview'),
};

// RAW MATERIALS
export const rawMaterialAPI = {
  getAll: (params) => api.get('/raw-materials', { params }),
  getById: (id) => api.get(`/raw-materials/${id}`),
  create: (data) => api.post('/raw-materials', data),
  update: (id, data) => api.patch(`/raw-materials/${id}`, data),
  delete: (id) => api.delete(`/raw-materials/${id}`),
  updateStock: (id, data) => api.patch(`/raw-materials/${id}/stock`, data),
  getStats: () => api.get('/raw-materials/stats/overview'),
  getNeedingReorder: () => api.get('/raw-materials/reorder/needed'),
};

// PAYROLL
export const payrollAPI = {
  getAll: (params) => api.get('/payroll', { params }),
  getById: (id) => api.get(`/payroll/${id}`),
  create: (data) => api.post('/payroll', data),
  updateStatus: (id, data) => api.patch(`/payroll/${id}/status`, data),
  bulkGenerate: (data) => api.post('/payroll/bulk-generate', data),
  bulkDelete: (data) => api.delete('/payroll/bulk-delete', { data }),
  getStats: (params) => api.get('/payroll/stats/overview', { params }),
};

// PRODUCTION
export const productionAPI = {
  getAll: (params) => api.get('/production', { params }),
  getById: (id) => api.get(`/production/${id}`),
  create: (data) => api.post('/production', data),
  update: (id, data) => api.patch(`/production/${id}`, data),
  getStats: (params) => api.get('/production/stats/overview', { params }),
  getDailyReport: (params) => api.get('/production/report/daily', { params }),
};

// FINANCE
export const financeAPI = {
  getAll: (params) => api.get('/finance', { params }),
  getById: (id) => api.get(`/finance/${id}`),
  create: (data) => api.post('/finance', data),
  updateStatus: (id, data) => api.patch(`/finance/${id}/status`, data),
  delete: (id) => api.delete(`/finance/${id}`),
  getOverview: (params) => api.get('/finance/stats/overview', { params }),
  getMonthlyReport: (params) => api.get('/finance/reports/monthly', { params }),
  getExpenseBreakdown: (params) => api.get('/finance/reports/expense-breakdown', { params }),
  getCashflow: (params) => api.get('/finance/reports/cashflow', { params }),
};

// DEPARTMENTS
export const departmentAPI = {
  getAll: (params) => api.get('/departments', { params }),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.patch(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
  getStats: () => api.get('/departments/stats/overview'),
};

// STAFF
export const staffAPI = {
  getAll: (params) => api.get('/staff', { params }),
  getById: (id) => api.get(`/staff/${id}`),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.patch(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),
  getStats: () => api.get('/staff/stats/overview'),
};

// SHIFTS
export const shiftAPI = {
  getAll: (params) => api.get('/shifts', { params }),
  getById: (id) => api.get(`/shifts/${id}`),
  create: (data) => api.post('/shifts', data),
  update: (id, data) => api.patch(`/shifts/${id}`, data),
  delete: (id) => api.delete(`/shifts/${id}`),
  getStats: () => api.get('/shifts/stats/overview'),
};

// PRODUCTS
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.patch(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getStats: () => api.get('/products/stats/overview'),
};

// MACHINERY
export const machineryAPI = {
  getAll: (params) => api.get('/machinery', { params }),
  getById: (id) => api.get(`/machinery/${id}`),
  create: (data) => api.post('/machinery', data),
  update: (id, data) => api.patch(`/machinery/${id}`, data),
  delete: (id) => api.delete(`/machinery/${id}`),
  getStats: () => api.get('/machinery/stats/overview'),
};

// INVENTORY
export const inventoryAPI = {
  getAll: (params) => api.get('/warehouse/inventory', { params }),
  getById: (id) => api.get(`/warehouse/inventory/${id}`),
  addItem: (data) => api.post('/warehouse/inventory', data),
  update: (id, data) => api.patch(`/warehouse/inventory/${id}`, data),
  transfer: (data) => api.post('/warehouse/inventory/transfer', data),
  getStats: () => api.get('/warehouse/inventory/stats/overview'),
};

// ============================================================================
// CENTRALIZED ERROR HANDLER
// ============================================================================

export const handleApiError = (error) => {
  const message = error.response?.data?.message || error.message || 'An error occurred';
  toast.error(message);
  return message;
};

export default api;