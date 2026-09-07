import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { staffAuthAPI } from '../../services/api';

// Role → route map
const ROLE_ROUTES = {
  HospitalAdmin: '/dashboard/admin',
  Doctor: '/doctor',
  LabHead: '/dashboard/lab',
  ASHA: '/dashboard/asha',
  FacilityAdmin: '/dashboard/admin', // Facility admins share the admin dashboard for now
};

// Subtle role badge displayed after failed login with role info
const ROLE_LABELS = {
  HospitalAdmin: 'Hospital Administrator',
  Doctor: 'Doctor',
  LabHead: 'Lab Head / Diagnostics',
  ASHA: 'ASHA / ANM Worker',
  FacilityAdmin: 'Facility Administrator',
};

export default function HospitalLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(''); // 'pending' | 'rejected' | 'generic'
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setErrorType('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrorType('');

    try {
      const response = await staffAuthAPI.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      const { token, role, user } = response.data;

      // ── Save token & user to localStorage ──────────────────────────────────
      localStorage.setItem('token', token);
      localStorage.setItem('sahay_token', token);
      localStorage.setItem(
        'user',
        JSON.stringify({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          hospitalId: user.hospitalId,
          hospitalName: user.hospitalName,
        })
      );
      localStorage.setItem('sahay_user', localStorage.getItem('user'));

      // ── Role-based navigation ───────────────────────────────────────────────
      switch (role) {
        case 'HospitalAdmin':
          navigate('/dashboard/admin');
          break;
        case 'Doctor':
          navigate('/doctor');
          break;
        case 'LabHead':
          navigate('/dashboard/lab');
          break;
        case 'ASHA':
          navigate('/dashboard/asha');
          break;
        case 'FacilityAdmin':
          navigate('/dashboard/admin');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      const status = err.response?.status;
      const message =
        err.response?.data?.message ||
        'Login failed. Please check your credentials.';
      const vStatus = err.response?.data?.verificationStatus;

      if (status === 403 && vStatus === 'pending') {
        setErrorType('pending');
      } else if (status === 403 && vStatus === 'rejected') {
        setErrorType('rejected');
      } else {
        setErrorType('generic');
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-sky-50 to-slate-50">
      <div className="max-w-md w-full space-y-6">

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-sky-100/40 p-8 space-y-6">

          {/* Header */}
          <div className="text-center space-y-3">
            {/* Portal icon */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center shadow-md shadow-sky-200">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Healthcare Staff &amp; Admin Portal
              </h1>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Secure access for Doctors, ASHA Workers, Lab Heads, and Hospital Administrators
              </p>
            </div>

            {/* Role chips — visual hint */}
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {['Hospital Admin', 'Doctor', 'ASHA / ANM', 'Lab Head'].map((r) => (
                <span key={r} className="px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-medium">
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* ── Status Banners ─────────────────────────────────────── */}
          {errorType === 'pending' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-1.5 animate-fade-in">
              <div className="flex items-center gap-2 font-semibold text-xs text-amber-900">
                <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Hospital Approval Pending
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">{error}</p>
              <p className="text-[11px] text-amber-700">
                Your hospital is under government review. Access will be granted once approved by a designated Health Authority.
              </p>
            </div>
          )}

          {errorType === 'rejected' && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-xs text-rose-900">
                <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Registration Rejected
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">{error}</p>
              <p className="text-[11px] text-rose-700">
                Please contact the government health authority or support team for further assistance.
              </p>
            </div>
          )}

          {errorType === 'generic' && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* ── Login Form ─────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="staff-email" className="block text-xs font-medium text-slate-700 mb-1">
                Staff Email Address
              </label>
              <input
                id="staff-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="staff@hospital.org"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="staff-password" className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="staff-password"
                type="password"
                name="password"
                required
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-slate-50 focus:bg-white"
              />
            </div>

            <button
              id="staff-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-semibold text-sm shadow-sm shadow-sky-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In to Staff Portal
                </>
              )}
            </button>
          </form>

          {/* ── Footer Links ───────────────────────────────────────── */}
          <div className="pt-1 text-center space-y-2 text-xs border-t border-slate-100">
            <div className="pt-2">
              <span className="text-slate-500">Registering a new hospital? </span>
              <Link to="/auth/hospital/register" className="text-sky-700 hover:underline font-semibold">
                Register Facility
              </Link>
            </div>
            <div>
              <Link to="/" className="text-slate-400 hover:text-slate-700 transition-colors">
                ← Back to National Portals Overview
              </Link>
            </div>
          </div>
        </div>

        {/* Trust badge */}
        <p className="text-center text-[11px] text-slate-400">
          🔒 Secured by SAHAY — Smart Access to Healthcare, Government of India
        </p>
      </div>
    </div>
  );
}
