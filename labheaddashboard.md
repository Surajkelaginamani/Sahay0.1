# Prompt 3.1: Lab Domain Database Schemas

Task: Create the MongoDB schemas required for the Lab Head workflow in backend/src/models/.

Requirements:

Create DiagnosticOrder.js: Must include references to patientId, doctorId, facilityId, testName, orderDate, and a status enum (Ordered, SampleCollected, Processing, Completed).

Create DiagnosticReport.js: Must include references to orderId, patientId, labHeadId, resultText (optional), fileUrl (optional), verificationStatus (Pending, Verified), and completedDate.

Ensure timestamps are enabled for both schemas to preserve auditability. Export the Mongoose models securely.