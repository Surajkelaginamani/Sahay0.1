import axios from 'axios';

// Isolated Axios instance for the Receptionist feature module.
// Uses the same base URL as the global api.js but is self-contained
// so the feature can be moved or shared without depending on the root service file.
const BASE_URL = 'http://localhost:5000/api/receptionist';

function getAuthHeader() {
  const token = localStorage.getItem('token') || localStorage.getItem('sahay_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const receptionistApi = {
  // ── Patient ────────────────────────────────────────────────────────────────
  /**
   * Register a new walk-in patient.
   * POST /api/receptionist/patient
   */
  registerPatient: (data) =>
    axios.post(`${BASE_URL}/patient`, data, { headers: getAuthHeader() }),

  /**
   * Search existing patients by name or phone number.
   * GET /api/receptionist/patient/search?q=<query>
   */
  searchPatients: (q) =>
    axios.get(`${BASE_URL}/patient/search`, {
      params: { q },
      headers: getAuthHeader(),
    }),

  // ── Appointment ────────────────────────────────────────────────────────────
  /**
   * Schedule an appointment linking a patient to the queue.
   * POST /api/receptionist/appointment
   */
  createAppointment: (data) =>
    axios.post(`${BASE_URL}/appointment`, data, { headers: getAuthHeader() }),

  /**
   * Check in a patient — sets status to 'CheckedIn' and assigns a queueNumber.
   * PATCH /api/receptionist/appointment/:id/checkin
   */
  checkIn: (appointmentId) =>
    axios.patch(`${BASE_URL}/appointment/${appointmentId}/checkin`, {}, {
      headers: getAuthHeader(),
    }),

  // ── Queue ──────────────────────────────────────────────────────────────────
  /**
   * Fetch today's full appointment queue for the facility.
   * GET /api/receptionist/queue/today?status=<optional>
   */
  getTodayQueue: (status) =>
    axios.get(`${BASE_URL}/queue/today`, {
      params: status ? { status } : {},
      headers: getAuthHeader(),
    }),
};

export default receptionistApi;
