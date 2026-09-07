# Project Context: SAHAY Doctor's Dashboard

## Architecture & Scope
SAHAY is a multi-tenant, rural healthcare continuity platform built on a MERN stack (React .jsx, Node.js, Express, MongoDB Atlas). The Doctor's Dashboard is the core clinical module designed to prevent healthcare data silos. This module is strictly focused on the in-person clinical workflow. Third-party integrations (like SMS gateways or external video APIs) are out of scope for this phase.

## Core Features
*   **Daily Patient Queue:** Displays today's appointments associated with the doctor's specific `hospitalId`, categorized by 'Waiting' and 'Completed'.
*   **Longitudinal History Viewer:** A chronological timeline of a patient's past medical history, aggregating `Consultations` and `DiagnosticReports` from all facilities across the SAHAY network.
*   **Smart Diagnostic Alerts:** A proactive redundancy check. If a doctor attempts to order an investigation (e.g., CBC, X-Ray), the system must cross-reference the patient's timeline and trigger a UI warning if a valid, recent result already exists.
*   **Active Consultation Form:** A unified form capturing chief complaints, clinical observations, final diagnosis, and a digital prescription.
*   **Internal Handoffs:** Action routes to push investigation orders directly to the internal Lab Head's queue, or generate an outbound referral that alerts the district ASHA worker.

## Conflict Avoidance Strategy
To ensure zero friction with other developers working on the Government or Admin portals, all frontend assets for this module must be strictly encapsulated within `Sahay0.1/frontend/src/pages/dashboards/DrDashboard`. Backend routes and controllers must be separated into dedicated doctor-specific files (e.g., `doctorRoutes.js`, `doctorController.js`).