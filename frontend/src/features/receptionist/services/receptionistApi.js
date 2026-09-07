import axios from 'axios';

// Isolated Axios instance for the Receptionist feature module.
const BASE_URL = 'http://localhost:5000/api/receptionist';

function getAuthHeader() {
  const token = localStorage.getItem('token') || localStorage.getItem('sahay_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const receptionistApi = {
  // ── Patient ────────────────────────────────────────────────────────────────
  /** Register a new walk-in patient (creates User login + Patient profile). */
  registerPatient: (data) =>
    axios.post(`${BASE_URL}/patient`, data, { headers: getAuthHeader() }),

  /** Search existing patients by name or phone number. */
  searchPatients: (q) =>
    axios.get(`${BASE_URL}/patient/search`, {
      params: { q },
      headers: getAuthHeader(),
    }),

  /** Get all patients who have visited this facility. Pass today=true to filter today only. */
  getFacilityPatients: (todayOnly = false) =>
    axios.get(`${BASE_URL}/patients`, {
      params: todayOnly ? { today: 'true' } : {},
      headers: getAuthHeader(),
    }),

  // ── Appointment ────────────────────────────────────────────────────────────
  /** Schedule a formal appointment linking a patient. */
  createAppointment: (data) =>
    axios.post(`${BASE_URL}/appointment`, data, { headers: getAuthHeader() }),

  /** Check in a patient — sets status to 'CheckedIn' and assigns a queueNumber. */
  checkIn: (appointmentId) =>
    axios.patch(`${BASE_URL}/appointment/${appointmentId}/checkin`, {}, {
      headers: getAuthHeader(),
    }),

  // ── Queue ──────────────────────────────────────────────────────────────────
  /** Add an existing patient to today's walk-in queue (status: Waiting). */
  addToQueue: (patientId) =>
    axios.post(`${BASE_URL}/queue`, { patientId }, { headers: getAuthHeader() }),

  /** Fetch today's full appointment queue for the facility. */
  getTodayQueue: (status) =>
    axios.get(`${BASE_URL}/queue/today`, {
      params: status ? { status } : {},
      headers: getAuthHeader(),
    }),
};

export default receptionistApi;
