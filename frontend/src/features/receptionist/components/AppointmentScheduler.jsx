import React, { useState, useEffect, useCallback, useRef } from 'react';
import receptionistApi from '../services/receptionistApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatDisplayDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDot({ num, active, done, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5 relative">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all
          ${done
            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
            : active
            ? 'bg-sky-600 text-white shadow-sm shadow-sky-200 ring-4 ring-sky-100'
            : 'bg-slate-100 text-slate-400'}`}
      >
        {done ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        ) : num}
      </div>
      <span className={`text-[10px] font-semibold whitespace-nowrap hidden sm:block
        ${active ? 'text-sky-700' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}

function StepLine({ done }) {
  return (
    <div className={`flex-1 h-0.5 mt-4 mb-auto rounded-full transition-colors
      ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
  );
}

// ─── Patient result card ──────────────────────────────────────────────────────
function PatientCard({ patient, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(patient)}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all group
        ${selected
          ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-200'
          : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/40'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-extrabold shrink-0
            ${patient.gender === 'Female' ? 'bg-pink-100 text-pink-700' : 'bg-sky-100 text-sky-700'}`}>
            {patient.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{patient.fullName}</p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {patient.contactPhone && (
                <span className="text-[10px] text-slate-500">{patient.contactPhone}</span>
              )}
              <span className="text-[10px] text-slate-400">{patient.gender}</span>
              {patient.abhaId && (
                <span className="text-[9px] font-mono text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                  ABHA: {patient.abhaId}
                </span>
              )}
            </div>
          </div>
        </div>
        {selected && (
          <svg className="w-5 h-5 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
    </button>
  );
}

// ─── Confirmation receipt ─────────────────────────────────────────────────────
function ConfirmationReceipt({ appointment, onBookAnother }) {
  const appt = appointment?.appointment || appointment;
  const patient = appt?.patientId || {};
  const doctor  = appt?.assignedDoctorId || {};

  return (
    <div className="flex flex-col items-center py-8 px-4 text-center">
      {/* Success ring animation */}
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500
          flex items-center justify-center shadow-lg shadow-emerald-200">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h3 className="text-xl font-extrabold text-slate-900">Appointment Booked!</h3>
      <p className="text-sm text-slate-500 mt-1">The appointment has been scheduled successfully.</p>

      {/* Receipt card */}
      <div className="mt-6 w-full max-w-sm bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-left">
        <div className="bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-sky-100">Appointment Confirmation</p>
          <p className="text-white font-extrabold text-lg mt-0.5">
            {patient.firstName} {patient.lastName}
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            {
              label: 'Date',
              value: formatDisplayDate(appt?.appointmentDate),
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              ),
            },
            {
              label: 'Time Slot',
              value: appt?.timeSlot || 'Not specified',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              ),
            },
            {
              label: 'Doctor',
              value: doctor?.name ? `Dr. ${doctor.name}` : '—',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              ),
            },
            {
              label: 'Visit Type',
              value: appt?.visitType || 'General',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              ),
            },
            {
              label: 'Status',
              value: 'Scheduled',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ),
              valueClass: 'text-sky-700 font-bold',
            },
          ].map(({ label, value, icon, valueClass = '' }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-3">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {icon}
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                <p className={`text-xs font-semibold text-slate-800 ${valueClass}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        id="book-another-btn"
        type="button"
        onClick={onBookAnother}
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-600 text-white
          text-sm font-bold hover:bg-sky-700 active:scale-[0.98] transition-all shadow-sm shadow-sky-200"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
        </svg>
        Book Another Appointment
      </button>
    </div>
  );
}

// ─── AppointmentScheduler ─────────────────────────────────────────────────────
/**
 * AppointmentScheduler — 3-step wizard:
 *   1. Pick Patient (search by name/phone)
 *   2. Pick Date + Time Slot
 *   3. Select Doctor + Visit Details → submit
 *
 * Props:
 *   onSuccess {function} — called with the created appointment object
 */
export default function AppointmentScheduler({ onSuccess }) {
  // ── Step: 1=patient, 2=datetime, 3=doctor+details, 4=done ────────────────
  const [step, setStep] = useState(1);

  // Step 1 — Patient search
  const [searchQuery, setSearchQuery]         = useState('');
  const [searchResults, setSearchResults]     = useState(null);
  const [searching, setSearching]             = useState(false);
  const [searchError, setSearchError]         = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Step 2 — Date + time slot
  const [appointmentDate, setAppointmentDate] = useState('');
  const [timeSlot, setTimeSlot]               = useState('');

  // Step 3 — Doctor + visit details
  const [doctors, setDoctors]                 = useState([]);
  const [loadingDoctors, setLoadingDoctors]   = useState(false);
  const [doctorsError, setDoctorsError]       = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [visitType, setVisitType]             = useState('');
  const [chiefComplaint, setChiefComplaint]   = useState('');
  const [staffNotes, setStaffNotes]           = useState('');

  // Submission
  const [submitting, setSubmitting]           = useState(false);
  const [submitError, setSubmitError]         = useState('');
  const [confirmation, setConfirmation]       = useState(null); // step 4

  const searchInputRef = useRef(null);

  // ── Fetch doctors once ───────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoadingDoctors(true);
      setDoctorsError('');
      try {
        const res = await receptionistApi.getFacilityDoctors();
        if (active) {
          const docs = res.data.doctors || [];
          setDoctors(docs);
          if (docs.length > 0) setSelectedDoctorId(docs[0]._id);
        }
      } catch (err) {
        if (active) setDoctorsError(err.response?.data?.message || 'Failed to load doctors.');
      } finally {
        if (active) setLoadingDoctors(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  // ── Step 1: patient search ────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchError('Enter at least 2 characters to search.');
      return;
    }
    setSearchError('');
    setSearching(true);
    setSearchResults(null);
    setSelectedPatient(null);
    try {
      const res = await receptionistApi.searchPatients(q);
      setSearchResults(res.data.patients || []);
    } catch (err) {
      setSearchError(err.response?.data?.message || 'Search failed. Try again.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchResults(null);
    setSearchQuery(patient.fullName);
  };

  const handleContinueFromStep1 = () => {
    if (!selectedPatient) return;
    setStep(2);
  };

  // ── Step 2: date/time → step 3 ───────────────────────────────────────────
  const handleContinueFromStep2 = () => {
    if (!appointmentDate) return;
    setStep(3);
  };

  // ── Step 3: submit ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !appointmentDate || !selectedDoctorId) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await receptionistApi.scheduleAppointment({
        patientId:       selectedPatient._id,
        assignedDoctorId: selectedDoctorId,
        appointmentDate,
        timeSlot:        timeSlot.trim()        || undefined,
        visitType:       visitType.trim()        || undefined,
        chiefComplaint:  chiefComplaint.trim()   || undefined,
        staffNotes:      staffNotes.trim()       || undefined,
      });
      setConfirmation(res.data);
      setStep(4);
      onSuccess?.({ appointment: res.data.appointment, patient: selectedPatient });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to schedule appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reset to book another ─────────────────────────────────────────────────
  const handleReset = () => {
    setStep(1);
    setSearchQuery('');
    setSearchResults(null);
    setSearchError('');
    setSelectedPatient(null);
    setAppointmentDate('');
    setTimeSlot('');
    setSelectedDoctorId(doctors[0]?._id || '');
    setVisitType('');
    setChiefComplaint('');
    setStaffNotes('');
    setSubmitError('');
    setConfirmation(null);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  // ── Time slot options ─────────────────────────────────────────────────────
  const TIME_SLOTS = [
    '08:00 AM – 08:30 AM', '08:30 AM – 09:00 AM',
    '09:00 AM – 09:30 AM', '09:30 AM – 10:00 AM',
    '10:00 AM – 10:30 AM', '10:30 AM – 11:00 AM',
    '11:00 AM – 11:30 AM', '11:30 AM – 12:00 PM',
    '12:00 PM – 12:30 PM', '02:00 PM – 02:30 PM',
    '02:30 PM – 03:00 PM', '03:00 PM – 03:30 PM',
    '03:30 PM – 04:00 PM', '04:00 PM – 04:30 PM',
    '04:30 PM – 05:00 PM', '05:00 PM – 05:30 PM',
  ];

  const VISIT_TYPES = [
    'General Checkup', 'Follow-up', 'Consultation',
    'Emergency', 'Vaccination', 'Lab Report Review',
    'Prescription Renewal', 'Other',
  ];

  // ── Shared field styles ───────────────────────────────────────────────────
  const fieldCls = `w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50
    focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 focus:bg-white
    placeholder:text-slate-400 transition-all`;

  const labelCls = 'block text-xs font-bold text-slate-600 mb-1.5';

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Step 4: Confirmation ─────────────────────────────────────────── */}
      {step === 4 && (
        <ConfirmationReceipt
          appointment={confirmation}
          onBookAnother={handleReset}
        />
      )}

      {step < 4 && (
        <>
          {/* ── Step indicator ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-0 mb-8">
            <StepDot num={1} active={step === 1} done={step > 1} label="Select Patient" />
            <StepLine done={step > 1} />
            <StepDot num={2} active={step === 2} done={step > 2} label="Pick Date" />
            <StepLine done={step > 2} />
            <StepDot num={3} active={step === 3} done={step > 3} label="Doctor & Details" />
          </div>

          {/* ── Step 1: Patient selection ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Find Patient</h3>
                <p className="text-xs text-slate-500 mt-0.5">Search by name or 10-digit phone number</p>
              </div>

              {/* Search bar */}
              <div>
                <label className={labelCls}>Patient Name or Phone</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      id="appt-patient-search"
                      ref={searchInputRef}
                      type="text"
                      placeholder="e.g. Ramesh or 9876543210"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (selectedPatient) setSelectedPatient(null);
                        setSearchResults(null);
                        setSearchError('');
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className={`${fieldCls} pl-10`}
                    />
                  </div>
                  <button
                    id="appt-search-btn"
                    type="button"
                    onClick={handleSearch}
                    disabled={searching}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold
                      hover:bg-sky-700 transition-colors disabled:opacity-60 flex items-center gap-2 shrink-0"
                  >
                    {searching ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                    {searching ? 'Searching…' : 'Search'}
                  </button>
                </div>
                {searchError && (
                  <p className="text-[11px] text-rose-600 mt-1.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {searchError}
                  </p>
                )}
              </div>

              {/* Search results */}
              {searchResults !== null && (
                <div className="space-y-2">
                  {searchResults.length === 0 ? (
                    <div className="py-8 flex flex-col items-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                      <svg className="w-10 h-10 mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm font-semibold">No patients found</p>
                      <p className="text-xs mt-0.5">Try a different name or phone number</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} — click to select
                      </p>
                      {searchResults.map((p) => (
                        <PatientCard
                          key={p._id}
                          patient={p}
                          selected={selectedPatient?._id === p._id}
                          onSelect={handleSelectPatient}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Selected patient preview */}
              {selectedPatient && searchResults === null && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-sky-50 border border-sky-200">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-extrabold shrink-0
                    ${selectedPatient.gender === 'Female' ? 'bg-pink-100 text-pink-700' : 'bg-sky-200 text-sky-800'}`}>
                    {selectedPatient.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-sky-900 truncate">{selectedPatient.fullName}</p>
                    <p className="text-[11px] text-sky-600">{selectedPatient.contactPhone || 'No phone'} · {selectedPatient.gender}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedPatient(null); setSearchQuery(''); setSearchResults(null); }}
                    className="p-1.5 rounded-lg hover:bg-sky-100 text-sky-500 transition-colors"
                    title="Change patient"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Next button */}
              <button
                id="appt-step1-next"
                type="button"
                disabled={!selectedPatient}
                onClick={handleContinueFromStep1}
                className="w-full py-3 rounded-2xl bg-sky-600 text-white font-bold text-sm
                  hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm shadow-sky-200"
              >
                Continue to Pick Date
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* ── Step 2: Date & Time slot ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Choose Date & Time</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    For <span className="font-semibold text-sky-700">{selectedPatient?.fullName}</span>
                  </p>
                </div>
              </div>

              {/* Date picker */}
              <div>
                <label htmlFor="appt-date" className={labelCls}>
                  Appointment Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="appt-date"
                  type="date"
                  value={appointmentDate}
                  min={todayISO()}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className={`${fieldCls} cursor-pointer`}
                />
                {appointmentDate && (
                  <p className="text-[11px] text-sky-700 font-semibold mt-1.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDisplayDate(appointmentDate)}
                  </p>
                )}
              </div>

              {/* Time slot picker */}
              <div>
                <label htmlFor="appt-timeslot" className={labelCls}>
                  Time Slot
                  <span className="text-slate-400 font-normal ml-1">(optional)</span>
                </label>
                <select
                  id="appt-timeslot"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className={fieldCls}
                >
                  <option value="">— No specific time slot —</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              {/* Visual calendar hint */}
              {appointmentDate && (
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-sky-600 text-white flex flex-col items-center justify-center shrink-0 shadow-sm shadow-sky-300">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                      {new Date(appointmentDate).toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                    <span className="text-2xl font-extrabold leading-none">
                      {new Date(appointmentDate).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-sky-900">{formatDisplayDate(appointmentDate)}</p>
                    <p className="text-xs text-sky-600 mt-0.5">{timeSlot || 'No time slot selected'}</p>
                  </div>
                </div>
              )}

              <button
                id="appt-step2-next"
                type="button"
                disabled={!appointmentDate}
                onClick={handleContinueFromStep2}
                className="w-full py-3 rounded-2xl bg-sky-600 text-white font-bold text-sm
                  hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm shadow-sky-200"
              >
                Continue to Doctor Selection
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* ── Step 3: Doctor + Visit details ────────────────────────────── */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Doctor & Visit Details</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedPatient?.fullName} · {formatDisplayDate(appointmentDate)}
                    {timeSlot && ` · ${timeSlot}`}
                  </p>
                </div>
              </div>

              {/* Doctor selector */}
              <div>
                <label htmlFor="appt-doctor" className={labelCls}>
                  Assigned Doctor <span className="text-rose-500">*</span>
                </label>
                {loadingDoctors ? (
                  <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                ) : doctorsError ? (
                  <p className="text-xs text-rose-600 py-2">{doctorsError}</p>
                ) : doctors.length === 0 ? (
                  <p className="text-xs text-rose-600 py-2">No doctors found for this facility.</p>
                ) : (
                  <select
                    id="appt-doctor"
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    required
                    className={fieldCls}
                  >
                    <option value="">— Select a doctor —</option>
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        Dr. {doc.name} ({doc.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Visit type */}
              <div>
                <label htmlFor="appt-visittype" className={labelCls}>
                  Visit Type
                  <span className="text-slate-400 font-normal ml-1">(optional)</span>
                </label>
                <select
                  id="appt-visittype"
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                  className={fieldCls}
                >
                  <option value="">— Select visit type —</option>
                  {VISIT_TYPES.map((vt) => (
                    <option key={vt} value={vt}>{vt}</option>
                  ))}
                </select>
              </div>

              {/* Chief complaint */}
              <div>
                <label htmlFor="appt-complaint" className={labelCls}>
                  Chief Complaint
                  <span className="text-slate-400 font-normal ml-1">(optional)</span>
                </label>
                <input
                  id="appt-complaint"
                  type="text"
                  placeholder="e.g. Fever and headache for 3 days"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className={fieldCls}
                />
              </div>

              {/* Staff notes */}
              <div>
                <label htmlFor="appt-notes" className={labelCls}>
                  Staff Notes
                  <span className="text-slate-400 font-normal ml-1">(optional)</span>
                </label>
                <textarea
                  id="appt-notes"
                  rows={2}
                  placeholder="Any special instructions or notes for this appointment…"
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  className={`${fieldCls} resize-none`}
                />
              </div>

              {/* Booking summary strip */}
              <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600">Booking Summary</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    ['Patient', selectedPatient?.fullName],
                    ['Date', formatDisplayDate(appointmentDate)],
                    ['Time', timeSlot || 'No slot'],
                    ['Doctor', doctors.find((d) => d._id === selectedDoctorId)?.name
                      ? `Dr. ${doctors.find((d) => d._id === selectedDoctorId).name}`
                      : '—'],
                    ['Visit', visitType || 'General'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{k}</p>
                      <p className="text-xs font-semibold text-slate-700 truncate">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error */}
              {submitError && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {submitError}
                </div>
              )}

              {/* Submit */}
              <button
                id="appt-submit-btn"
                type="submit"
                disabled={submitting || !selectedDoctorId || doctors.length === 0}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white
                  font-extrabold text-sm hover:from-sky-700 hover:to-indigo-700
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all active:scale-[0.99] flex items-center justify-center gap-2
                  shadow-md shadow-sky-200"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Scheduling…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book Appointment
                  </>
                )}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
