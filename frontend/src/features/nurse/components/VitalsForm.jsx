import React, { useState, useEffect, useMemo } from 'react';
import nurseApi from '../services/nurseApi';

export default function VitalsForm({
  appointment,
  onSuccess,
  onCancel,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // ── Vitals state ────────────────────────────────────────────────────────────
  const [bloodPressure, setBloodPressure] = useState('');
  const [bloodSugar, setBloodSugar]       = useState('');
  const [height, setHeight]               = useState('');
  const [weight, setWeight]               = useState('');
  const [temperature, setTemperature]     = useState('98.6');
  const [pulse, setPulse]                 = useState('');
  const [spO2, setSpO2]                   = useState('98');
  const [notes, setNotes]                 = useState('');

  // ── Pre-fill when appointment changes ───────────────────────────────────────
  useEffect(() => {
    if (appointment) {
      setError('');
      setBloodPressure('');
      setBloodSugar('');
      setHeight('');
      setWeight('');
      setTemperature('98.6');
      setPulse('');
      setSpO2('98');
      setNotes('');
    }
  }, [appointment]);

  // ── Real-time BMI Calculation ───────────────────────────────────────────────
  const bmiInfo = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return null;
    const meters = h / 100;
    const val = (w / (meters * meters)).toFixed(1);

    let category = 'Normal';
    let color = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (val < 18.5) {
      category = 'Underweight';
      color = 'bg-amber-100 text-amber-800 border-amber-200';
    } else if (val >= 25 && val < 30) {
      category = 'Overweight';
      color = 'bg-orange-100 text-orange-800 border-orange-200';
    } else if (val >= 30) {
      category = 'Obese';
      color = 'bg-rose-100 text-rose-800 border-rose-200';
    }

    return { value: val, category, color };
  }, [height, weight]);

  // ── Submit Handler ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!appointment) return;

    if (!bloodPressure.trim() || !bloodSugar.trim() || !height.trim() || !weight.trim()) {
      setError('Please fill in all core vitals: Blood Pressure, Blood Sugar, Height, and Weight.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      appointmentId: appointment._id,
      bloodPressure: bloodPressure.trim(),
      bloodSugar:    bloodSugar.trim(),
      height:        height.trim(),
      weight:        weight.trim(),
      temperature:   temperature.trim() || undefined,
      pulse:         pulse.trim() || undefined,
      spO2:          spO2.trim() || undefined,
      notes:         notes.trim() || undefined,
    };

    try {
      const res = await nurseApi.captureVitals(payload);
      onSuccess?.(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record vitals. Please check inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!appointment) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-10 flex flex-col items-center justify-center text-center h-full min-h-[420px] shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 className="text-base font-extrabold text-slate-800">Triage Vitals Entry</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
          Select any waiting patient from the triage table to record their clinical vitals and push them to the doctor's queue.
        </p>
      </div>
    );
  }

  const patient = appointment.patientId;
  const isUrgent = appointment.priority === 'Urgent';
  const age = patient?.dob
    ? Math.floor((new Date() - new Date(patient.dob)) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-5">
      {/* ── Patient Banner ───────────────────────────────────────────────── */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          isUrgent
            ? 'bg-rose-50/80 border-rose-200'
            : 'bg-teal-50/70 border-teal-100'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 text-white ${
                isUrgent ? 'bg-rose-600' : 'bg-teal-700'
              }`}
            >
              {appointment.queueNumber ? `#${appointment.queueNumber}` : 'Tr'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {appointment.patientFullName}
                </h3>
                {isUrgent && (
                  <span className="px-2 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase">
                    Urgent
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                {patient?.gender && <span>{patient.gender}</span>}
                {age !== null && (
                  <>
                    <span>·</span>
                    <span>{age} yrs</span>
                  </>
                )}
                {patient?.bloodGroup && (
                  <>
                    <span>·</span>
                    <span className="font-bold text-rose-600">{patient.bloodGroup}</span>
                  </>
                )}
                {patient?.contactPhone && (
                  <>
                    <span>·</span>
                    <span className="font-mono">{patient.contactPhone}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 p-1"
          >
            ✕
          </button>
        </div>

        {appointment.chiefComplaint && (
          <div className="mt-2.5 pt-2 border-t border-slate-200/50 text-xs text-slate-600 flex items-center gap-1.5">
            <span className="font-bold text-slate-400 text-[10px] uppercase">Complaint:</span>
            <span className="font-medium truncate">{appointment.chiefComplaint}</span>
          </div>
        )}
      </div>

      {/* ── Error Banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ── Core Vitals (Required) ────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-600" />
            <span>Core Triage Vitals (Required)</span>
          </h4>
          <span className="text-[10px] text-slate-400 font-medium">* All 4 fields required</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Blood Pressure */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>🩺 Blood Pressure *</span>
              <span className="text-[10px] text-slate-400 font-normal">mmHg</span>
            </label>
            <input
              type="text"
              required
              value={bloodPressure}
              onChange={(e) => setBloodPressure(e.target.value)}
              placeholder="e.g. 120/80"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/50
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium transition-all"
            />
          </div>

          {/* Blood Sugar */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>🩸 Blood Sugar *</span>
              <span className="text-[10px] text-slate-400 font-normal">mg/dL</span>
            </label>
            <input
              type="text"
              required
              value={bloodSugar}
              onChange={(e) => setBloodSugar(e.target.value)}
              placeholder="e.g. 110"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/50
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium transition-all"
            />
          </div>

          {/* Height */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>📏 Height *</span>
              <span className="text-[10px] text-slate-400 font-normal">cm</span>
            </label>
            <input
              type="number"
              required
              min="30"
              max="260"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 172"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/50
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium transition-all"
            />
          </div>

          {/* Weight */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>⚖️ Weight *</span>
              <span className="text-[10px] text-slate-400 font-normal">kg</span>
            </label>
            <input
              type="number"
              required
              min="1"
              max="350"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 68"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/50
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium transition-all"
            />
          </div>
        </div>

        {/* Calculated BMI Badge */}
        {bmiInfo && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Computed Body Mass Index (BMI):</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-800">{bmiInfo.value}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${bmiInfo.color}`}>
                {bmiInfo.category}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Secondary / Optional Vitals ───────────────────────────────────── */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Secondary Vitals & Observations
        </h4>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">🌡️ Temp (°F)</label>
            <input
              type="text"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="98.6"
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">💓 Pulse (bpm)</label>
            <input
              type="text"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              placeholder="72"
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">🫁 SpO2 (%)</label>
            <input
              type="text"
              value={spO2}
              onChange={(e) => setSpO2(e.target.value)}
              placeholder="98"
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500">Nurse Observations & Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Patient conscious, oriented, mild distress, vitals verified..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50
              focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none"
          />
        </div>
      </div>

      {/* ── Submit Action ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Submitting & Forwarding...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span>Push to Doctor Queue</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
