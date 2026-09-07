import { useMemo } from 'react';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * useRedundancyCheck
 *
 * Scans the patient's fetched timeline (array of Consultation documents) and
 * checks whether any of the currently-typed investigation orders were already
 * completed within the last 30 days.
 *
 * @param {Array}  consultations   - Array of Consultation docs from getPatientTimeline
 * @param {Array}  orderedTests    - Array of { testName: string } objects the doctor is ordering now
 *
 * @returns {Array} alerts — Array of objects for each flagged investigation:
 *   {
 *     testName: string,          // the test being ordered
 *     matchedOn: Date,           // date of the recent result
 *     facility: string,          // hospital name where it was done
 *     daysAgo: number,           // how many days ago
 *   }
 *
 * Matching is normalised (case-insensitive, trims whitespace) so
 * "CBC" matches "cbc", "Complete Blood Count" does NOT match "CBC" —
 * exact-ish match is intentional to avoid false positives in a clinical context.
 */
export function useRedundancyCheck(consultations = [], orderedTests = []) {
  const alerts = useMemo(() => {
    if (!orderedTests.length || !consultations.length) return [];

    const now = Date.now();
    const cutoff = now - THIRTY_DAYS_MS;

    // Build a flat list of all recent investigation orders from the timeline
    // that were either "Completed" or have no status (legacy).
    const recentCompleted = [];

    for (const consultation of consultations) {
      if (!consultation.investigationOrders?.length) continue;

      // Use the consultation's appointment date or createdAt as the reference date
      const consultDate =
        consultation.appointment?.appointmentDate
          ? new Date(consultation.appointment.appointmentDate).getTime()
          : new Date(consultation.createdAt).getTime();

      if (consultDate < cutoff) continue; // older than 30 days — skip

      for (const order of consultation.investigationOrders) {
        // Count as a recent result if status is Completed, or if status is absent
        const isCompleted =
          !order.status ||
          order.status === 'Completed' ||
          order.status === 'In Progress'; // In Progress means sample is already being processed

        if (isCompleted) {
          recentCompleted.push({
            testName: (order.testName || '').trim().toLowerCase(),
            consultDate,
            facility: consultation.hospital?.hospitalName || 'Unknown facility',
          });
        }
      }
    }

    if (!recentCompleted.length) return [];

    // For each newly ordered test, check if a recent result exists
    const flagged = [];

    for (const ordered of orderedTests) {
      const normalised = (ordered.testName || '').trim().toLowerCase();
      if (!normalised) continue;

      const match = recentCompleted.find((r) => r.testName === normalised);
      if (match) {
        const daysAgo = Math.floor((now - match.consultDate) / (24 * 60 * 60 * 1000));
        flagged.push({
          testName: ordered.testName,
          matchedOn: new Date(match.consultDate),
          facility: match.facility,
          daysAgo,
        });
      }
    }

    return flagged;
  }, [consultations, orderedTests]);

  return alerts;
}
