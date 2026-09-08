import React, { useState, useEffect, useCallback, useMemo } from 'react';
import doctorApi from '../services/doctorApi';

// ─── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const isCheckedIn = status === 'CheckedIn';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
        isCheckedIn
          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
          : 'bg-amber-100 text-amber-700 border-amber-200'
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {isCheckedIn ? 'Checked In' : 'Waiting'}
    </span>
  );
}

// ─── DoctorQueue Component ────────────────────────────────────────────────────
export default function DoctorQueue({
  selectedAppointmentId,
  onSelectPatient,
  refreshTrigger,
  onQueueLoaded,
}) {
  const [queue, setQueue]               = useState([]);
  const [summary, setSummary]           = useState({ total: 0, urgent: 0, waiting: 0, checkedIn: 0 });
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL'); // 'ALL' | 'Urgent' | 'Routine'

  // ── Fetch Queue ─────────────────────────────────────────────────────────────
  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await doctorApi.getQueue();
      const rawQueue = res.data?.queue || [];
      const rawSummary = res.data?.summary || {
        total: rawQueue.length,
        urgent: rawQueue.filter((a) => a.priority === 'Urgent').length,
        routine: rawQueue.filter((a) => a.priority !== 'Urgent').length,
        checkedIn: rawQueue.filter((a) => a.status === 'CheckedIn').length,
        waiting: rawQueue.filter((a) => a.status === 'Waiting').length,
      };

      setQueue(rawQueue);
      setSummary(rawSummary);
      onQueueLoaded?.({ queue: rawQueue, summary: rawSummary });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patient queue.');
    } finally {
      setLoading(false);
    }
  }, [onQueueLoaded]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue, refreshTrigger]);

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filteredQueue = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return queue.filter((appt) => {
      if (filterPriority !== 'ALL') {
        const p = appt.priority || 'Routine';
        if (p !== filterPriority) return false;
      }
      if (q) {
        const name = (appt.patientFullName || '').toLowerCase();
        const phone = (appt.patientId?.contactPhone || '').toLowerCase();
        const complaint = (appt.chiefComplaint || '').toLowerCase();
        const visitType = (appt.visitType || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || complaint.includes(q) || visitType.includes(q);
      }
      return true;
    });
  }, [queue, searchQuery, filterPriority]);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
              {queue.length}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Patient Queue</h2>
              <p className="text-[11px] text-slate-400">Waiting for consultation</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {summary.urgent > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold border border-rose-200 animate-pulse">
                <span>⚠️</span>
                <span>{summary.urgent} Urgent</span>
              </span>
            )}
            <button
              id="refresh-doctor-queue-btn"
              onClick={fetchQueue}
              disabled={loading}
              title="Refresh queue"
              className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Search & Filter bar ─────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search queue by name, phone..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Quick Priority Toggle Pills */}
          <div className="flex items-center gap-1.5 text-[10px] font-semibold">
            {[
              { id: 'ALL', label: `All (${queue.length})` },
              { id: 'Urgent', label: `Urgent (${summary.urgent})`, alert: summary.urgent > 0 },
              { id: 'Routine', label: `Routine (${summary.routine})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterPriority(tab.id)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterPriority === tab.id
                    ? tab.id === 'Urgent'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="p-3 mx-4 my-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchQueue} className="font-bold underline ml-2">Retry</button>
        </div>
      )}

      {/* ── Queue List Body ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[300px] max-h-[620px]">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state: No patients in queue */}
        {!loading && queue.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-400 flex items-center justify-center mb-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-bold text-slate-700">Queue is Clear</p>
            <p className="text-[11px] text-slate-400 mt-0.5">No waiting patients assigned right now.</p>
          </div>
        )}

        {/* Filtered empty state */}
        {!loading && queue.length > 0 && filteredQueue.length === 0 && (
          <div className="py-8 text-center text-slate-400">
            <p className="text-xs font-semibold">No matching patients</p>
            <button
              onClick={() => { setSearchQuery(''); setFilterPriority('ALL'); }}
              className="text-[11px] text-sky-600 font-bold mt-1 underline"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Patient Cards */}
        {!loading &&
          filteredQueue.map((appt) => {
            const isSelected = selectedAppointmentId === appt._id;
            const isUrgent   = appt.priority === 'Urgent';
            const patient    = appt.patientId;

            // Age calculation
            const age = patient?.dob
              ? Math.floor((new Date() - new Date(patient.dob)) / (1000 * 60 * 60 * 24 * 365.25))
              : null;

            return (
              <div
                key={appt._id}
                onClick={() => onSelectPatient?.(appt)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/70 shadow-sm ring-2 ring-sky-400/40'
                    : isUrgent
                    ? 'border-rose-300 border-l-4 border-l-rose-500 bg-rose-50/70 hover:bg-rose-100/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Queue number badge */}
                    {appt.queueNumber ? (
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          isUrgent ? 'bg-rose-200 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        #{appt.queueNumber}
                      </span>
                    ) : (
                      <span className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                        —
                      </span>
                    )}

                    {/* Patient Name */}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                        {appt.patientFullName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        {patient?.gender && <span>{patient.gender}</span>}
                        {age !== null && (
                          <>
                            <span>·</span>
                            <span>{age} yrs</span>
                          </>
                        )}
                        {patient?.bloodGroup && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-rose-600">{patient.bloodGroup}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Priority & Status */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isUrgent && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                        Urgent
                      </span>
                    )}
                    <StatusPill status={appt.status} />
                  </div>
                </div>

                {/* Chief Complaint / Notes snippet */}
                {appt.chiefComplaint && (
                  <div className="mt-2 text-[11px] text-slate-600 bg-white/70 px-2.5 py-1 rounded-xl border border-slate-100 line-clamp-1">
                    <span className="font-semibold text-slate-400 text-[10px] uppercase mr-1">Complaint:</span>
                    {appt.chiefComplaint}
                  </div>
                )}

                {/* Footer strip: phone & time */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100/70">
                  <span className="font-mono">{patient?.contactPhone || 'No phone'}</span>
                  <span>{appt.timeSlot || 'Walk-in'}</span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
