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