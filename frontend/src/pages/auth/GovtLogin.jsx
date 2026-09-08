import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { govtAPI } from '../../services/api';
import { getStoredAuth } from '../../utils/auth';

export default function GovtLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth && auth.user && auth.user.role) {
      const user = auth.user;
      switch (user.role) {
        case 'Doctor':
          navigate('/dashboard/doctor', { replace: true });
          break;
        case 'HospitalAdmin':
        case 'FacilityAdmin':
          navigate('/dashboard/admin', { replace: true });
          break;
        case 'Receptionist':
          navigate('/dashboard/receptionist', { replace: true });
          break;
        case 'LabHead':
          navigate('/dashboard/lab', { replace: true });
          break;
        case 'Patient':
          navigate('/dashboard/patient', { replace: true });
          break;
        case 'Govt':
        case 'GovernmentOfficial':
          navigate('/dashboard/govt', { replace: true });
          break;
        case 'ASHA':
          navigate('/dashboard/asha', { replace: true });
          break;
        default:
          break;
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await govtAPI.login({
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
      });
      localStorage.setItem('user', userData);
      localStorage.setItem('sahay_user', userData);

      navigate('/dashboard/govt');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Access denied. Invalid government official credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gov-100 text-gov-navy flex items-center justify-center font-bold text-xl">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gov-900">Government Portal Login</h2>
          <p className="text-xs text-slate-500">
            Authorized Health Officials & Regulatory Authorities Only
          </p>
        </div>

        {/* Security Alert Banner */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
          <svg className="w-4 h-4 text-gov-navy shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>All regulatory actions and hospital status modifications are cryptographically logged.</span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Government Official Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="officer@mohfw.gov.in"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-gov-navy focus:border-gov-navy transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Official Access Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-gov-navy focus:border-gov-navy transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gov-900 hover:bg-black text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Authenticate Government Session'
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link to="/" className="text-xs font-medium text-slate-500 hover:text-slate-800">
            ← Back to National Portals Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
