import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('sahay_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('sahay_token');
    localStorage.removeItem('sahay_user');
    navigate('/');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-mint-100 text-mint-700 flex items-center justify-center font-bold text-xl">
            {user.name ? user.name.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gov-900">
                Welcome, {user.name || 'Citizen'}
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-mint-100 text-mint-800 border border-mint-200">
                Patient Account
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Email: {user.email || 'N/A'} • Electronic Health ID: {user._id ? `SAHAY-${user._id.slice(-6).toUpperCase()}` : 'Generating...'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Placeholder Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-mint-50 text-mint-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gov-900">Digital Health Records</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Placeholder for diagnostic tests, prescriptions, and discharge summaries coming in upcoming phases.
          </p>
          <div className="pt-2 text-xs text-mint-600 font-semibold">
            Status: Module Ready for Phase 2
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gov-900">Hospital Appointments</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Placeholder for booking OPD slots, specialist consultations, and tele-health tokens.
          </p>
          <div className="pt-2 text-xs text-sky-600 font-semibold">
            Status: Module Ready for Phase 2
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gov-50 text-gov-navy flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gov-900">ASHA & Rural Care Link</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Direct linkage to assigned community healthcare workers and village dispensary networks.
          </p>
          <div className="pt-2 text-xs text-gov-navy font-semibold">
            Status: Module Ready for Phase 2
          </div>
        </div>
      </div>
    </div>
  );
}
