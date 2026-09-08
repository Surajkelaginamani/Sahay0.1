import axios from 'axios';

// Using /api/nurse allows Vite proxy (port 5173) to forward cleanly to port 5000
const BASE_URL = '/api/nurse';

function getAuthHeader() {
  const token = localStorage.getItem('token') || localStorage.getItem('sahay_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const nurseApi = {
  /** Fetch all active triage patients waiting for vitals capture. */
  getTriageQueue: () =>
    axios.get(`${BASE_URL}/queue`, { headers: getAuthHeader() }),

  /** Submit vitals and forward patient to the Doctor queue. */
  captureVitals: (data) =>
    axios.post(`${BASE_URL}/vitals`, data, { headers: getAuthHeader() }),
};

export default nurseApi;
