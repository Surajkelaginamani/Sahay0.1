# Prompt 1.1: Repository Scaffolding & Configuration

Role: You are an expert full-stack developer. We are building SAHAY, a government healthcare platform.
Task: Initialize the root directory with two completely separate folders: frontend and backend.
Requirements:

Backend (/backend): Initialize a Node.js/Express project. Install express, mongoose, dotenv, cors, bcrypt, and jsonwebtoken. Set up the folder structure: src/config, src/models, src/controllers, src/routes, and src/middlewares. Create a basic server.js file and a .env file.

Frontend (/frontend): Initialize a Vite React project using standard .jsx (no TypeScript). Install react-router-dom, axios, and Tailwind CSS. Configure tailwind.config.js with a clean, government-friendly healthcare palette (mint green, sky blue, white). Set up the folder structure: src/assets, src/components, src/pages (with subfolders auth and dashboards), src/utils, and src/services.

Execute this scaffolding and verify both local development servers can start independently. Do not build any UI or APIs yet.

# Prompt 1.2: Database Connection & Core MongoDB Schemas

Task: Set up the MongoDB connection and create the exact schemas needed for the Phase 1 authentication flow in the /backend/src/models folder.
Requirements:

Create config/db.js to handle the Mongoose connection to MongoDB.

Create Hospital.js: Needs fields for hospitalName, registrationNumber, address, contactPhone, adminEmail, and a strict verificationStatus enum (default: 'pending', options: 'pending', 'approved', 'rejected').

Create User.js: Needs fields for name, email, password, role (enums: 'Patient', 'HospitalAdmin', 'GovtEmployee', 'ASHA', 'Doctor', 'LabHead', 'FacilityAdmin'), and an optional reference to hospitalId (for hospital staff and admins).

Ensure passwords will be hashed before saving. Export these models securely.

# Prompt 1.3: Backend Auth Logic & Government Approval APIs

Task: Build the Phase 1 authentication and verification API routes in the backend.
Requirements:

Patient Auth (routes/patientRoutes.js): Create endpoints for Patient Registration and Login.

Hospital Admin Auth (routes/hospitalAuthRoutes.js): Create an endpoint for Hospital Registration. This must create both a Hospital document (status: 'pending') and a User document for the Hospital Admin. Create a login endpoint that denies access if the associated Hospital's verificationStatus is still 'pending'.

Govt Employee Auth & Actions (routes/govtRoutes.js): Create a basic login for Govt Employees. Create a protected route GET /api/govt/pending-hospitals to fetch unverified hospitals, and PUT /api/govt/verify-hospital/:id to update the status to 'approved' or 'rejected'.

Implement JWT generation for successful logins. Keep controller logic in the /controllers folder.

# Prompt 1.4: Frontend Routing, Landing Page & Auth Forms

Task: Build the frontend routing system, the main landing page, and the login/registration forms in the /frontend directory using Tailwind CSS.
Requirements:

Set up react-router-dom in App.jsx.

Landing Page (pages/Landing.jsx): Build a professional informational page explaining the SAHAY project (Smart Access to Healthcare). Include clear navigation buttons/cards for the different login types: "Patient Portal", "Hospital Portal", and "Government Portal".

Auth Pages (pages/auth/...):

Create PatientAuth.jsx (toggle between register/login).

Create HospitalRegister.jsx (collect hospital details and admin credentials) and HospitalLogin.jsx.

Create GovtLogin.jsx.

Placeholder Dashboards (pages/dashboards/...): Create empty placeholder components for PatientDashboard.jsx, GovtDashboard.jsx, and HospitalAdminDashboard.jsx.

Connect the forms to the backend APIs using axios. Ensure that when a Hospital Admin registers, they see a success message stating: "Registration submitted. Pending Government Verification."

# Prompt 2.1: Government Employee Dashboard & Approval Workflow

Task: Build the frontend and backend integration for the Government Employee Dashboard (/frontend/src/pages/dashboards/GovtDashboard.jsx).
Requirements:

Create a secure layout that requires a valid JWT where the user's role is GovtEmployee.

On mount, use Axios to fetch GET /api/govt/pending-hospitals from the backend.

Display the fetched hospitals in a clean Tailwind CSS table showing the Hospital Name, Registration Number, Contact Phone, and Address.

Add "Approve" and "Reject" buttons next to each hospital row.

Wire the buttons to send a request to PUT /api/govt/verify-hospital/:id with the new status.

On a successful response, dynamically remove that hospital from the pending list in the UI and show a success toast/message.

# Prompt 2.2: Hospital Admin Dashboard & Staff Creation

Task: Build the Hospital Admin Dashboard (/frontend/src/pages/dashboards/HospitalAdminDashboard.jsx) and the backend API to create staff.
Requirements:

Backend (routes/hospitalAdminRoutes.js): Create a protected POST /api/hospital/create-staff route. This route must verify the requester is a HospitalAdmin. It should accept name, email, password, and role (must be one of: 'ASHA', 'Doctor', 'LabHead', 'FacilityAdmin'). Hash the password and save the new User document, attaching the Admin's hospitalId to this new staff member.

Frontend Dashboard: Create a secure layout requiring a JWT where the role is HospitalAdmin.

Build a "Create Staff Account" form in the dashboard containing fields for Name, Email, Password, and a dropdown select for Role (ASHA / ANM, Doctor, Lab Head / Diagnostic Lab, Facility Admin).

Connect the form to the backend endpoint using Axios.

Build a table below the form that fetches and lists all currently registered staff members associated with this specific hospital.