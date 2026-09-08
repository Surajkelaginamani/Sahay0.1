import React, { useState, useEffect, useCallback } from 'react';
import receptionistApi from '../services/receptionistApi';

// ─── DoctorCard ────────────────────────────────────────────────────────────────
function DoctorCard({ doctor, patientCount }) {
  // Derive initials from name
  const initials = doctor.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Colour palette cycles through a preset set per index
  const PALETTE = [
    { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-300' },
    { bg: 'bg-sky-100',    text: 'text-sky-700',    ring: 'ring-sky-300'    },
    { bg: 'bg-teal-100',   text: 'text-teal-700',   ring: 'ring-teal-300'   },
    { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-300' },
    { bg: 'bg-pink-100',   text: 'text-pink-700',   ring: 'ring-pink-300'   },
  ];
  const palette = PALETTE[doctor._avatarIndex % PALETTE.length] || PALETTE[0];

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
      {/* Avatar + active dot */}
      <div className="relative shrink-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-extrabold
            ${palette.bg} ${palette.text} ring-2 ${palette.ring}`}
        >
          {initials}
        </div>
        {/* Always-green "active" indicator dot */}
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white
            shadow-sm ring-1 ring-emerald-300"
          title="Active"
        />
      </div>

      {/* Name + email */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-800 truncate leading-tight">
          Dr. {doctor.name}
        </p>
        <p className="text-[10px] text-slate-400 truncate">{doctor.email}</p>
      </div>

      {/* Patient load badge */}
      {patientCount !== undefined && (
        <span
          className={`shrink-0 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5
            rounded-lg text-[10px] font-bold border transition-colors
            ${patientCount > 0
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-50 text-slate-400 border-slate-200'}`}
          title={`${patientCount} patient${patientCount !== 1 ? 's' : ''} today`}
        >
          {patientCount}
        </span>
      )}
    </div>
  );
}

// ─── DoctorRoster ──────────────────────────────────────────────────────────────
/**
 * DoctorRoster — sidebar/panel that shows all facility doctors as "active" with
 * a green indicator dot and their live patient count for today.
 *
 * Props:
 *  - compact   {boolean} — if true, shows a condensed pill-style list (for sidebars)
 *  - queueData {Array}   — optional: pass today's queue array for patient-count lookup
 *  - className {string}  — extra Tailwind classes for the wrapper
 */
export default function DoctorRoster({ compact = false, queueData = [], className = '' }) {
  const [doctors, setDoctors]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await receptionistApi.getFacilityDoctors();
      const docs = (res.data.doctors || []).map((d, i) => ({
        ...d,
        _avatarIndex: i,
      }));
      setDoctors(docs);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // ── Build patient-count map from queue data ─────────────────────────────────
  const patientCountMap = {};
  queueData.forEach((appt) => {
    const docId =
      typeof appt.assignedDoctorId === 'object'
        ? appt.assignedDoctorId?._id
        : appt.assignedDoctorId;
    if (docId) {
      patientCountMap[docId] = (patientCountMap[docId] || 0) + 1;
    }
  });

  // ── Compact mode: horizontal pill row ──────────────────────────────────────
  if (compact) {
    return (
      <div className={`flex items-center flex-wrap gap-2 ${className}`}>
        {loading && (
          <span className="text-[11px] text-slate-400 animate-pulse">Loading doctors…</span>
        )}
        {!loading && doctors.length === 0 && !error && (
          <span className="text-[11px] text-slate-400">No doctors on record.</span>
        )}
        {doctors.map((doc) => (
          <div
            key={doc._id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs shadow-sm"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-slate-700">Dr. {doc.name}</span>
            {patientCountMap[doc._id] !== undefined && (
              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md">
                {patientCountMap[doc._id]}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ── Full panel mode ─────────────────────────────────────────────────────────
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2">
          {/* Pulsing green dot for "on duty" */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Doctors On Duty
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {doctors.length > 0 && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {doctors.length} active
            </span>
          )}
          <button
            id="doctor-roster-refresh"
            type="button"
            onClick={fetchDoctors}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 text-slate-500"
            title="Refresh roster"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-2">
        {/* Loading skeleton */}
        {loading && doctors.length === 0 && (
          <div className="space-y-2 p-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 bg-slate-100 rounded w-3/4" />
                  <div className="h-2 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-100">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && doctors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <svg className="w-10 h-10 text-slate-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-xs font-medium">No doctors registered</p>
          </div>
        )}

        {/* Doctor list */}
        {doctors.map((doc) => (
          <DoctorCard
            key={doc._id}
            doctor={doc}
            patientCount={patientCountMap[doc._id] ?? 0}
          />
        ))}
      </div>

      {/* Footer: last refresh timestamp */}
      {lastRefresh && !loading && (
        <div className="px-4 py-2 border-t border-slate-100 text-[10px] text-slate-400 text-right">
          Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>
      )}
    </div>
  );
}
