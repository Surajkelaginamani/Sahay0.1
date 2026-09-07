# Agent Execution Protocol

**CRITICAL DIRECTIVE:** You are an AI coding agent executing within the Antigravity IDE. You must operate strictly in phases. You are forbidden from executing multiple phases at once. 
1. Complete the current phase.
2. Output a brief summary of the files created/modified.
3. STOP. Wait for Saish to review, test the output, and explicitly approve before you begin the next phase.

## Phase 1: Database Schemas & Backend Foundation
**Task:** Build the required Mongoose schemas and controller boilerplate without touching existing auth routes.
1. Create `backend/src/models/Patient.js` (Demographics, ABHA ID).
2. Create `backend/src/models/Appointment.js` (Refs to Patient, Doctor, Hospital, and status enum).
3. Create `backend/src/models/Consultation.js` (Notes, prescription array, Appointment ref).
4. Create `backend/src/routes/doctorRoutes.js` and `backend/src/controllers/doctorController.js`.
5. Wire `doctorRoutes.js` into the main `server.js` using the `/api/doctor` prefix. 
*Agent Action:* Complete Phase 1, ensure the backend compiles, and halt for review.

## Phase 2: Frontend Scaffolding & Routing
**Task:** Set up the frontend components inside the existing dashboard directory and connect the layout.
1. Navigate to the existing directory: `Sahay0.1/frontend/src/pages/dashboards/DrDashboard`.
2. Inside this folder, create `DrDashboardLayout.jsx`, `PatientQueue.jsx`, `ConsultationView.jsx`, and `PatientTimeline.jsx`.
3. Update `Sahay0.1/frontend/src/App.jsx` (or the main router) to include a protected route for `/doctor` that renders `DrDashboardLayout.jsx`.
4. Apply Tailwind CSS styling to `DrDashboardLayout.jsx` featuring a sidebar navigation and a main content area.
*Agent Action:* Complete Phase 2, verify UI rendering, and halt for review.

## Phase 3: The Consultation & Timeline Data Hookup
**Task:** Connect the frontend components to the backend APIs.
1. In `doctorController.js`, build the `getTodayQueue` and `getPatientTimeline` endpoints.
2. In `PatientQueue.jsx`, fetch and render the waiting list.
3. In `ConsultationView.jsx`, build the clinical input form (Complaints, Diagnosis, Prescription).
4. In `PatientTimeline.jsx`, render the chronological history cards based on fetched data.
*Agent Action:* Complete Phase 3, verify data flows between React and MongoDB Atlas, and halt for review.

## Phase 4: Smart Diagnostic Alerts & Handoffs
**Task:** Implement the core business logic for redundancy warnings and internal routing.
1. In `ConsultationView.jsx`, add an "Order Investigation" input.
2. Write a frontend utility hook that scans the fetched `PatientTimeline` data. If the ordered investigation matches a test completed within the last 30 days, render a high-visibility Tailwind warning banner.
3. Build the backend endpoint to save the `Consultation` and push the new investigation to the Lab Head's database collection.
*Agent Action:* Complete Phase 4, test the alert trigger, and await final sign-off.