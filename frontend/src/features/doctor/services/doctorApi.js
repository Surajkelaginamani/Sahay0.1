import axios from 'axios';

// Using /api/doctor allows Vite proxy (port 5173) to forward cleanly to port 5000
const BASE_URL = '/api/doctor';

function getAuthHeader() {
  const token = localStorage.getItem('token') || localStorage.getItem('sahay_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const doctorApi = {
  /** Fetch waiting and checked-in patient queue for the logged-in doctor. */
  getQueue: () =>
    axios.get(`${BASE_URL}/queue`, { headers: getAuthHeader() }),

  /** Submit an ABDM-compliant clinical consultation and complete the appointment. */
  submitConsultation: (data) =>
    axios.post(`${BASE_URL}/consultation`, data, { headers: getAuthHeader() }),
};

export default doctorApi;
