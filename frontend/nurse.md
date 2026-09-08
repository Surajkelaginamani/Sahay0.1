# Prompt 6.1: System Role & Database Updates for Nurse
Task: Introduce the 'Nurse' role to the unified authentication system and define the Vitals schema.

Requirements:

Schema Update (backend/src/models/User.js): Add 'Nurse' to the role enum array.

Admin UI (frontend/src/pages/dashboards/HospitalAdminDashboard.jsx): Add "Nurse" to the role selection dropdown so the Hospital Admin can create nurse accounts.

Login Routing (frontend/src/pages/Landing.jsx & Login component): Add a switch case for the 'Nurse' role to automatically redirect to /dashboard/nurse.

Appointment Schema (backend/src/models/Appointment.js): Update the status enum to support this specific flow: ['Scheduled', 'At Triage', 'Waiting for Doctor', 'Lab Pending', 'Reports Ready', 'Completed'].

# Prompt 6.2: Nurse Backend API & Triage Controller
Task: Build the API logic for the Nurse to fetch patients from reception and forward them to the doctor.

Requirements:

Create a new module: backend/src/modules/nurse/nurseController.js and nurseRoutes.js.

getTriageQueue(req, res): Query the Appointment collection for the nurse's facilityId where status is 'At Triage'. Populate the patient details.

captureVitals(req, res): Accept an appointmentId and vitals data (bloodPressure, bloodSugar, height, weight).

Logic: When captureVitals is called, save this data to a new Vitals document (or embed it in a preliminary Consultation document linked to the patient). Immediately update that Appointment status from 'At Triage' to 'Waiting for Doctor'.

Map these to protected GET and POST routes restricting access to the 'Nurse' role. Mount the routes in server.js.

# Prompt 6.3: Nurse Frontend Dashboard (Vitals Entry)
Task: Build the frontend Nurse Dashboard to process incoming patients.

Requirements:

Create frontend/src/pages/dashboards/NurseDashboard.jsx and a feature folder frontend/src/features/nurse/components/.

TriageQueue.jsx: A data table fetching from getTriageQueue. Include an "Enter Vitals" action button on each row.

VitalsForm.jsx: When "Enter Vitals" is clicked, open a form with input fields for Blood Pressure, Blood Sugar, Height, and Weight.

Action: On submit, call the captureVitals API. Upon success, remove the patient from the Triage Queue UI (as they have now been pushed to the Doctor's queue).