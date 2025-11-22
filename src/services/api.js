import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
};

// Products APIs
export const productsAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Receipts APIs
export const receiptsAPI = {
  getAll: () => api.get('/receipts'),
  getById: (id) => api.get(`/receipts/${id}`),
  create: (data) => api.post('/receipts', data),
  validate: (id) => api.put(`/receipts/${id}/validate`),
};

// Deliveries APIs
export const deliveriesAPI = {
  getAll: () => api.get('/deliveries'),
  getById: (id) => api.get(`/deliveries/${id}`),
  create: (data) => api.post('/deliveries', data),
  validate: (id) => api.put(`/deliveries/${id}/validate`),
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};
// Move / Stock Ledger APIs
export const stockAPI = {
  getMovements: () => api.get('/stock/movements'),
  getStockFallback: () => api.get('/stock'),
};


// Users APIs (Admin)
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updatePassword: (id, newPassword) => api.put(`/users/${id}/password`, { newPassword }),
  getStats: () => api.get('/users/stats/overview'),
};

// Locations APIs
export const locationsAPI = {
  getAll: () => api.get('/locations'),
  getById: (id) => api.get(`/locations/${id}`),
  create: (data) => api.post('/locations', data),
  update: (id, data) => api.put(`/locations/${id}`, data),
  delete: (id) => api.delete(`/locations/${id}`),
};

// Vendors APIs
export const vendorsAPI = {
  getAll: () => api.get('/vendors'),
  getById: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post('/vendors', data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  delete: (id) => api.delete(`/vendors/${id}`),
};

// Stock APIs
export const stockAPI = {
  getAll: () => api.get('/stock'),
  getMovements: () => api.get('/stock/movements'),
  getByProduct: (productId) => api.get(`/stock/product/${productId}`),
  getByLocation: (locationId) => api.get(`/stock/location/${locationId}`),
};

// Transfers APIs
export const transfersAPI = {
  getAll: () => api.get('/transfers'),
  getById: (id) => api.get(`/transfers/${id}`),
  create: (data) => api.post('/transfers', data),
  validate: (id) => api.put(`/transfers/${id}/validate`),
};

// Adjustments APIs
export const adjustmentsAPI = {
  getAll: () => api.get('/adjustments'),
  getById: (id) => api.get(`/adjustments/${id}`),
  create: (data) => api.post('/adjustments', data),
};

export default api;
