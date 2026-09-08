import React, { useState, useEffect, useCallback, useMemo } from 'react';
import receptionistApi from '../services/receptionistApi';

// ─── Status pill ───────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  Scheduled: 'bg-sky-100 text-sky-700 border-sky-200',
  Waiting:   'bg-amber-100 text-amber-700 border-amber-200',
  CheckedIn: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Completed: 'bg-slate-100 text-slate-500 border-slate-200',
  Cancelled: 'bg-rose-100 text-rose-600 border-rose-200',
};

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
        STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 border-slate-200'
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status || 'Scheduled'}
    </span>
  );
}

// ─── Relative Date Helper ─────────────────────────────────────────────────────
function getRelativeDateLabel(dateStr) {
  if (!dateStr) return '';
  const target = new Date(dateStr);
  const now = new Date();
  
  // Set both to start of day for clean day diff
  const tMid = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const nMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((tMid - nMid) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UpcomingAppointments({ onBookNew }) {
  const [appointments, setAppointments]         = useState([]);
  const [doctors, setDoctors]                   = useState([]);
  const [doctorsMap, setDoctorsMap]             = useState({});
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState('');
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedHorizon, setSelectedHorizon]   = useState('ALL'); // 'ALL' | '7days' | '30days'
  const [copiedPhone, setCopiedPhone]           = useState('');

  // ── Fetch doctors for filter dropdown ──────────────────────────────────────
  const fetchDoctors = useCallback(async () => {
    try {
      const res = await receptionistApi.getFacilityDoctors();
      const docs = res.data.doctors || [];
      setDoctors(docs);
      const map = {};
      docs.forEach((d) => {
        map[d._id] = d.name;
      });
      setDoctorsMap(map);
    } catch {
      // Non-critical, fallback to embedded names
    }
  }, []);

  // ── Fetch upcoming appointments ───────────────────────────────────────────
  const fetchUpcoming = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await receptionistApi.getUpcomingAppointments();
      const raw = res.data?.appointments || [];

      // Sort chronologically ascending by appointmentDate
      const sorted = [...raw].sort((a, b) => {
        const da = new Date(a.appointmentDate).getTime();
        const db = new Date(b.appointmentDate).getTime();
        return da - db;
      });

      setAppointments(sorted);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load upcoming appointments. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
    fetchUpcoming();
  }, [fetchDoctors, fetchUpcoming]);

  // ── Helper to resolve Doctor name ─────────────────────────────────────────
  const getDoctorName = useCallback(
    (appt) => {
      if (appt.doctorName) return appt.doctorName;
      if (appt.assignedDoctorId && typeof appt.assignedDoctorId === 'object' && appt.assignedDoctorId.name) {
        return appt.assignedDoctorId.name;
      }
      const docId = typeof appt.assignedDoctorId === 'object' ? appt.assignedDoctorId?._id : appt.assignedDoctorId;
      if (docId && doctorsMap[docId]) {
        return doctorsMap[docId];
      }
      return null;
    },
    [doctorsMap]
  );

  // ── Filtered appointments ─────────────────────────────────────────────────
  const filteredAppointments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = new Date();

    return appointments.filter((appt) => {
      // 1. Doctor filter
      if (selectedDoctorId !== 'ALL') {
        const docId = typeof appt.assignedDoctorId === 'object' ? appt.assignedDoctorId?._id : appt.assignedDoctorId;
        if (docId !== selectedDoctorId) return false;
      }

      // 2. Priority filter
      if (selectedPriority !== 'ALL') {
        const priority = appt.priority || 'Routine';
        if (priority !== selectedPriority) return false;
      }

      // 3. Time horizon filter
      if (selectedHorizon !== 'ALL') {
        const apptDate = new Date(appt.appointmentDate);
        const diffDays = (apptDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (selectedHorizon === '7days' && diffDays > 7) return false;
        if (selectedHorizon === '30days' && diffDays > 30) return false;
      }

      // 4. Text search query
      if (q) {
        const patientName = (appt.patientFullName || '').toLowerCase();
        const phone = (appt.patientId?.contactPhone || '').toLowerCase();
        const docName = (getDoctorName(appt) || '').toLowerCase();
        const visitType = (appt.visitType || '').toLowerCase();
        const complaint = (appt.chiefComplaint || '').toLowerCase();

        const matches =
          patientName.includes(q) ||
          phone.includes(q) ||
          docName.includes(q) ||
          visitType.includes(q) ||
          complaint.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [appointments, searchQuery, selectedDoctorId, selectedPriority, selectedHorizon, getDoctorName]);

  // ── Summary Metrics ───────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const total = appointments.length;
    const urgent = appointments.filter((a) => a.priority === 'Urgent').length;
    const next7Days = appointments.filter((a) => {
      const diff = (new Date(a.appointmentDate) - new Date()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).length;
    
    // Unique assigned doctors
    const uniqueDocs = new Set(
      appointments
        .map((a) => (typeof a.assignedDoctorId === 'object' ? a.assignedDoctorId?._id : a.assignedDoctorId))
        .filter(Boolean)
    ).size;

    return { total, urgent, next7Days, uniqueDocs };
  }, [appointments]);

  // ── Phone Copy handler ────────────────────────────────────────────────────
  const handleCopyPhone = (phone) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(''), 2000);
  };

  return (
    <div className="space-y-5">
      {/* ── Metric Stat Tiles ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Upcoming</p>
            <p className="text-xl font-extrabold text-slate-800 leading-tight">{metrics.total}</p>
            <p className="text-[10px] text-slate-400">Total scheduled</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Next 7 Days</p>
            <p className="text-xl font-extrabold text-sky-800 leading-tight">{metrics.next7Days}</p>
            <p className="text-[10px] text-slate-400">Near-term visits</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Urgent</p>
            <p className="text-xl font-extrabold text-rose-700 leading-tight">{metrics.urgent}</p>
            <p className="text-[10px] text-slate-400">High priority</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Doctors</p>
            <p className="text-xl font-extrabold text-violet-800 leading-tight">{metrics.uniqueDocs}</p>
            <p className="text-[10px] text-slate-400">Booked with patients</p>
          </div>
        </div>
      </div>

      {/* ── Control Bar: Search & Filters ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            id="upcoming-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, phone, doctor, visit type..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800
              placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Doctor filter */}
          {doctors.length > 0 && (
            <select
              id="upcoming-doctor-filter"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700
                focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium"
            >
              <option value="ALL">All Doctors</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  Dr. {doc.name}
                </option>
              ))}
            </select>
          )}

          {/* Priority filter */}
          <select
            id="upcoming-priority-filter"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700
              focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="Routine">Routine Only</option>
            <option value="Urgent">Urgent Only</option>
          </select>

          {/* Horizon filter */}
          <select
            id="upcoming-horizon-filter"
            value={selectedHorizon}
            onChange={(e) => setSelectedHorizon(e.target.value)}
            className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700
              focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium"
          >
            <option value="ALL">All Future Dates</option>
            <option value="7days">Next 7 Days</option>
            <option value="30days">Next 30 Days</option>
          </select>

          {/* Refresh Button */}
          <button
            id="upcoming-refresh-btn"
            onClick={fetchUpcoming}
            disabled={loading}
            title="Refresh appointments"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800
              transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Book New shortcut button */}
          {onBookNew && (
            <button
              onClick={onBookNew}
              className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold
                shadow-sm shadow-teal-200 flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Book Appointment</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={fetchUpcoming}
            className="font-bold underline hover:no-underline text-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading Skeleton ───────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Empty State: No appointments at all ─────────────────────────────── */}
      {!loading && appointments.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-3">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Upcoming Appointments</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            There are no future appointments scheduled beyond today. You can book an advance appointment anytime.
          </p>
          {onBookNew && (
            <button
              onClick={onBookNew}
              className="mt-4 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold
                shadow-sm shadow-teal-200 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Schedule First Appointment
            </button>
          )}
        </div>
      )}

      {/* ── Empty Filter Results ───────────────────────────────────────────── */}
      {!loading && appointments.length > 0 && filteredAppointments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-slate-200 rounded-2xl bg-white">
          <svg className="w-10 h-10 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm font-bold text-slate-700">No matching appointments</p>
          <p className="text-xs text-slate-400 mt-0.5">
            No appointments match your current search and filter settings.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDoctorId('ALL');
              setSelectedPriority('ALL');
              setSelectedHorizon('ALL');
            }}
            className="mt-3 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* ── Data Table ─────────────────────────────────────────────────────── */}
      {!loading && filteredAppointments.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-left border-b border-slate-100">
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Date & Time
                </th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Patient Name
                </th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Phone Number
                </th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Assigned Doctor
                </th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Visit Details
                </th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Priority
                </th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAppointments.map((appt) => {
                const docName = getDoctorName(appt);
                const isUrgent = appt.priority === 'Urgent';
                const apptDate = new Date(appt.appointmentDate);
                const relLabel = getRelativeDateLabel(appt.appointmentDate);
                const phone = appt.patientId?.contactPhone;

                return (
                  <tr
                    key={appt._id}
                    className={`transition-colors group ${
                      isUrgent
                        ? 'bg-rose-50/70 hover:bg-rose-100/60 border-l-4 border-rose-400'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* 1. Date & Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-teal-600 uppercase leading-none">
                            {apptDate.toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="text-xs font-black text-teal-800 leading-tight">
                            {apptDate.getDate()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-800 text-xs">
                              {apptDate.toLocaleDateString('en-IN', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                            {relLabel && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-teal-100 text-teal-700">
                                {relLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{appt.timeSlot || 'Standard Slot'}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 2. Patient Name */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800 text-xs leading-tight">
                        {appt.patientFullName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        {appt.patientId?.gender && <span>{appt.patientId.gender}</span>}
                        {appt.patientId?.dob && (
                          <>
                            <span>·</span>
                            <span>
                              {Math.floor(
                                (new Date() - new Date(appt.patientId.dob)) / (1000 * 60 * 60 * 24 * 365.25)
                              )}{' '}
                              yrs
                            </span>
                          </>
                        )}
                        {appt.patientId?.abhaId && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-slate-400">ABHA: {appt.patientId.abhaId}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 3. Phone Number */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {phone ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-slate-600 font-semibold">{phone}</span>
                          <button
                            onClick={() => handleCopyPhone(phone)}
                            title="Copy phone number"
                            className="text-slate-400 hover:text-teal-600 transition-colors p-1"
                          >
                            {copiedPhone === phone ? (
                              <span className="text-[9px] font-bold text-emerald-600">Copied!</span>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    {/* 4. Assigned Doctor */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {docName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                            Dr
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 leading-tight">
                              Dr. {docName}
                            </p>
                            {appt.assignedDoctorId?.email && (
                              <p className="text-[10px] text-slate-400 leading-tight">
                                {appt.assignedDoctorId.email}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* 5. Visit Details */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="space-y-0.5">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {appt.visitType || 'General Consultation'}
                        </span>
                        {appt.chiefComplaint && (
                          <p className="text-[10px] text-slate-500 truncate" title={appt.chiefComplaint}>
                            {appt.chiefComplaint}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* 6. Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isUrgent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200">
                          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Urgent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                          Routine
                        </span>
                      )}
                    </td>

                    {/* 7. Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusPill status={appt.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Table footer info */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Showing <strong className="font-semibold text-slate-700">{filteredAppointments.length}</strong> of{' '}
              <strong className="font-semibold text-slate-700">{appointments.length}</strong> upcoming appointments
            </span>
            <span className="text-[10px] text-slate-400">
              Sorted chronologically
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
