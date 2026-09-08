import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { hospitalAPI } from '../../services/api';
import { getStoredAuth } from '../../utils/auth';

export default function HospitalRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    hospitalName: '',
    registrationNumber: '',
    address: '',
    contactPhone: '',
    adminName: '',
    adminEmail: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredData, setRegisteredData] = useState(null);

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
      const response = await hospitalAPI.register(formData);
      setSuccess(true);
      setRegisteredData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Hospital registration failed. Please verify your details.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xl">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gov-900">
            Register Healthcare Facility
          </h2>
          <p className="text-xs text-slate-500">
            National Clinical Establishment Registry • Ministry of Health
          </p>
        </div>

        {/* Success Confirmation State */}
        {success ? (
          <div className="bg-mint-50/80 border-2 border-mint-500 rounded-2xl p-8 text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-mint-500 text-white flex items-center justify-center shadow-lg shadow-mint-500/30">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-mint-900">
                Registration submitted. Pending Government Verification.
              </h3>
              <p className="text-sm text-mint-800 max-w-lg mx-auto leading-relaxed">
                Your application for <strong>{formData.hospitalName}</strong> (Reg: {formData.registrationNumber}) has been submitted to the National Health Authority database.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-mint-200 text-left text-xs space-y-1.5 text-slate-700 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Facility ID:</span>
                <span className="font-mono font-medium">{registeredData?.hospital?._id || 'Pending'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Initial Verification Status:</span>
                <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold uppercase text-[10px]">
                  Pending
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Authorized Admin:</span>
                <span className="font-medium">{formData.adminEmail}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Please note: In accordance with regulatory guidelines, administrative login is strictly restricted until a designated Government Health Official reviews and approves the accreditation.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/auth/hospital/login"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Go to Hospital Login
              </Link>
              <Link
                to="/"
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Hospital Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">1</span>
                <h3 className="text-sm font-bold text-gov-900">Hospital Information</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Hospital / Facility Name *
                  </label>
                  <input
                    type="text"
                    name="hospitalName"
                    required
                    value={formData.hospitalName}
                    onChange={handleChange}
                    placeholder="e.g. City Life Multispecialty Hospital"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Registration / License Number *
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    required
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="e.g. CEA/MH/2026/8941"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Official Contact Phone *
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    required
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="+91-011-XXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Physical Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street, City, State, PIN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Hospital Admin Credentials */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">2</span>
                <h3 className="text-sm font-bold text-gov-900">Hospital Administrator Account</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Admin Full Name *
                  </label>
                  <input
                    type="text"
                    name="adminName"
                    required
                    value={formData.adminName}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Rajesh Kulkarni"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Official Admin Email *
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    required
                    value={formData.adminEmail}
                    onChange={handleChange}
                    placeholder="admin@hospital.org"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Master Access Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Minimum 6 characters. Will be encrypted using salted bcrypt hashing.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Submit Application for Government Verification'
              )}
            </button>

            <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
              <Link to="/auth/hospital/login" className="text-sky-700 hover:underline font-medium">
                Already registered? Sign in here →
              </Link>
              <Link to="/" className="hover:text-slate-800">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
