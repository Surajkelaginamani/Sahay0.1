import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { hospitalAPI } from '../../services/api';

export default function HospitalLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setIsPending(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setIsPending(false);

    try {
      const response = await hospitalAPI.login({
        email: formData.email,
        password: formData.password,
      });

      // Save credentials and token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('sahay_token', response.data.token);
      const userData = JSON.stringify({
        _id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
        hospitalId: response.data.hospitalId,
        hospitalName: response.data.hospitalName,
      });
      localStorage.setItem('user', userData);
      localStorage.setItem('sahay_user', userData);

      navigate('/dashboard/hospital');
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || 'Login failed. Please check credentials.';

      if (status === 403) {
        setIsPending(true);
        setError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xl">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gov-900">Hospital Admin Login</h2>
          <p className="text-xs text-slate-500">
            Accredited Healthcare Facilities Management Portal
          </p>
        </div>

        {/* Pending Verification Notice */}
        {isPending ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs">
              <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Approval Pending</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              {error}
            </p>
            <p className="text-[11px] text-amber-700">
              Your facility registration is currently under review by a designated Government Health Authority. Access will be unlocked automatically upon approval.
            </p>
          </div>
        ) : error ? (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        ) : null}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Admin Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@hospital.org"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Sign In to Hospital Portal'
            )}
          </button>
        </form>

        <div className="pt-2 text-center space-y-2 text-xs">
          <div>
            <span className="text-slate-500">Need to register a new clinic or hospital? </span>
            <Link to="/auth/hospital/register" className="text-sky-700 hover:underline font-semibold">
              Register Facility
            </Link>
          </div>
          <div>
            <Link to="/" className="text-slate-400 hover:text-slate-700">
              ← Back to National Portals Overview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
