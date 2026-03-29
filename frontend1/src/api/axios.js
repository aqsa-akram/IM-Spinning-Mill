import { api } from '../api/axios';

export const authService = {
  login: (creds) => api.post('/auth/login', creds),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const dashboardService = {
  // Parallel fetching for dashboard efficiency
  getOverview: async () => {
    const [prod, dept, staff] = await Promise.all([
      api.get('/production/stats/overview'),
      api.get('/departments/stats/overview'),
      api.get('/staff/stats/overview')
    ]);
    return { 
      production: prod.data.data, 
      departments: dept.data.data, 
      staff: staff.data.data 
    };
  }
};

export const departmentService = {
  getAll: (params) => api.get('/departments', { params }),
  create: (data) => api.post('/departments', data),
  delete: (id) => api.delete(`/departments/${id}`),
};