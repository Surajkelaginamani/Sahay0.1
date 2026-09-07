import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientRegistrationForm from '../../features/receptionist/components/PatientRegistrationForm';
import QueueManager from '../../features/receptionist/components/QueueManager';

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl border
      text-sm font-medium max-w-sm animate-fade-in
      ${isSuccess ? 'bg-white border-emerald-200' : 'bg-white border-rose-200'}`}>
      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
        ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
        {isSuccess ? (
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

// ─── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'queue',
    label: 'Today\'s Queue',
    shortLabel: 'Queue',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'register',
    label: 'Register Patient',
    shortLabel: 'Register',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function ReceptionistDashboard() {
  const navigate  = useNavigate();
  const [user, setUser]           = useState(null);
  const [activeTab, setActiveTab] = useState('queue');
  const [toast, setToast]         = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  // Trigger re-fetch of QueueManager when a new patient is registered
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

  // ── Callbacks from children ─────────────────────────────────────────────
  const handlePatientRegistered = useCallback(({ type, patient }) => {
    if (type === 'registered') {
      showToast(
        'success',
        'Patient Registered',
        `${patient.fullName} has been registered and added to the facility.`
      );
      // Switch to queue tab and trigger refresh
      setActiveTab('queue');
      setQueueRefresh((n) => n + 1);
    } else if (type === 'found') {
      showToast(
        'success',
        'Patient Found',
        `Using existing record for ${patient.fullName}.`
      );
      setActiveTab('queue');
    }
  }, [showToast]);

  const handleCheckInSuccess = useCallback(({ patientName, queueNumber }) => {
    showToast(
      'success',
      'Patient Checked In',
      `${patientName} is now Queue #${queueNumber}.`
    );
  }, [showToast]);

  if (!user) return null;

  return (
    <div className="min-h-[85vh] bg-gradient-to-br from-slate-50 via-rose-50/20 to-pink-50/25 px-4 sm:px-8 py-8">
      <Toast toast={toast} />

      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-6 sm:px-8 py-6
          flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600
              flex items-center justify-center text-white shadow-lg shadow-rose-200/50 shrink-0">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5">
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
                  {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </span>
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick register shortcut */}
            <button
              onClick={() => setActiveTab('register')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm
                ${activeTab === 'register'
                  ? 'bg-rose-500 text-white shadow-rose-200'
                  : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-200 hover:from-rose-600 hover:to-pink-700 active:scale-[0.98]'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Register Walk-in</span>
              <span className="sm:hidden">Register</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200
                text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── Two-column layout (Queue | Register) ─────────────────────── */}
        {/* On lg+ screens: always show both panels side-by-side */}
        {/* On smaller screens: tabbed navigation */}

        {/* Tab nav (visible < lg) */}
        <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm lg:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all
                ${activeTab === tab.id
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              {tab.icon}
              <span>{tab.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* ── Left: Queue Manager (3/5 width on desktop) ────────────── */}
          <div className={`lg:col-span-3 ${activeTab !== 'queue' ? 'hidden lg:block' : ''}`}>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Panel header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Today's Appointment Queue</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
              <div className="p-5">
                <QueueManager
                  onCheckInSuccess={handleCheckInSuccess}
                  refreshTrigger={queueRefresh}
                />
              </div>
            </div>
          </div>

          {/* ── Right: Patient Registration (2/5 width on desktop) ────── */}
          <div className={`lg:col-span-2 ${activeTab !== 'register' ? 'hidden lg:block' : ''}`}>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Panel header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-rose-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Register / Find Patient</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Search existing or register new walk-in</p>
                </div>
              </div>
              <div className="p-5 max-h-[calc(100vh-220px)] overflow-y-auto">
                <PatientRegistrationForm onSuccess={handlePatientRegistered} />
              </div>
            </div>
          </div>

        </div>

        {/* ── Footer strip ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
              <svg className="w-4.5 h-4.5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today</p>
              <p className="text-xs font-semibold text-slate-700">
                {currentTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OPD Hours</p>
              <p className="text-xs font-semibold text-slate-700">8:00 AM – 6:00 PM</p>
              <span className="text-[10px] font-semibold text-emerald-600">● Open</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <svg className="w-4.5 h-4.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security</p>
              <p className="text-xs font-semibold text-slate-700">JWT Protected</p>
              <p className="text-[10px] text-slate-400">Role: Receptionist</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
