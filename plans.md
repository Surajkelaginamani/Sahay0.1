# Prompt 4.5: Backend Patient Registration & Auth Integration

Task: Update the Receptionist's "Register Patient" API to create both a login account and a medical profile.

Requirements:

In backend/src/modules/receptionist/receptionistController.js, update the registerPatient function.

Accept email and password from the request body alongside the patient's medical details (name, phone, dob, etc.).

Hash the password using bcrypt.

Create a new document in the User collection with role: 'Patient', email, and the hashed password.

Create a new document in the Patient collection, linking it to the newly created User ID.

Return the created patient profile.

Wrap this in a try...catch block to handle duplicate email errors gracefully (status 400).

# Prompt 4.6: Backend Search & Queue Management APIs

Task: Create the APIs for the Receptionist to search existing patients and add them to the hospital's queue.

Requirements:

In receptionistController.js, create a searchPatient(req, res) function. Use a query parameter (e.g., ?phone=123 or ?name=abc) to run a regex search on the Patient collection. Return the matching profiles.

Create an addToQueue(req, res) function. It must accept a patientId and extract the hospitalId from the Receptionist's JWT token.

Create a new document in the Appointment (or Queue) collection with patientId, facilityId, status: 'Waiting', and a sequential queueNumber for the current date.

Create a getFacilityPatients(req, res) function. It should query the Appointment collection for the receptionist's facilityId to return a list of all patients who have visited this specific hospital.

Map these functions to protected routes in receptionistRoutes.js.

# Prompt 4.7: Receptionist Dashboard UI Workflow

Task: Build the Receptionist frontend layout to handle searching, registering, and queuing patients.

Requirements:

Update frontend/src/features/receptionist/components/PatientRegistrationForm.jsx to include input fields for Email Address and Password so the patient can log in later. Connect this to the updated registerPatient API.

Build PatientSearch.jsx: A search bar that takes a phone number or name, calls the searchPatient API, and displays a list of results.

On each search result row, add an "Add to Today's Queue" button. Clicking this must trigger the addToQueue API.

