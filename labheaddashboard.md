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