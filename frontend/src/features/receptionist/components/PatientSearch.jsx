import React, { useState, useCallback } from 'react';
import receptionistApi from '../services/receptionistApi';

// ─── Status badge ──────────────────────────────────────────────────────────────
function QueueBadge({ queueNumber }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Queue #{queueNumber}
    </span>
  );
}

// ─── PatientSearch ─────────────────────────────────────────────────────────────
export default function PatientSearch({ onQueueSuccess }) {
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState(null); // null = not searched yet
  const [searching, setSearching]     = useState(false);
  const [searchError, setSearchError] = useState('');
  // Track per-patient queue state: { [patientId]: 'idle' | 'loading' | 'done' | 'error' }
  const [queueState, setQueueState]   = useState({});
  // Store returned queueNumber per patient
  const [queueNumbers, setQueueNumbers] = useState({});

  // ── Search handler ────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (q.length < 2) {
      setSearchError('Please enter at least 2 characters.');
      return;
    }
    setSearchError('');
    setSearching(true);
    setResults(null);
    setQueueState({});
    setQueueNumbers({});
    try {
      const res = await receptionistApi.searchPatients(q);
      setResults(res.data.patients || []);
    } catch (err) {
      setSearchError(err.response?.data?.message || 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query]);

  // ── Add to queue ──────────────────────────────────────────────────────────
  const handleAddToQueue = useCallback(async (patient) => {
    const pid = patient._id;
    setQueueState((s) => ({ ...s, [pid]: 'loading' }));
    try {
      const res = await receptionistApi.addToQueue(pid);
      const qNum = res.data.appointment?.queueNumber;
      setQueueNumbers((n) => ({ ...n, [pid]: qNum }));
      setQueueState((s) => ({ ...s, [pid]: 'done' }));
      onQueueSuccess?.({ patient, queueNumber: qNum });
    } catch (err) {
      setQueueState((s) => ({ ...s, [pid]: 'error' }));
      // Revert to idle after 3s so user can retry
      setTimeout(() => setQueueState((s) => ({ ...s, [pid]: 'idle' })), 3000);
    }
  }, [onQueueSuccess]);

  return (
    <div className="space-y-4">

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          Search by Name or Phone Number
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="patient-search-input"
              type="text"
              placeholder="e.g. Ramesh or 9876543210"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setResults(null); setSearchError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50
                focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400
                focus:bg-white transition-all"
            />
          </div>
          <button
            id="patient-search-btn"
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold
              hover:bg-violet-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center gap-2 shrink-0"
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

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {results !== null && (
        <div>
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              <svg className="w-10 h-10 mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm font-medium">No patients found</p>
              <p className="text-xs mt-0.5">Try a different name or phone number</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </p>
              {results.map((patient) => {
                const state = queueState[patient._id] || 'idle';
                const qNum  = queueNumbers[patient._id];

                return (
                  <div
                    key={patient._id}
                    className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 flex items-center justify-between gap-4
                      hover:border-violet-200 hover:shadow-sm transition-all"
                  >
                    {/* Patient info */}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{patient.fullName}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {patient.contactPhone && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {patient.contactPhone}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">{patient.gender}</span>
                        {patient.dob && (
                          <span className="text-[11px] text-slate-400">
                            DOB: {new Date(patient.dob).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Queue action */}
                    <div className="shrink-0">
                      {state === 'done' ? (
                        <QueueBadge queueNumber={qNum} />
                      ) : (
                        <button
                          id={`add-queue-${patient._id}`}
                          type="button"
                          onClick={() => handleAddToQueue(patient)}
                          disabled={state === 'loading'}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold
                            transition-all shrink-0
                            ${state === 'error'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-violet-600 text-white hover:bg-violet-700 active:scale-[0.97] disabled:opacity-60'
                            }`}
                        >
                          {state === 'loading' ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : state === 'error' ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Failed — Retry
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                              </svg>
                              Add to Queue
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Empty state (not yet searched) ───────────────────────────────── */}
      {results === null && !searching && (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm font-medium text-slate-400">Search for an existing patient</p>
          <p className="text-xs text-slate-300 mt-0.5">by name or 10-digit phone number</p>
        </div>
      )}
    </div>
  );
}