Build TodayQueue.jsx: A live table fetching from getFacilityPatients (filtered for today's date) showing the Queue Number, Patient Name, and Status (Waiting).

Organize ReceptionistDashboard.jsx using a tabbed interface (Tab 1: "Today's Queue", Tab 2: "Register New Patient", Tab 3: "Search & Add Existing").


# Prompt 4.8: Backend API to Fetch Hospital Doctors

Task: Create an API for the Receptionist to fetch all doctors working at their specific facility.

Requirements:

In backend/src/modules/receptionist/receptionistController.js, create a getFacilityDoctors(req, res) function.

Extract the hospitalId (or facilityId) from the Receptionist's verified JWT token.

Query the User collection for { role: 'Doctor', facilityId: receptionistFacilityId }.

Select and return only the _id, name, and email of the doctors.

Map this to a protected route GET /api/receptionist/doctors in receptionistRoutes.js.

Update the addToQueue function to strictly require assignedDoctorId in the request body and save it into the Appointment (or Queue) document.

# Prompt 4.9: Frontend Queue Assignment UI

Task: Update the Receptionist UI to require selecting a specific doctor when adding a patient to the queue.

Requirements:

In frontend/src/features/receptionist/services/receptionistApi.js, add a function to fetch the doctors using the GET /api/receptionist/doctors endpoint.

In PatientSearch.jsx (and PatientRegistrationForm.jsx if it auto-queues): Fetch the list of doctors on component mount.

Instead of a single "Add to Queue" button, change it to a "Assign to Doctor" button that opens a small modal or reveals a dropdown <select> containing the fetched doctors.

When submitting, include the selected assignedDoctorId in the Axios payload sent to the addToQueue API.

Update TodayQueue.jsx to display an "Assigned Doctor" column, mapping the assignedDoctorId to the doctor's name so the receptionist can see exactly whose room the patient is waiting for.

# Prompt 4.10: Implement Authenticated Auto-RedirectTask:

 Add auto-redirect logic to the public landing page and authentication screens so logged-in users are routed to their dashboards.Requirements:Open frontend/src/pages/Landing.jsx (and your generic Auth/Login components if applicable).Import useEffect and useNavigate from react-router-dom.Read the user's authentication state (e.g., from your AuthContext, or decode the JWT from localStorage).Create a useEffect hook that triggers on mount. If a valid user session exists, use a switch(user.role) statement to instantly navigate() them to the correct route:Doctor $\rightarrow$ /dashboard/doctorHospitalAdmin $\rightarrow$ /dashboard/adminReceptionist $\rightarrow$ /dashboard/receptionistLabHead $\rightarrow$ /dashboard/labUpdate Navigation: On the Navbar, if the user is signed in, replace the "Patient Portal", "Hospital Portal", and "Government Portal" links with a single "Go to Dashboard" button that runs the same routing logic.

 # Prompt 4.11: Backend Queue Triage & Scheduling
Task: Upgrade the Receptionist API to support priority queuing and future appointment scheduling.

Requirements:

Schema Update (backend/src/models/Appointment.js): Add a priority field with an enum ['Routine', 'Urgent'] (default to 'Routine').

Update addToQueue (backend/src/modules/receptionist/receptionistController.js): Modify this function to accept the priority flag from the request body. If priority is 'Urgent', assign a queueNumber of 0 or place them at the front of that specific doctor's queue.

Create scheduleAppointment(req, res): Accept patientId, assignedDoctorId, and appointmentDate (a future date). Save to the Appointment collection with status 'Scheduled'.

Map Routes (receptionistRoutes.js): Ensure these controllers are mapped to protected POST routes.
# Prompt 4.12: Frontend Priority Assignment & Doctor Roster
Task: Enhance the Receptionist UI with priority routing and a live doctor status panel.

Requirements:

Update QueueManager & PatientSearch: When the "Assign to Doctor" modal/dropdown opens, add a secondary dropdown for "Urgency" (Routine / Urgent). Pass this priority to the backend API.

Build DoctorRoster.jsx (frontend/src/features/receptionist/components/): Create a sidebar or top-level panel that fetches and displays the list of doctors for the facility. Show a simple green indicator dot next to their name to signify they are active.

Styling: Use Tailwind CSS. Highlight any 'Urgent' patients in the TodayQueue.jsx table with a soft red or orange background to make them instantly visible.

# Prompt 4.13: Frontend Appointment Calendar
Task: Build the interface for booking future appointments.

Requirements:

Build AppointmentScheduler.jsx (frontend/src/features/receptionist/components/): Create a component containing a date picker (using a standard HTML5 <input type="date">), a patient search bar, and a doctor selection dropdown.

Action: On submit, send the data to the new scheduleAppointment backend API.

Dashboard Integration: Add a new tab to ReceptionistDashboard.jsx labeled "Book Appointment" to house this component cleanly alongside the "Today's Queue" and "Register Patient" tabs.

# Prompt 4.14: Backend Upcoming Appointments API
Task: Create an API endpoint to fetch all future appointments for the receptionist's hospital.

Requirements:

Update receptionistController.js: Create a getUpcomingAppointments(req, res) function.

Query Logic: Extract the facilityId from the user's JWT. Query the Appointment collection where facilityId matches AND appointmentDate is strictly greater than the end of the current day (e.g., appointmentDate: { $gte: new Date(new Date().setHours(23, 59, 59, 999)) }).

Populate Data: Use .populate('patientId', 'firstName lastName contactPhone') and .populate('assignedDoctorId', 'name') so the frontend has the actual names, not just ObjectIds.

Routing: Map this to a GET /api/receptionist/appointments/upcoming protected route in receptionistRoutes.js.

# Prompt 4.15: Frontend Upcoming Appointments View
Task: Build a data table to view future scheduled appointments and integrate it into the Receptionist Dashboard.

Requirements:

API Service (receptionistApi.js): Add a function to call the new GET /api/receptionist/appointments/upcoming endpoint.

Build UpcomingAppointments.jsx (features/receptionist/components/): Create a component containing a Tailwind CSS data table with columns for: Date, Patient Name, Phone Number, and Assigned Doctor. Fetch the data on component mount and sort it chronologically.

Dashboard Integration: Open ReceptionistDashboard.jsx. Add a 4th tab labeled "Upcoming Appointments" and render this new component inside it.

# Prompt 5.1: ABDM-Compliant Clinical Schemas
Task: Create the Mongoose schemas for clinical consultations ensuring alignment with standard ABDM FHIR records.

Requirements:

Create backend/src/models/Consultation.js.

Include reference fields: patientId, doctorId, facilityId, and appointmentId.

Add clinical data arrays/objects mapping to OPConsultRecord standards: vitals (temp, bp, pulse), chiefComplaints, medicalHistory, medications (drug name, dosage, frequency), and investigationAdvice (requested lab tests).

Add a status enum ('Draft', 'Finalized') and timestamps. Export the model securely.
# Prompt 5.2: Doctor Backend API
Task: Build the API controllers for the Doctor's specific workflow.

Requirements:

Create backend/src/modules/doctor/doctorController.js.

Create getDoctorQueue(req, res): Query the Appointment collection where assignedDoctorId matches the logged-in doctor's ID, status is 'Waiting' or 'CheckedIn', and sort by priority ('Urgent' first) then chronologically.

Create submitConsultation(req, res): Accept the clinical data, save it to the Consultation collection, and update the associated Appointment status to 'Completed'.

Create doctorRoutes.js to map these protected endpoints (GET /api/doctor/queue, POST /api/doctor/consultation) and mount them in server.js.
# Prompt 5.3: Component Integration into Existing Dashboard
Task: Build the UI components for the Doctor and integrate them seamlessly into the existing Doctor Dashboard without deleting the current layout.

Requirements:

Read the existing frontend/src/pages/dashboards/DoctorDashboard.jsx to understand the current layout and wrapper structure.

Create frontend/src/features/doctor/components/DoctorQueue.jsx: A sidebar or list component fetching from getDoctorQueue. Highlight 'Urgent' patients visually (e.g., red border). When a patient is clicked, pass their data to a selected patient state in the parent dashboard.

Create frontend/src/features/doctor/components/ConsultationForm.jsx: A form containing fields for vitals, chief complaints, and prescriptions. On submit, post to the submitConsultation API.

Integration: Update the existing DoctorDashboard.jsx file to import and render <DoctorQueue/> and <ConsultationForm/> inside the main content area, respecting whatever grid or flex layout is already established.