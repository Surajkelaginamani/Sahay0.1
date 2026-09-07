import api from '../../../services/api';

export const labApi = {
  // Aggregated counts of DiagnosticOrders grouped by status
  getMetrics: () => api.get('/lab/metrics'),

  // Fetches test queue with optional status filter
  getQueue: (status) =>
    api.get('/lab/queue', {
      params: status && status !== 'ALL' ? { status } : {},
    }),

  // Update status of an individual diagnostic order
  updateStatus: (orderId, status) =>
    api.put(`/lab/orders/${orderId}/status`, { status }),

  // Submit test report and finalize order as Completed
  submitReport: (data) => api.post('/lab/reports', data),
};

export default labApi;
