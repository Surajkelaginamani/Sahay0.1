import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { hospitalAdminAPI } from '../../services/api';

// ─── Role config ─────────────────────────────────────────────────────────────
const STAFF_ROLES = [
  { value: 'Doctor', label: 'Doctor', color: 'text-sky-700 bg-sky-100 border-sky-200' },
  { value: 'ASHA', label: 'ASHA / ANM Worker', color: 'text-mint-700 bg-mint-100 border-mint-200' },
  { value: 'LabHead', label: 'Lab Head / Diagnostics', color: 'text-purple-700 bg-purple-100 border-purple-200' },
  { value: 'FacilityAdmin', label: 'Facility Administrator', color: 'text-amber-700 bg-amber-100 border-amber-200' },
];

function getRoleBadge(role) {
  const found = STAFF_ROLES.find((r) => r.value === role);
  return found
    ? found.color
    : 'text-slate-700 bg-slate-100 border-slate-200';
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm font-medium pointer-events-auto
            ${t.type === 'success' ? 'bg-white border-mint-200 text-mint-900' : 'bg-white border-rose-200 text-rose-900'}`}
        >
          <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
            ${t.type === 'success' ? 'bg-mint-100 text-mint-600' : 'bg-rose-100 text-rose-600'}`}
          >
            {t.type === 'success' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm">{t.title}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.message}</p>
          </div>
          <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-slate-700 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function HospitalAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Doctor',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const addToast = useCallback((type, title, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── JWT Guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('sahay_token');
    const stored = localStorage.getItem('sahay_user');

    if (!token || !stored) {
      navigate('/auth/hospital/login');
      return;
    }

    const parsed = JSON.parse(stored);
    if (parsed.role !== 'HospitalAdmin') {
      navigate('/');
      return;
    }

    setUser(parsed);
  }, [navigate]);

  // ── Fetch Staff ───────────────────────────────────────────────────────────
  const fetchStaff = useCallback(async () => {
    setLoadingStaff(true);
    try {
      const res = await hospitalAdminAPI.getStaff();
      setStaff(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('sahay_token');
        localStorage.removeItem('sahay_user');
        navigate('/auth/hospital/login');
      }
    } finally {
      setLoadingStaff(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (user) fetchStaff();
  }, [user, fetchStaff]);

  // ── Create Staff ──────────────────────────────────────────────────────────
  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const res = await hospitalAdminAPI.createStaff(formData);

      // Prepend new staff member to the table
      setStaff((prev) => [res.data.staff, ...prev]);

      addToast(
        'success',
        'Staff Account Created',
        `${formData.name} (${formData.role}) has been added to your hospital staff.`
      );

      // Reset form
      setFormData({ name: '', email: '', password: '', role: 'Doctor' });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create staff account. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sahay_token');
    localStorage.removeItem('sahay_user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <>
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white flex items-center justify-center shadow-md">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gov-900 tracking-tight">
                  {user.hospitalName || 'Hospital Administration'}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Accredited
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Administrator: <strong className="text-slate-700">{user.name}</strong> &nbsp;·&nbsp;
                {user.email}
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

        {/* ── Stats Row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Staff', value: loadingStaff ? '…' : staff.length, icon: '👥', color: 'bg-sky-50 text-sky-700' },
            { label: 'Doctors', value: loadingStaff ? '…' : staff.filter((s) => s.role === 'Doctor').length, icon: '🩺', color: 'bg-mint-50 text-mint-700' },
            { label: 'ASHA Workers', value: loadingStaff ? '…' : staff.filter((s) => s.role === 'ASHA').length, icon: '🌿', color: 'bg-emerald-50 text-emerald-700' },
            { label: 'Lab & Admin', value: loadingStaff ? '…' : staff.filter((s) => ['LabHead', 'FacilityAdmin'].includes(s.role)).length, icon: '🔬', color: 'bg-purple-50 text-purple-700' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-extrabold text-gov-900">{stat.value}</p>
                <p className="text-[11px] text-slate-500 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Content Grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Create Staff Form (2 cols) ─────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs sticky top-24 space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-gov-900">Create Staff Account</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add a new staff member to your hospital. They will be able to log in with their credentials.
                </p>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Dr. Priya Menon"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="e.g. doctor@hospital.org"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Temporary Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleFormChange}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Stored as salted bcrypt hash. Share securely with the staff member.
                  </p>
                </div>

                {/* Role Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Staff Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                  >
                    {STAFF_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role Preview Badge */}
                {formData.role && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Will be assigned role:</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-semibold border text-xs ${getRoleBadge(formData.role)}`}>
                      {formData.role}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {formLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Staff Account
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ── Staff Table (3 cols) ───────────────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Table Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gov-900">Registered Staff Members</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    All staff associated with your hospital facility.
                  </p>
                </div>
                <button
                  onClick={fetchStaff}
                  disabled={loadingStaff}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  <svg className={`w-3.5 h-3.5 ${loadingStaff ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              {/* Table Body */}
              {loadingStaff ? (
                <div className="py-16 text-center">
                  <span className="inline-block w-8 h-8 border-2 border-slate-300 border-t-sky-600 rounded-full animate-spin mb-3"></span>
                  <p className="text-sm text-slate-500">Loading staff records...</p>
                </div>
              ) : staff.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-sky-50 text-sky-500 flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No Staff Members Yet</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Use the form to create your first staff account.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Name
                        </th>
                        <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Email
                        </th>
                        <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Role
                        </th>
                        <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                          Added On
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staff.map((member) => (
                        <tr key={member._id} className="hover:bg-slate-50/60 transition-colors group">
                          {/* Name */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-gov-900 text-sm">
                                {member.name}
                              </span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">
                            {member.email}
                          </td>

                          {/* Role */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${getRoleBadge(member.role)}`}>
                              {member.role === 'ASHA' ? 'ASHA / ANM' : member.role}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                            {member.createdAt
                              ? new Date(member.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Table Footer */}
                  <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      <strong>{staff.length}</strong> staff member(s) registered
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                      Live Hospital Registry
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
