import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { govtAPI } from '../../services/api';

// ─── Toast Notification Component ───────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm font-medium pointer-events-auto transition-all duration-300
            ${
              toast.type === 'success'
                ? 'bg-white border-mint-200 text-mint-900'
                : 'bg-white border-rose-200 text-rose-900'
            }`}
        >
          {/* Icon */}
          <div
            className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
              toast.type === 'success'
                ? 'bg-mint-100 text-mint-600'
                : 'bg-rose-100 text-rose-600'
            }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm">{toast.title}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>

          {/* Close */}
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-700 ml-1 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function GovtDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pendingHospitals, setPendingHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // tracks which row is being processed
  const [toasts, setToasts] = useState([]);
  const [fetchError, setFetchError] = useState('');

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const addToast = useCallback((type, title, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    // Auto-dismiss after 4.5 seconds
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── JWT Guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('sahay_token');
    const stored = localStorage.getItem('user') || localStorage.getItem('sahay_user');

    if (!token || !stored) {
      navigate('/auth/govt');
      return;
    }

    // Keep tokens synchronized across storage keys
    if (!localStorage.getItem('token')) {
      localStorage.setItem('token', token);
    }
    if (!localStorage.getItem('sahay_token')) {
      localStorage.setItem('sahay_token', token);
    }

    try {
      const parsed = JSON.parse(stored);
      if (parsed.role !== 'GovtEmployee') {
        // Wrong role — redirect to appropriate portal
        navigate('/');
        return;
      }
      setUser(parsed);
    } catch (e) {
      navigate('/auth/govt');
    }
  }, [navigate]);

  // ── Fetch Pending Hospitals ────────────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      // Ensure token is set in localStorage('token')
      const token = localStorage.getItem('token') || localStorage.getItem('sahay_token');
      if (token && !localStorage.getItem('token')) {
        localStorage.setItem('token', token);
      }

      const res = await axios.get('http://localhost:5000/api/govt/pending-hospitals', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      console.log('Pending hospitals response data:', res.data);

      // Ensure state variable populated matches array format returned by backend
      const hospitals = Array.isArray(res.data)
        ? res.data
        : (res.data?.hospitals || res.data?.pendingHospitals || []);

      setPendingHospitals(hospitals);
    } catch (err) {
      console.error('Error fetching pending hospitals:', err);
      const msg = err.response?.data?.message || 'Failed to load pending hospitals';
      setFetchError(msg);
      if (err.response?.status === 401) {
        // Token expired or extraction failed
        localStorage.removeItem('token');
        localStorage.removeItem('sahay_token');
        localStorage.removeItem('user');
        localStorage.removeItem('sahay_user');
        navigate('/auth/govt');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (user) fetchPending();
  }, [user, fetchPending]);

  // ── Approve / Reject ───────────────────────────────────────────────────────
  const handleVerify = async (hospital, status) => {
    setActionLoading(hospital._id);
    try {
      await govtAPI.verifyHospital(hospital._id, status);

      // Dynamically remove from list instead of re-fetching
      setPendingHospitals((prev) => prev.filter((h) => h._id !== hospital._id));

      if (status === 'approved') {
        addToast(
          'success',
          'Facility Approved',
          `"${hospital.hospitalName}" has been accredited and granted system access.`
        );
      } else {
        addToast(
          'error',
          'Registration Rejected',
          `"${hospital.hospitalName}" (Reg: ${hospital.registrationNumber}) registration has been rejected.`
        );
      }
    } catch (err) {
      addToast(
        'error',
        'Action Failed',
        err.response?.data?.message || 'Verification update failed. Please try again.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('sahay_token');
    localStorage.removeItem('user');
    localStorage.removeItem('sahay_user');
    navigate('/');
  };

  // ── Loading skeleton while auth check runs ─────────────────────────────────
  if (!user) return null;

  return (
    <>
      {/* Toast Portal */}
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gov-800 to-gov-900 text-white flex items-center justify-center shadow-md">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gov-900 tracking-tight">
                  Ministry Health Regulatory Dashboard
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gov-900 text-white">
                  Govt. Officer
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Signed in as <strong className="text-slate-700">{user.name}</strong> &nbsp;·&nbsp;
                {user.email} &nbsp;·&nbsp; Role:{' '}
                <span className="text-gov-navy font-semibold">{user.role}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>

        {/* ── Summary Stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gov-900">
                {loading ? '…' : pendingHospitals.length}
              </p>
              <p className="text-xs text-slate-500 font-medium">Pending Applications</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-mint-100 text-mint-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gov-900">Active</p>
              <p className="text-xs text-slate-500 font-medium">Officer Session Status</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gov-900">Atlas</p>
              <p className="text-xs text-slate-500 font-medium">Database Connected</p>
            </div>
          </div>
        </div>

        {/* ── Pending Hospitals Table ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Header Row */}
          <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-gov-900">
                Pending Hospital Accreditation Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and grant or revoke operating authorization for healthcare facilities.
              </p>
            </div>
            <button
              onClick={fetchPending}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              <svg
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Queue
            </button>
          </div>

          {/* States */}
          {loading ? (
            <div className="px-8 py-16 text-center">
              <span className="inline-block w-8 h-8 border-2 border-slate-300 border-t-gov-900 rounded-full animate-spin mb-3"></span>
              <p className="text-sm text-slate-500">Fetching applications from registry...</p>
            </div>
          ) : fetchError ? (
            <div className="px-8 py-16 text-center space-y-2">
              <div className="text-rose-500 text-2xl">⚠</div>
              <p className="text-sm font-semibold text-slate-800">Failed to Load</p>
              <p className="text-xs text-slate-500">{fetchError}</p>
              <button
                onClick={fetchPending}
                className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-gov-900 rounded-xl hover:bg-black transition-colors"
              >
                Retry
              </button>
            </div>
          ) : pendingHospitals.length === 0 ? (
            <div className="px-8 py-16 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-mint-50 border-2 border-mint-200 text-mint-600 flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  All Applications Reviewed
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  No hospitals are currently awaiting accreditation.
                </p>
              </div>
            </div>
          ) : (
            /* ── Table ────────────────────────────────────────────────────── */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                      Hospital Name
                    </th>
                    <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                      Reg. Number
                    </th>
                    <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                      Contact Phone
                    </th>
                    <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Address
                    </th>
                    <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                      Admin Email
                    </th>
                    <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {pendingHospitals.map((hospital, idx) => {
                    const isProcessing = actionLoading === hospital._id;
                    return (
                      <tr
                        key={hospital._id}
                        className={`group transition-colors ${
                          isProcessing
                            ? 'bg-amber-50/60 opacity-60'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Hospital Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {hospital.hospitalName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gov-900 text-sm">
                                {hospital.hospitalName}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                ID: {hospital._id.slice(-6).toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Reg Number */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                            {hospital.registrationNumber}
                          </span>
                        </td>

                        {/* Contact Phone */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">
                          {hospital.contactPhone}
                        </td>

                        {/* Address */}
                        <td className="px-4 py-4 text-xs text-slate-600 max-w-[200px]">
                          <span className="line-clamp-2">{hospital.address}</span>
                        </td>

                        {/* Admin Email */}
                        <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-600">
                          {hospital.adminEmail}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Pending
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {isProcessing ? (
                            <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
                              <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin inline-block"></span>
                              Processing...
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleVerify(hospital, 'approved')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-mint-600 hover:bg-mint-700 rounded-xl shadow-xs transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                Approve
                              </button>
                              <button
                                onClick={() => handleVerify(hospital, 'rejected')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          {!loading && pendingHospitals.length > 0 && (
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing <strong>{pendingHospitals.length}</strong> pending application(s)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-pulse"></span>
                Live Registry Feed
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
