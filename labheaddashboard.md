# Prompt 3.1: Lab Domain Database Schemas

Task: Create the MongoDB schemas required for the Lab Head workflow in backend/src/models/.

Requirements:

Create DiagnosticOrder.js: Must include references to patientId, doctorId, facilityId, testName, orderDate, and a status enum (Ordered, SampleCollected, Processing, Completed).

Create DiagnosticReport.js: Must include references to orderId, patientId, labHeadId, resultText (optional), fileUrl (optional), verificationStatus (Pending, Verified), and completedDate.

Ensure timestamps are enabled for both schemas to preserve auditability. Export the Mongoose models securely.

# Prompt 3.2: Lab Backend API & Routing

Task: Build the isolated backend module for the laboratory domain.

Requirements:

Create a new folder structure: backend/src/modules/laboratory/.

Create labController.js: Write the following controller functions:

getLabMetrics(req, res): Aggregates counts of DiagnosticOrders grouped by status for the user's facilityId.

getTestQueue(req, res): Fetches all DiagnosticOrders for the user's facilityId sorted by date.

updateOrderStatus(req, res): Updates the status of a specific order.

submitReport(req, res): Creates a new DiagnosticReport linked to an order and marks the order as Completed.

Create labRoutes.js: Map these controllers to protected Express routes (e.g., GET /api/lab/queue). Ensure the auth middleware restricts access to users with the LabHead role. Mount this router in the main server.js.

# Prompt 3.3: Frontend Feature Isolation & Dashboard UI

Task: Build the React frontend layout for the Lab Head using Tailwind CSS, strictly isolating components in a feature directory.

Requirements:

Create the directory frontend/src/features/laboratory/components/.

Build LabMetrics.jsx: A component displaying 4 metric cards (Tests Ordered, Samples Collected, Processing, Reports Ready) using a soft, clean healthcare color palette (mint green, sky blue, white).

Build TestQueueTable.jsx: A data table to display patient test requests with actionable buttons to update the status.

Update the existing frontend/src/pages/dashboards/LabDashboard.jsx: Import the LabMetrics and TestQueueTable components and render them within a responsive dashboard layout.

Create frontend/src/features/laboratory/services/labApi.js using Axios to handle the requests to the endpoints created in the backend, ensuring the JWT token is passed in the headers.