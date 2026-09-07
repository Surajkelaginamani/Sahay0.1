import React, { useState, useEffect, useCallback } from 'react';

// Helper to read the auth token from localStorage
const getToken = () =>
  localStorage.getItem('token') || localStorage.getItem('sahay_token') || '';

// --------------------------------
// Sub-component: a single timeline card
// --------------------------------
function TimelineCard({ consultation }) {
  const [expanded, setExpanded] = useState(false);
  const date = consultation.appointment?.appointmentDate
    ? new Date(consultation.appointment.appointmentDate)
    : new Date(consultation.createdAt);

  return (
    <div className="relative pl-8">
      {/* Timeline dot */}
      <span className="absolute left-0 top-3.5 w-3 h-3 rounded-full bg-sky-500 border-2 border-white shadow ring-2 ring-sky-100" />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Card header */}
        <button
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          <div>
            <p className="text-xs text-slate-400 font-medium">
              {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {consultation.diagnosis || 'No diagnosis recorded'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {consultation.hospital?.hospitalName || 'Unknown facility'}
              {consultation.doctor?.name && ` · Dr. ${consultation.doctor.name}`}
            </p>
          </div>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-slate-100 px-5 py-4 space-y-4 text-sm">
            {consultation.chiefComplaints && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Chief Complaints</p>
                <p className="text-slate-700">{consultation.chiefComplaints}</p>
              </div>
            )}
            {consultation.clinicalObservations && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Observations</p>
                <p className="text-slate-700">{consultation.clinicalObservations}</p>
              </div>
            )}
            {consultation.prescription?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Prescription</p>
                <div className="space-y-1.5">
                  {consultation.prescription.map((med, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                      <svg className="w-3.5 h-3.5 text-sky-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      <span className="text-xs font-semibold text-slate-700">{med.medicineName}</span>
                      {med.dosage && <span className="text-xs text-slate-400">{med.dosage}</span>}
                      {med.frequency && <span className="text-xs text-slate-400">· {med.frequency}</span>}
                      {med.durationDays && <span className="text-xs text-slate-400">· {med.durationDays}d</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {consultation.investigationOrders?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Investigations Ordered</p>
                <div className="flex flex-wrap gap-2">
                  {consultation.investigationOrders.map((inv, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-100 text-violet-700 text-xs font-semibold">
                      {inv.testName}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {consultation.followUpDate && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Follow-up</p>
                <p className="text-slate-700">
                  {new Date(consultation.followUpDate).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------
// Main PatientTimeline component
// --------------------------------
export default function PatientTimeline({ patient }) {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTimeline = useCallback(async () => {
    if (!patient?._id) return;
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token') || localStorage.getItem('sahay_token');
      const res = await fetch(`/api/doctor/patient/${patient._id}/timeline`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setConsultations(data.consultations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patient]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // ----- Empty state -----
  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700">No patient selected</p>
          <p className="text-xs text-slate-400">Click "History" on a patient in the queue to view their timeline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Patient header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
          {patient.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'P'}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">{patient.name}</p>
          <p className="text-xs text-slate-400">
            {patient.gender}
            {patient.dateOfBirth &&
              ` · DOB: ${new Date(patient.dateOfBirth).toLocaleDateString('en-IN')}`}
            {patient.abhaId && ` · ABHA: ${patient.abhaId}`}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
          {consultations.length} visit{consultations.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading history…</p>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          Failed to load history: {error}
          <button onClick={fetchTimeline} className="ml-3 underline text-rose-600 text-xs">Retry</button>
        </div>
      )}

      {!loading && !error && consultations.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <p className="text-sm text-slate-400">No consultation history found across the SAHAY network.</p>
        </div>
      )}

      {/* Timeline */}
      {!loading && consultations.length > 0 && (
        <div className="relative space-y-4 before:absolute before:left-1.5 before:top-4 before:bottom-4 before:w-px before:bg-slate-200">
          {consultations.map((c) => (
            <TimelineCard key={c._id} consultation={c} />
          ))}
        </div>
      )}
    </div>
  );
}
