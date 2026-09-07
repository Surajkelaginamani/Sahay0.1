import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('sahay_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Patient API
export const patientAPI = {
  register: (data) => api.post('/patients/register', data),
  login: (data) => api.post('/patients/login', data),
};

// Hospital Admin API
export const hospitalAPI = {
  register: (data) => api.post('/hospital-auth/register', data),
  login: (data) => api.post('/hospital-auth/login', data),
};

// Government Official API
export const govtAPI = {
  login: (data) => api.post('/govt/login', data),
  register: (data) => api.post('/govt/register', data),
  getPendingHospitals: (config) => api.get('/govt/pending-hospitals', config),
  verifyHospital: (id, status, config) => api.put(`/govt/verify-hospital/${id}`, { status }, config),
};

// Hospital Admin Management API (protected - requires HospitalAdmin JWT)
export const hospitalAdminAPI = {
  createStaff: (data) => api.post('/hospital/create-staff', data),
  getStaff: () => api.get('/hospital/staff'),
  resetPassword: (id, password) => api.put(`/hospital/staff/${id}/password`, { password }),
  deleteStaff: (id) => api.delete(`/hospital/staff/${id}`),
};

// Staff Auth API (Unified login for Doctor, ASHA, HospitalAdmin, LabHead, FacilityAdmin)
export const staffAuthAPI = {
  login: (data) => api.post('/auth/staff-login', data),
};

export default api;
