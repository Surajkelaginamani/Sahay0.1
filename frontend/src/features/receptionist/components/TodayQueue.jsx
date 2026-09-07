import React, { useState, useEffect, useCallback } from 'react';
import receptionistApi from '../services/receptionistApi';

// ─── Status pill ───────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  Waiting:   'bg-amber-100 text-amber-700 border-amber-200',
  Scheduled: 'bg-sky-100 text-sky-700 border-sky-200',
  CheckedIn: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Completed: 'bg-slate-100 text-slate-500 border-slate-200',
  Cancelled: 'bg-rose-100 text-rose-600 border-rose-200',
};

function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}

// ─── TodayQueue ───────────────────────────────────────────────────────────────
export default function TodayQueue({ refreshTrigger, onCheckInSuccess }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [checkingIn, setCheckingIn]     = useState({}); // { [apptId]: true }

  // ── Fetch today's queue via getFacilityPatients?today=true ─────────────────
  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await receptionistApi.getFacilityPatients(true); // today=true
      setAppointments(res.data.appointments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load today\'s queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and whenever refreshTrigger changes
  useEffect(() => { fetchQueue(); }, [fetchQueue, refreshTrigger]);

  // ── Check-in handler ───────────────────────────────────────────────────────
  const handleCheckIn = useCallback(async (appt) => {
    setCheckingIn((s) => ({ ...s, [appt._id]: true }));
    try {
      const res = await receptionistApi.checkIn(appt._id);
      const qNum = res.data.appointment?.queueNumber;
      const name = appt.patientFullName || 'Patient';
      onCheckInSuccess?.({ patientName: name, queueNumber: qNum });
      // Refresh list
      await fetchQueue();
    } catch (err) {
      // Show inline error for 3s
      setError(err.response?.data?.message || 'Check-in failed.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setCheckingIn((s) => ({ ...s, [appt._id]: false }));
    }
  }, [fetchQueue, onCheckInSuccess]);

  // ── Summary counts ─────────────────────────────────────────────────────────
  const counts = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">

      {/* ── Summary badges ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Total',     val: appointments.length, color: 'bg-slate-100 text-slate-700' },
          { label: 'Waiting',   val: counts.Waiting   || 0, color: 'bg-amber-100 text-amber-700' },
          { label: 'Checked In',val: counts.CheckedIn || 0, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Completed', val: counts.Completed || 0, color: 'bg-violet-100 text-violet-700' },
        ].map(({ label, val, color }) => (
          <div key={label} className={`${color} px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5`}>
            <span className="text-base leading-none">{val}</span>
            <span className="opacity-70">{label}</span>
          </div>
        ))}
        <button
          id="refresh-queue-btn"
          onClick={fetchQueue}
          disabled={loading}
          className="ml-auto px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-semibold
            text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors disabled:opacity-50
            flex items-center gap-1.5"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {loading && appointments.length === 0 && (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!loading && appointments.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-14 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-semibold">No patients in queue today</p>
          <p className="text-xs mt-0.5 text-slate-300">Register or search patients to add them</p>
        </div>
      )}

      {/* ── Queue table ──────────────────────────────────────────────────── */}
      {appointments.length > 0 && (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left">
                {['#', 'Patient', 'Phone', 'Status', 'Time', 'Action'].map((h) => (
                  <th key={h} className="pb-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {appointments.map((appt) => {
                const isCheckinable = ['Waiting', 'Scheduled'].includes(appt.status);
                const isLoading     = checkingIn[appt._id];

                return (
                  <tr key={appt._id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Queue number */}
                    <td className="py-3 px-2">
                      {appt.queueNumber ? (
                        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center font-extrabold text-violet-700 text-sm">
                          {appt.queueNumber}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
                          —
                        </div>
                      )}
                    </td>

                    {/* Patient name */}
                    <td className="py-3 px-2">
                      <p className="font-semibold text-slate-800 text-sm leading-tight">
                        {appt.patientFullName}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {appt.patientId?.gender || ''}
                      </p>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-2 text-xs text-slate-500">
                      {appt.patientId?.contactPhone || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-2">
                      <StatusPill status={appt.status} />
                    </td>

                    {/* Appointment time */}
                    <td className="py-3 px-2 text-[11px] text-slate-400 whitespace-nowrap">
                      {appt.appointmentDate
                        ? new Date(appt.appointmentDate).toLocaleTimeString('en-IN', {
                            hour: '2-digit', minute: '2-digit', hour12: true,
                          })
                        : '—'}
                    </td>

                    {/* Check-in action */}
                    <td className="py-3 px-2">
                      {isCheckinable ? (
                        <button
                          id={`checkin-${appt._id}`}
                          type="button"
                          onClick={() => handleCheckIn(appt)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600
                            text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors
                            disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {isLoading ? 'Checking in…' : 'Check In'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-300 italic">
                          {appt.status === 'Completed' ? 'Done' : appt.status === 'Cancelled' ? 'Cancelled' : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
