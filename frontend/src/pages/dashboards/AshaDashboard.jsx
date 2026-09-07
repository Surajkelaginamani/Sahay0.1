import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Toast Notification Component ─────────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm font-medium pointer-events-auto transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-white border-mint-200 text-mint-900'
              : toast.type === 'emergency'
              ? 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-400'
              : 'bg-white border-rose-200 text-rose-900'
          }`}
        >
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm">{toast.title}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-700 shrink-0">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Initial Mock Data ────────────────────────────────────────────────────────
const INITIAL_PATIENTS = [
  {
    id: 'P-10245',
    name: 'Ramesh Balwant Patil',
    age: 54,
    gender: 'MALE',
    village: 'Wadange',
    phone: '+91 98223 45120',
    bloodGroup: 'B+',
    complaint: 'Post-cardiac review & routine blood pressure measurement',
    category: 'Chronic',
    abhaId: 'ABHA-91-8841-2041',
    status: 'Pending Vitals',
    triageLevel: 'Pending',
    vitals: null,
  },
  {
    id: 'P-10246',
    name: 'Shakuntala Dinkar Kamble',
    age: 62,
    gender: 'FEMALE',
    village: 'Chikhali',
    phone: '+91 94031 78945',
    bloodGroup: 'O+',
    complaint: 'Joint stiffness & fasting blood glucose check',
    category: 'Senior',
    abhaId: 'ABHA-91-3329-8742',
    status: 'Pending Vitals',
    triageLevel: 'Pending',
    vitals: null,
  },
  {
    id: 'P-10247',
    name: 'Sunita Rajesh Shinde',
    age: 26,
    gender: 'FEMALE',
    village: 'Shiroli',
    phone: '+91 97632 11029',
    bloodGroup: 'A+',
    complaint: 'High-risk 3rd trimester pregnancy ANC vitals check',
    category: 'Maternal',
    abhaId: 'ABHA-91-7712-4091',
    status: 'Triaged',
    triageLevel: 'Normal',
    vitals: {
      spo2: '99',
      bpSystolic: '118',
      bpDiastolic: '76',
      heartRate: '78',
      temperature: '98.4',
      glucose: '102',
      triagedAt: '09:40 AM',
    },
  },
  {
    id: 'P-10248',
    name: 'Anand Mahadev Patil',
    age: 48,
    gender: 'MALE',
    village: 'Wadange',
    phone: '+91 98901 22340',
    bloodGroup: 'AB+',
    complaint: 'Severe headache & blurred vision with known hypertension',
    category: 'Chronic',
    abhaId: 'ABHA-91-6643-9811',
    status: 'Pending Vitals',
    triageLevel: 'Pending',
    vitals: null,
  },
];

const INITIAL_OUTREACH = [
  {
    id: 'out-1',
    patientName: 'Ramesh Balwant Patil',
    village: 'Wadange',
    contact: '+91 98223 45120',
    urgency: 'UPCOMING',
    program: 'Cardiovascular NCD',
    description: 'Post-cardiac intervention cardiology review and dual antiplatelet drug adherence.',
    completed: false,
  },
  {
    id: 'out-2',
    patientName: 'Shakuntala Dinkar Kamble',
    village: 'Chikhali',
    contact: '+91 94031 78945',
    urgency: 'DUE TODAY',
    program: 'Diabetes Mellitus NCD',
    description: 'Diabetic peripheral neuropathy check, foot inspection, and weekly glucose log review.',
    completed: false,
  },
  {
    id: 'out-3',
    patientName: 'Sunita Rajesh Shinde',
    village: 'Shiroli',
    contact: '+91 97632 11029',
    urgency: 'DUE TODAY',
    program: 'Maternal Health (ANC)',
    description: 'Third trimester IFA tablet replenishment and fetal kick count awareness counselling.',
    completed: false,
  },
  {
    id: 'out-4',
    patientName: 'Aarav Sachin Jadhav (14m)',
    village: 'Wadange',
    contact: '+91 98810 54321',
    urgency: 'OVERDUE',
    program: 'Universal Immunization',
    description: 'Measles-Rubella (MR) Dose 2 & Vitamin A drops administration due.',
    completed: false,
  },
];

// ─── KPI Stats Component ──────────────────────────────────────────────────────
function KpiStats({
  triagedToday = 21,
  immediateEmergency = 0,
  waitingForTriage = 4,
  maternalRecalls = 12,
  onFilterSelect,
  activeFilter,
}) {
  const stats = [
    {
      id: 'triaged',
      label: 'TRIAGED TODAY',
      value: triagedToday,
      subtext: 'Vitals electronically recorded',
      badge: 'Live ABHA Sync',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      iconBg: 'bg-emerald-100',
      borderColor: 'border-emerald-200 hover:border-emerald-300',
      textColor: 'text-emerald-700',
    },
    {
      id: 'emergency',
      label: 'IMMEDIATE EMERGENCY',
      value: immediateEmergency,
      subtext: immediateEmergency > 0 ? 'PHC Doctor alerted immediately' : 'Doctor alerted immediately',
      badge: immediateEmergency > 0 ? 'Action Required' : 'All Clear',
      badgeColor: immediateEmergency > 0 ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' : 'bg-slate-100 text-slate-600 border-slate-200',
      icon: (
        <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'bg-rose-100',
      borderColor: immediateEmergency > 0 ? 'border-rose-300 ring-2 ring-rose-200' : 'border-rose-200 hover:border-rose-300',
      textColor: 'text-rose-700',
    },
    {
      id: 'waiting',
      label: 'WAITING FOR TRIAGE',
      value: waitingForTriage,
      subtext: 'Average vitals time: ~3 mins',
      badge: `${waitingForTriage} in Queue`,
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: (
        <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-sky-100',
      borderColor: 'border-sky-200 hover:border-sky-300',
      textColor: 'text-sky-700',
    },
    {
      id: 'maternal',
      label: 'MATERNAL RECALLS',
      value: `${maternalRecalls} Mothers`,
      subtext: 'High risk pregnancy tracking',
      badge: 'ANC / PNC Watch',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      iconBg: 'bg-amber-100',
      borderColor: 'border-amber-200 hover:border-amber-300',
      textColor: 'text-amber-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((item) => {
        const isSelected = activeFilter === item.id;
        return (
          <div
            key={item.id}
            onClick={() => onFilterSelect && onFilterSelect(isSelected ? 'all' : item.id)}
            className={`bg-white rounded-2xl border ${item.borderColor} p-5 shadow-xs transition-all duration-200 cursor-pointer hover:shadow-md ${
              isSelected ? 'ring-2 ring-mint-500 shadow-md bg-mint-50/20' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                {item.label}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className={`text-2xl font-extrabold ${item.textColor} tracking-tight leading-none`}>
                  {item.value}
                </p>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {item.subtext}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Rule-Assisted Measure Vitals Modal ───────────────────────────────────────
function MeasureVitalsModal({ patient, isOpen, onClose, onSaveVitals }) {
  const [vitals, setVitals] = useState({
    spo2: patient?.vitals?.spo2 || '98',
    bpSystolic: patient?.vitals?.bpSystolic || '124',
    bpDiastolic: patient?.vitals?.bpDiastolic || '82',
    heartRate: patient?.vitals?.heartRate || '76',
    temperature: patient?.vitals?.temperature || '98.4',
    glucose: patient?.vitals?.glucose || '110',
    symptoms: patient?.complaint || 'Routine checkup & vitals screening',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patient) {
      setVitals({
        spo2: patient?.vitals?.spo2 || '98',
        bpSystolic: patient?.vitals?.bpSystolic || '124',
        bpDiastolic: patient?.vitals?.bpDiastolic || '82',
        heartRate: patient?.vitals?.heartRate || '76',
        temperature: patient?.vitals?.temperature || '98.4',
        glucose: patient?.vitals?.glucose || '110',
        symptoms: patient?.complaint || 'Routine checkup & vitals screening',
      });
    }
  }, [patient]);

  if (!isOpen || !patient) return null;

  // Rule-assisted clinical risk triage calculation
  const calculateRisk = () => {
    const spo2Num = parseFloat(vitals.spo2) || 98;
    const sysNum = parseFloat(vitals.bpSystolic) || 120;
    const diaNum = parseFloat(vitals.bpDiastolic) || 80;
    const tempNum = parseFloat(vitals.temperature) || 98.6;
    const hrNum = parseFloat(vitals.heartRate) || 75;

    if (spo2Num < 92 || sysNum >= 160 || diaNum >= 100 || tempNum >= 102.5 || hrNum > 125) {
      return {
        level: 'Emergency',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
        alertText: 'Critical Alert: Red Flag Vitals detected. Will immediately alert PHC Medical Officer.',
        isEmergency: true,
      };
    }
    if (spo2Num <= 94 || sysNum >= 140 || diaNum >= 90 || tempNum >= 100.4 || hrNum > 105) {
      return {
        level: 'Moderate Risk',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        alertText: 'Moderate Priority: Abnormal vitals noted. Scheduled for same-day doctor review.',
        isEmergency: false,
      };
    }
    return {
      level: 'Normal',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      alertText: 'Stable Vitals: Within normal physiological ranges for age.',
      isEmergency: false,
    };
  };

  const risk = calculateRisk();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVitals((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      onSaveVitals(patient.id, {
        ...vitals,
        riskLevel: risk.level,
        isEmergency: risk.isEmergency,
        triagedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setSaving(false);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-mint-600 to-mint-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold">Record Vitals & Community Triage</h3>
              <p className="text-xs text-mint-100">
                ABHA ID: <span className="font-mono">{patient.abhaId || 'ABHA-9821-4401-2091'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Patient Profile Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
          <div>
            <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
            <span className="text-slate-500 ml-2">({patient.age}y, {patient.gender})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Village: <strong>{patient.village}</strong></span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Blood: <strong>{patient.bloodGroup || 'O+'}</strong></span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Dynamic Rule-Assisted Risk Banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${risk.badgeColor}`}>
            <span className="text-xl">
              {risk.level === 'Emergency' ? '🚨' : risk.level === 'Moderate Risk' ? '⚠️' : '✅'}
            </span>
            <div className="flex-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider">Triage Recommendation:</span>
                <span className="font-extrabold underline">{risk.level}</span>
              </div>
              <p className="mt-0.5 opacity-90">{risk.alertText}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* SpO2 */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>SpO2 Oxygen (%)</span>
                <span className="text-[10px] text-slate-400">≥95%</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="spo2"
                  min="50"
                  max="100"
                  value={vitals.spo2}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">%</span>
              </div>
            </div>

            {/* Blood Pressure Systolic */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>BP Systolic</span>
                <span className="text-[10px] text-slate-400">&lt;130</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="bpSystolic"
                  min="60"
                  max="260"
                  value={vitals.bpSystolic}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">mmHg</span>
              </div>
            </div>

            {/* Blood Pressure Diastolic */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>BP Diastolic</span>
                <span className="text-[10px] text-slate-400">&lt;85</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="bpDiastolic"
                  min="40"
                  max="160"
                  value={vitals.bpDiastolic}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">mmHg</span>
              </div>
            </div>

            {/* Heart Rate */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Heart Rate</span>
                <span className="text-[10px] text-slate-400">60-100</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="heartRate"
                  min="30"
                  max="220"
                  value={vitals.heartRate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">bpm</span>
              </div>
            </div>

            {/* Temperature */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Temperature</span>
                <span className="text-[10px] text-slate-400">98.6°F</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  name="temperature"
                  min="90"
                  max="108"
                  value={vitals.temperature}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">°F</span>
              </div>
            </div>

            {/* Blood Sugar */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Random Glucose</span>
                <span className="text-[10px] text-slate-400">&lt;140</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="glucose"
                  min="40"
                  max="500"
                  value={vitals.glucose}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">mg/dL</span>
              </div>
            </div>
          </div>

          {/* Observed Symptoms / Chief Complaint */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Observed Clinical Symptoms / Chief Notes</label>
            <textarea
              name="symptoms"
              rows="2"
              value={vitals.symptoms}
              onChange={handleChange}
              placeholder="e.g. Mild headache, swelling in feet, compliance with hypertensive medicines..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-mint-600 hover:bg-mint-700 rounded-xl shadow-md shadow-mint-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <span>Syncing to ABHA...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save & Sync to ABHA Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Beneficiary Registration Modal ──────────────────────────────────────────
function RegisterBeneficiaryModal({ isOpen, onClose, onRegister }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'MALE',
    village: 'Wadange',
    phone: '',
    bloodGroup: 'B+',
    category: 'General',
    complaint: '',
    abhaId: '',
  });

  const [generatingAbha, setGeneratingAbha] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateAbha = () => {
    setGeneratingAbha(true);
    setTimeout(() => {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const randomDigits2 = Math.floor(1000 + Math.random() * 9000);
      setFormData((prev) => ({
        ...prev,
        abhaId: `ABHA-91-${randomDigits}-${randomDigits2}`,
      }));
      setGeneratingAbha(false);
    }, 400);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newPatient = {
      id: `P-${Math.floor(10000 + Math.random() * 90000)}`,
      name: formData.name,
      age: parseInt(formData.age, 10) || 30,
      gender: formData.gender,
      village: formData.village,
      phone: formData.phone.startsWith('+91') ? formData.phone : `+91 ${formData.phone}`,
      bloodGroup: formData.bloodGroup,
      complaint: formData.complaint || 'General community health checkup',
      category: formData.category,
      abhaId: formData.abhaId || `ABHA-91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Pending Vitals',
      triageLevel: 'Pending',
      waitingTime: 'Just Arrived',
    };

    onRegister(newPatient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-mint-600 to-mint-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold">New Beneficiary Registration</h3>
              <p className="text-xs text-mint-100">Ayushman Bharat Health Account (ABHA) Enrollment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Beneficiary Full Name *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Ramesh Balwant Patil"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Age *</label>
              <input
                type="number"
                name="age"
                required
                min="0"
                max="120"
                placeholder="Age in years"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Village / Hamlet *</label>
              <input
                type="text"
                name="village"
                required
                placeholder="e.g. Wadange"
                value={formData.village}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Mobile Number *</label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="e.g. 98223 45120"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Blood Group</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Care Program</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
              >
                <option value="General">General Triage</option>
                <option value="Maternal">Maternal & ANC / PNC</option>
                <option value="Chronic">Chronic Disease (NCD)</option>
                <option value="Immunization">Child Immunization</option>
                <option value="Senior">Elderly Care</option>
              </select>
            </div>
          </div>

          {/* ABHA Number input + Auto Generate */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">ABHA Health ID Number</label>
              <button
                type="button"
                onClick={handleGenerateAbha}
                className="text-[11px] font-semibold text-mint-600 hover:text-mint-700 flex items-center gap-1"
              >
                {generatingAbha ? 'Generating...' : '⚡ Generate Instant ABHA'}
              </button>
            </div>
            <input
              type="text"
              name="abhaId"
              placeholder="e.g. ABHA-91-4920-1928"
              value={formData.abhaId}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Chief Reason for Consultation / Visit</label>
            <input
              type="text"
              name="complaint"
              placeholder="e.g. Routine blood pressure check, post-cardiac review..."
              value={formData.complaint}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-mint-600 hover:bg-mint-700 rounded-xl shadow-md shadow-mint-500/20 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Enroll Beneficiary</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Priority Health & Triage Worklist ────────────────────────────────────────
function TriageWorklist({
  patients = [],
  onMeasureVitals,
  onOpenQuickTriage,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('ALL');

  // Unique villages for filter
  const villages = ['ALL', ...new Set(patients.map((p) => p.village).filter(Boolean))];

  // Filtered patients
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.abhaId && patient.abhaId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (patient.phone && patient.phone.includes(searchQuery));
    const matchesVillage = selectedVillage === 'ALL' || patient.village === selectedVillage;
    return matchesSearch && matchesVillage;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Priority Health & Triage Worklist
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-mint-50 text-mint-700 border border-mint-200">
              Active OPD
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Collect SpO2, Blood Pressure, Heart Rate, Temperature, Blood Glucose and assign rule-assisted risk.
          </p>
        </div>

        <button
          onClick={onOpenQuickTriage}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-mint-700 hover:text-mint-800 bg-mint-50 hover:bg-mint-100 px-3.5 py-1.5 rounded-xl border border-mint-200 transition-colors self-start sm:self-auto"
        >
          <span>Open Triage Station</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-5 sm:px-6 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by Name, ABHA ID, or Mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 shrink-0">Village:</span>
          <select
            value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mint-500 font-medium text-slate-700"
          >
            {villages.map((v) => (
              <option key={v} value={v}>
                {v === 'ALL' ? 'All Villages' : v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient List */}
      <div className="p-5 sm:p-6 space-y-3.5">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <p>No beneficiaries found in this worklist filter.</p>
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const hasVitals = !!patient.vitals;
            const isEmergency = patient.isEmergency || patient.triageLevel === 'Emergency';
            const isModerate = patient.triageLevel === 'Moderate Risk';

            return (
              <div
                key={patient.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isEmergency
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                    : hasVitals
                    ? 'bg-white border-slate-200 hover:border-mint-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {patient.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {patient.name}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      ({patient.age}y, {patient.gender})
                    </span>

                    {/* Status Badge */}
                    {isEmergency ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                        Emergency Alert
                      </span>
                    ) : isModerate ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        Moderate Risk
                      </span>
                    ) : hasVitals ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Triaged: Normal ({patient.vitals.triagedAt || 'Today'})
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        Waiting for Vitals
                      </span>
                    )}
                  </div>

                  {/* Village, Contact & Complaint */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span>
                      Village: <strong className="text-slate-700">{patient.village}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Phone: <strong className="text-slate-700">{patient.phone}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Blood: <strong className="text-slate-700">{patient.bloodGroup || 'O+'}</strong>
                    </span>
                  </div>

                  {patient.complaint && (
                    <p className="text-[11px] text-slate-600 bg-slate-50/80 px-2.5 py-1 rounded-lg border border-slate-100 inline-block">
                      <span className="font-semibold text-slate-700">Complaint:</span> {patient.complaint}
                    </p>
                  )}

                  {/* Recorded Vitals preview if measured */}
                  {hasVitals && (
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600 flex-wrap font-medium">
                      <span className="bg-mint-50 text-mint-800 px-2 py-0.5 rounded border border-mint-200">
                        SpO2: {patient.vitals.spo2}%
                      </span>
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        BP: {patient.vitals.bpSystolic}/{patient.vitals.bpDiastolic}
                      </span>
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        HR: {patient.vitals.heartRate} bpm
                      </span>
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        Temp: {patient.vitals.temperature}°F
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Action Button */}
                <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
                  <button
                    onClick={() => onMeasureVitals(patient)}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs ${
                      hasVitals
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                        : 'bg-mint-600 hover:bg-mint-700 text-white shadow-mint-500/20'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{hasVitals ? 'Re-Measure Vitals' : 'Measure Vitals'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Village Outreach Due Worklist ────────────────────────────────────────────
function OutreachWorklist({
  outreachList = [],
  onToggleComplete,
  onCallBeneficiary,
}) {
  const [filter, setFilter] = useState('ALL');

  const filteredList = outreachList.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'DUE_TODAY') return item.urgency === 'DUE TODAY';
    if (filter === 'UPCOMING') return item.urgency === 'UPCOMING';
    if (filter === 'OVERDUE') return item.urgency === 'OVERDUE';
    if (filter === 'COMPLETED') return item.completed;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Village ABHA & ASHA Outreach Due
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Field Visits
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Beneficiaries requiring home visits for chronic disease checks and immunization adherence:
        </p>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'DUE_TODAY', label: 'Due Today' },
            { id: 'UPCOMING', label: 'Upcoming' },
            { id: 'OVERDUE', label: 'Overdue' },
            { id: 'COMPLETED', label: 'Done' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors shrink-0 ${
                filter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="p-5 sm:p-6 space-y-3.5 divide-y divide-slate-100">
        {filteredList.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No outreach tasks in this category.
          </div>
        ) : (
          filteredList.map((item) => {
            const isCompleted = item.completed;
            const isDueToday = item.urgency === 'DUE TODAY';
            const isOverdue = item.urgency === 'OVERDUE';

            return (
              <div
                key={item.id}
                className={`pt-3.5 first:pt-0 transition-opacity ${
                  isCompleted ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className={`text-sm font-bold text-slate-900 ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                      {item.patientName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>Village: <strong className="text-slate-700">{item.village}</strong></span>
                      <span>•</span>
                      <span>Contact: <strong className="text-slate-700">{item.contact}</strong></span>
                    </div>
                  </div>

                  {/* Urgency Badge */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      isCompleted
                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                        : isOverdue
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : isDueToday
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}
                  >
                    {isCompleted ? 'VISITED' : item.urgency}
                  </span>
                </div>

                {/* Followup Description */}
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2.5">
                  <span className="text-[10px] text-slate-400 font-medium">
                    Program: <strong>{item.program || 'Community Health'}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onCallBeneficiary(item)}
                      title={`Call ${item.patientName}`}
                      className="p-1.5 text-slate-600 hover:text-mint-700 hover:bg-mint-50 rounded-lg border border-slate-200 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => onToggleComplete(item.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                        isCompleted
                          ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <span>✓ Done</span>
                          <span className="text-[10px] text-slate-400">(Undo)</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Mark Visited</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main AshaDashboard Component ─────────────────────────────────────────────
export default function AshaDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user') || localStorage.getItem('sahay_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { name: 'Archana More', role: 'ASHA', hospitalName: 'Kasaba Bawada PHC' };
      }
    }
    return {
      name: 'Archana More',
      role: 'ASHA',
      hospitalName: 'Kasaba Bawada Primary Health Centre',
      abhaWorkerId: 'ABHA-HW-4102-9812',
    };
  });

  // Core Data States
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [outreachList, setOutreachList] = useState(INITIAL_OUTREACH);

  // Dynamic KPI counters
  const [triagedCount, setTriagedCount] = useState(21);
  const [emergencyCount, setEmergencyCount] = useState(0);
  const [activeTab, setActiveTab] = useState('station');
  const [activeKpiFilter, setActiveKpiFilter] = useState('all');

  // Modals
  const [activeVitalsPatient, setActiveVitalsPatient] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('sahay_token');
    localStorage.removeItem('user');
    localStorage.removeItem('sahay_user');
    navigate('/auth/hospital/login');
  };

  // Open Vitals modal for a specific patient or the first pending one
  const handleOpenMeasureVitals = (patient) => {
    setActiveVitalsPatient(patient);
  };

  const handleOpenFirstPending = () => {
    const pending = patients.find((p) => !p.vitals);
    if (pending) {
      setActiveVitalsPatient(pending);
    } else if (patients.length > 0) {
      setActiveVitalsPatient(patients[0]);
    } else {
      setIsRegisterOpen(true);
    }
  };

  // Save Vitals Callback
  const handleSaveVitals = (patientId, vitalsData) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            vitals: vitalsData,
            status: 'Triaged',
            triageLevel: vitalsData.riskLevel,
            isEmergency: vitalsData.isEmergency,
          };
        }
        return p;
      })
    );

    setTriagedCount((prev) => prev + 1);

    if (vitalsData.isEmergency) {
      setEmergencyCount((prev) => prev + 1);
      addToast(
        'emergency',
        '🚨 Emergency Triage Escalated!',
        `Critical red-flag vitals detected for patient ${patientId}. PHC Medical Officer has been dispatched an instant clinical alert.`
      );
    } else {
      addToast(
        'success',
        'Vitals Synced to ABHA',
        `Vitals electronically recorded and linked with Ayushman Bharat Health Account for patient ${patientId}.`
      );
    }
  };

  // Register Beneficiary Callback
  const handleRegisterPatient = (newPatient) => {
    setPatients((prev) => [newPatient, ...prev]);
    addToast(
      'success',
      'Beneficiary Enrolled in ABHA',
      `${newPatient.name} has been enrolled with ABHA ID ${newPatient.abhaId} and placed in the triage queue.`
    );
  };

  // Toggle Outreach Visit Complete
  const handleToggleOutreach = (outreachId) => {
    setOutreachList((prev) =>
      prev.map((item) => {
        if (item.id === outreachId) {
          const nextState = !item.completed;
          if (nextState) {
            setTriagedCount((c) => c + 1);
            addToast('success', 'Home Visit Logged', `Field outreach visit to ${item.patientName} marked as completed.`);
          }
          return { ...item, completed: nextState };
        }
        return item;
      })
    );
  };

  // Call Beneficiary
  const handleCallBeneficiary = (item) => {
    addToast(
      'success',
      `Calling ${item.patientName}`,
      `Dialing ${item.contact} for ${item.program} outreach verification.`
    );
  };

  // Waiting count
  const waitingCount = patients.filter((p) => !p.vitals).length;

  return (
    <>
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Vitals Modal */}
      <MeasureVitalsModal
        patient={activeVitalsPatient}
        isOpen={!!activeVitalsPatient}
        onClose={() => setActiveVitalsPatient(null)}
        onSaveVitals={handleSaveVitals}
      />

      {/* New Beneficiary Modal */}
      <RegisterBeneficiaryModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegister={handleRegisterPatient}
      />

      <div className="min-h-[85vh] bg-gradient-to-br from-slate-50 via-mint-50/30 to-slate-50 px-4 sm:px-8 py-8 space-y-7">
        <div className="max-w-7xl mx-auto space-y-7">
          {/* ── Top Bar / Header ───────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-mint-500 to-mint-700 flex items-center justify-center text-white shadow-md shadow-mint-500/20 shrink-0">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-gov-900 tracking-tight">
                    ASHA & ABHA Community Health Portal
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-mint-100 text-mint-800 border border-mint-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-mint-600 animate-pulse"></span>
                    Frontline Outreach
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Worker: <strong className="text-slate-800">{user?.name || 'Archana More'}</strong> &nbsp;•&nbsp;
                  <span className="font-mono text-slate-600">ID: {user?.abhaWorkerId || 'ABHA-HW-4102-9812'}</span> &nbsp;•&nbsp;
                  Facility: <span className="text-mint-700 font-medium">{user?.hospitalName || 'Kasaba Bawada PHC • Sector 4'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-xs"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>+ New Registration</span>
              </button>

              <button
                onClick={handleOpenFirstPending}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-mint-600 hover:bg-mint-700 rounded-xl shadow-md shadow-mint-500/20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Perform Digital Triage</span>
              </button>

              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Sub-Navigation Tabs ── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'station', label: 'Community Triage Station', count: null },
              { id: 'intake', label: 'Digital Vitals Intake', count: null },
              { id: 'queue', label: 'Waiting Queue', count: waitingCount },
              { id: 'maternal', label: 'Village Maternal Outreach', count: 12 },
              { id: 'patients', label: 'Community Beneficiaries', count: patients.length },
              { id: 'labs', label: 'Rapid Point-of-Care Testing', count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gov-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── KPI Cards ──────────────────────────────────────────────────── */}
          <KpiStats
            triagedToday={triagedCount}
            immediateEmergency={emergencyCount}
            waitingForTriage={waitingCount}
            maternalRecalls={12}
            activeFilter={activeKpiFilter}
            onFilterSelect={(filterId) => setActiveKpiFilter(filterId)}
          />

          {/* ── Main 2-Column Content Grid ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            {/* Left: Priority Health & Triage Worklist (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <TriageWorklist
                patients={
                  activeKpiFilter === 'emergency'
                    ? patients.filter((p) => p.isEmergency || p.triageLevel === 'Emergency')
                    : activeKpiFilter === 'waiting'
                    ? patients.filter((p) => !p.vitals)
                    : activeKpiFilter === 'triaged'
                    ? patients.filter((p) => !!p.vitals)
                    : activeKpiFilter === 'maternal'
                    ? patients.filter((p) => p.category === 'Maternal')
                    : patients
                }
                onMeasureVitals={handleOpenMeasureVitals}
                onOpenQuickTriage={handleOpenFirstPending}
              />
            </div>

            {/* Right: Village Outreach Due (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <OutreachWorklist
                outreachList={outreachList}
                onToggleComplete={handleToggleOutreach}
                onCallBeneficiary={handleCallBeneficiary}
              />

              {/* Quick Emergency Protocol Card */}
              <div className="bg-gradient-to-br from-slate-900 to-gov-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      PHC Tele-Consult Helpline
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-slate-300">
                    Kasaba Bawada Sector
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Direct hotlines for medical officer escalation during home visits and community maternal emergencies.
                </p>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400">Dr. Patil (PHC MO): <strong className="text-white">+91 94220 18273</strong></span>
                  <span className="text-mint-400 font-semibold cursor-pointer hover:underline">108 Ambulance</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── ABDM Cloud Integration Footer Strip ───────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-slate-800">Ayushman Bharat Digital Mission (ABDM) Integration:</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                Connected &amp; Active
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span>FHIR R4 Gateway: <strong>Ready</strong></span>
              <span>•</span>
              <span>Offline Cache: <strong>Synchronized</strong></span>
              <span>•</span>
              <span>Last Health Record Sync: <strong>Just Now</strong></span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Named aliases for flexibility
export { AshaDashboard, AshaDashboard as AshaworkerDashboard };
