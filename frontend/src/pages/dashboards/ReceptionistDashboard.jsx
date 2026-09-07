import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientRegistrationForm from '../../features/receptionist/components/PatientRegistrationForm';
import PatientSearch           from '../../features/receptionist/components/PatientSearch';
import TodayQueue              from '../../features/receptionist/components/TodayQueue';

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const ok = toast.type === 'success';
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl border
      text-sm font-medium max-w-sm
      ${ok ? 'bg-white border-emerald-200' : 'bg-white border-rose-200'}`}
    >
      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
        ${ok ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}
      >
        {ok ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-slate-900 text-sm">{toast.title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'queue',
    label: "Today's Queue",
    shortLabel: 'Queue',
    color: 'amber',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'register',
    label: 'Register New Patient',
    shortLabel: 'Register',
    color: 'rose',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'search',
    label: 'Search & Add Existing',
    shortLabel: 'Search',
    color: 'violet',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
];

const TAB_ACTIVE_CLASSES = {
  amber:  'bg-amber-500 text-white shadow-sm shadow-amber-200',
  rose:   'bg-rose-500 text-white shadow-sm shadow-rose-200',
  violet: 'bg-violet-600 text-white shadow-sm shadow-violet-200',
};

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function ReceptionistDashboard() {
  const navigate = useNavigate();

  const [user, setUser]           = useState(null);
  const [activeTab, setActiveTab] = useState('queue');
  const [toast, setToast]         = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  // Increment to trigger TodayQueue re-fetch
  const [queueRefresh, setQueueRefresh] = useState(0);

  // ── Live clock ──────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('user') || localStorage.getItem('sahay_user');
    if (!stored) { navigate('/auth/hospital/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'Receptionist') { navigate('/'); return; }
    setUser(parsed);
  }, [navigate]);

  // ── Toast helper ────────────────────────────────────────────────────────
  const showToast = useCallback((type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────
  const handleLogout = () => {
    ['token', 'sahay_token', 'user', 'sahay_user'].forEach((k) => localStorage.removeItem(k));
    navigate('/auth/hospital/login');
  };

  // ── Child callbacks ─────────────────────────────────────────────────────
  const handlePatientRegistered = useCallback(({ type, patient, queueInfo }) => {
    if (type === 'registered') {
      if (queueInfo) {
        const docText = queueInfo.doctorName ? ` for Dr. ${queueInfo.doctorName}` : '';
        showToast('success', 'Patient Registered & Queued',
          `${patient.fullName} registered and queued as #${queueInfo.queueNumber}${docText}.`);
      } else {
        showToast('success', 'Patient Registered',
          `${patient.fullName} has been registered with a login account.`);
      }
      setActiveTab('queue');
      setQueueRefresh((n) => n + 1);
    } else if (type === 'found') {
      showToast('success', 'Patient Found', `Using existing record for ${patient.fullName}.`);
      setActiveTab('search');
    }
  }, [showToast]);

  const handleQueueSuccess = useCallback(({ patient, doctorName, queueNumber }) => {
    const docText = doctorName ? ` for Dr. ${doctorName}` : '';
    showToast('success', 'Added to Queue',
      `${patient.fullName} is now Queue #${queueNumber}${docText}.`);
    setQueueRefresh((n) => n + 1);
  }, [showToast]);

  const handleCheckInSuccess = useCallback(({ patientName, queueNumber }) => {
    showToast('success', 'Patient Checked In',
      `${patientName} is now Queue #${queueNumber}.`);
  }, [showToast]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-rose-50/20 px-4 sm:px-8 py-8">
      <Toast toast={toast} />

      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-6 sm:px-8 py-6
          flex flex-col md:flex-row md:items-center justify-between gap-5"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600
              flex items-center justify-center text-white shadow-lg shadow-rose-200/50 shrink-0"
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Reception Desk
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1
                  rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-slate-700">{user.name}</span>
                <span className="text-slate-300">·</span>
                <span>{user.hospitalName || 'Healthcare Facility'}</span>
                <span className="text-slate-300">·</span>
                <span className="font-mono text-slate-600 text-xs">
                  {currentTime.toLocaleTimeString('en-IN', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
                  })}
                </span>
              </p>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="header-register-btn"
              onClick={() => setActiveTab('register')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
                bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-200
                hover:from-rose-600 hover:to-pink-700 active:scale-[0.98] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Register Walk-in</span>
              <span className="sm:hidden">Register</span>
            </button>
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200
                text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:border-rose-200
                hover:text-rose-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── Tab navigation ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 flex gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl
                  text-sm font-semibold transition-all
                  ${isActive
                    ? TAB_ACTIVE_CLASSES[tab.color]
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab panels ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Panel header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            {(() => {
              const tab = TABS.find((t) => t.id === activeTab);
              const colorMap = {
                amber:  'bg-amber-100 text-amber-700',
                rose:   'bg-rose-100 text-rose-700',
                violet: 'bg-violet-100 text-violet-700',
              };
              return (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorMap[tab.color]}`}>
                    {tab.icon}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">{tab.label}</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {activeTab === 'queue'    && "All of today's patient appointments"}
                      {activeTab === 'register' && 'Register a new walk-in patient with login credentials'}
                      {activeTab === 'search'   && 'Find an existing patient and add them to the queue'}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Panel body */}
          <div className="p-6">

            {/* Tab 1: Today's Queue */}
            {activeTab === 'queue' && (
              <TodayQueue
                refreshTrigger={queueRefresh}
                onCheckInSuccess={handleCheckInSuccess}
              />
            )}

            {/* Tab 2: Register New Patient */}
            {activeTab === 'register' && (
              <PatientRegistrationForm onSuccess={handlePatientRegistered} />
            )}

            {/* Tab 3: Search & Add Existing */}
            {activeTab === 'search' && (
              <PatientSearch onQueueSuccess={handleQueueSuccess} />
            )}

          </div>
        </div>

        {/* ── Footer info strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: (
                <svg className="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
              bg: 'bg-sky-100',
              label: 'Today',
              value: currentTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
            },
            {
              icon: (
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              bg: 'bg-emerald-100',
              label: 'OPD Hours',
              value: '8:00 AM – 6:00 PM',
              sub: '● Open',
              subColor: 'text-emerald-600',
            },
            {
              icon: (
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              bg: 'bg-slate-100',
              label: 'Security',
              value: 'JWT Protected',
              sub: 'Role: Receptionist',
              subColor: 'text-slate-400',
            },
          ].map(({ icon, bg, label, value, sub, subColor }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                {icon}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-xs font-semibold text-slate-700">{value}</p>
                {sub && <p className={`text-[10px] font-semibold ${subColor}`}>{sub}</p>}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
