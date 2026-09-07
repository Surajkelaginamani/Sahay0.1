import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Status config ────────────────────────────────────────────────────────────
const QUEUE_STATUS = {
  Waiting:     { label: 'Waiting',      color: 'text-amber-700 bg-amber-50  border-amber-200', dot: 'bg-amber-500' },
  'In Progress': { label: 'In Progress', color: 'text-sky-700   bg-sky-50   border-sky-200',   dot: 'bg-sky-500 animate-pulse' },
  Completed:   { label: 'Completed',    color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  Cancelled:   { label: 'Cancelled',    color: 'text-slate-500  bg-slate-50 border-slate-200', dot: 'bg-slate-400' },
};

const VISIT_TYPES = ['General Checkup', 'Follow-up', 'Emergency', 'Vaccination', 'Lab Test', 'Consultation'];
const DEPARTMENTS  = ['General OPD', 'Pediatrics', 'Cardiology', 'Orthopedics', 'Gynecology', 'Dermatology', 'Neurology'];

// ─── Mock seed data ────────────────────────────────────────────────────────────
const SEED_QUEUE = [
  { id: 'Q001', token: 'T-01', name: 'Ravi Kumar',       age: 45, gender: 'Male',   phone: '9876543210', visitType: 'General Checkup', department: 'General OPD',  doctor: 'Dr. Priya Sharma', status: 'In Progress', arrivalTime: '09:10 AM', priority: 'Normal' },
  { id: 'Q002', token: 'T-02', name: 'Sunita Devi',      age: 32, gender: 'Female', phone: '9765432109', visitType: 'Follow-up',       department: 'Gynecology',   doctor: 'Dr. Anjali Singh',  status: 'Waiting',     arrivalTime: '09:25 AM', priority: 'Normal' },
  { id: 'Q003', token: 'T-03', name: 'Manoj Patel',      age: 60, gender: 'Male',   phone: '9654321098', visitType: 'Consultation',    department: 'Cardiology',   doctor: 'Dr. Rajeev Mehta',  status: 'Waiting',     arrivalTime: '09:30 AM', priority: 'High'   },
  { id: 'Q004', token: 'T-04', name: 'Geeta Rani',       age: 28, gender: 'Female', phone: '9543210987', visitType: 'Vaccination',     department: 'Pediatrics',   doctor: 'Dr. Sunita Das',    status: 'Waiting',     arrivalTime: '09:45 AM', priority: 'Normal' },
  { id: 'Q005', token: 'T-05', name: 'Arjun Singh',      age: 8,  gender: 'Male',   phone: '9432109876', visitType: 'General Checkup', department: 'Pediatrics',   doctor: 'Dr. Sunita Das',    status: 'Completed',   arrivalTime: '08:50 AM', priority: 'Normal' },
  { id: 'Q006', token: 'T-06', name: 'Lalita Sharma',    age: 55, gender: 'Female', phone: '9321098765', visitType: 'Lab Test',        department: 'General OPD',  doctor: 'Dr. Priya Sharma',  status: 'Waiting',     arrivalTime: '10:00 AM', priority: 'Normal' },
  { id: 'Q007', token: 'T-07', name: 'Vikram Verma',     age: 38, gender: 'Male',   phone: '9210987654', visitType: 'Emergency',       department: 'Cardiology',   doctor: 'Dr. Rajeev Mehta',  status: 'In Progress', arrivalTime: '10:05 AM', priority: 'High'   },
];

// ─── Utility ──────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, gradient, iconBg }) {
  return (
    <div className={`relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex gap-4 items-start`}>
      <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-extrabold text-slate-900 leading-none mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{sub}</p>}
      </div>
      {/* Decorative gradient blob */}
      <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-10 ${gradient}`} />
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = QUEUE_STATUS[status] || QUEUE_STATUS.Waiting;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return priority === 'High'
    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">⚡ High</span>
    : <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wide">Normal</span>;
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm font-medium animate-fade-in max-w-sm
      ${toast.type === 'success' ? 'bg-white border-emerald-200 text-emerald-900' : 'bg-white border-rose-200 text-rose-900'}`}>
      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
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
      <div>
        <p className="font-semibold text-slate-900 text-sm">{toast.title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{toast.message}</p>
      </div>
    </div>
  );
}

// ─── Walk-in Registration Modal ───────────────────────────────────────────────
function RegisterModal({ onClose, onRegister }) {
  const [form, setForm] = useState({
    name: '', age: '', gender: 'Male', phone: '', visitType: 'General Checkup',
    department: 'General OPD', doctor: '', priority: 'Normal', notes: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.age || form.age < 1 || form.age > 120) e.age = 'Enter a valid age (1–120)';
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onRegister(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md shadow-rose-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Register Walk-in Patient</h2>
              <p className="text-[11px] text-slate-400">Token will be auto-assigned after registration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name *</label>
            <input
              type="text" placeholder="e.g. Ramesh Kumar"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition-all bg-slate-50 focus:bg-white ${errors.name ? 'border-rose-400' : 'border-slate-200'}`}
            />
            {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
          </div>

          {/* Age / Gender / Phone */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Age *</label>
              <input
                type="number" min="1" max="120" placeholder="Age"
                value={form.age} onChange={e => setForm({ ...form, age: e.target.value })}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition-all bg-slate-50 focus:bg-white ${errors.age ? 'border-rose-400' : 'border-slate-200'}`}
              />
              {errors.age && <p className="text-[11px] text-rose-600 mt-1">{errors.age}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Gender</label>
              <select
                value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-slate-50 focus:bg-white transition-all"
              >
                {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
              <select
                value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-slate-50 focus:bg-white transition-all"
              >
                <option>Normal</option>
                <option>High</option>
              </select>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone Number *</label>
            <input
              type="tel" placeholder="10-digit mobile number"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition-all bg-slate-50 focus:bg-white ${errors.phone ? 'border-rose-400' : 'border-slate-200'}`}
            />
            {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
          </div>

          {/* Visit Type / Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Visit Type</label>
              <select
                value={form.visitType} onChange={e => setForm({ ...form, visitType: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-slate-50 focus:bg-white transition-all"
              >
                {VISIT_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Department</label>
              <select
                value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-slate-50 focus:bg-white transition-all"
              >
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Doctor */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Assigned Doctor <span className="font-normal text-slate-400">(optional)</span></label>
            <input
              type="text" placeholder="e.g. Dr. Priya Sharma"
              value={form.doctor} onChange={e => setForm({ ...form, doctor: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition-all bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea
              rows={2} placeholder="Any relevant details..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition-all bg-slate-50 focus:bg-white resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-bold shadow-sm shadow-rose-200 hover:from-rose-600 hover:to-pink-700 transition-all active:scale-[0.99]">
              Register & Assign Token
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Queue Row ─────────────────────────────────────────────────────────────────
function QueueRow({ entry, onStatusChange, onCall, index }) {
  const [expanded, setExpanded] = useState(false);

  const nextStatus = {
    Waiting: 'In Progress',
    'In Progress': 'Completed',
    Completed: null,
    Cancelled: null,
  }[entry.status];

  return (
    <>
      <tr
        className={`transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white hover:bg-slate-50/70' : 'bg-slate-50/40 hover:bg-slate-100/50'}`}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Token */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0
              ${entry.status === 'In Progress' ? 'bg-sky-100 text-sky-800 ring-2 ring-sky-400 ring-offset-1' :
                entry.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
              {entry.token}
            </span>
            {entry.priority === 'High' && (
              <span className="text-[9px] font-black text-red-600 uppercase tracking-wide">⚡ PRIORITY</span>
            )}
          </div>
        </td>

        {/* Patient */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0
              ${entry.gender === 'Female' ? 'bg-pink-100 text-pink-700' : 'bg-sky-100 text-sky-700'}`}>
              {getInitials(entry.name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{entry.name}</p>
              <p className="text-[11px] text-slate-400">{entry.age}y · {entry.gender} · {entry.phone}</p>
            </div>
          </div>
        </td>

        {/* Department */}
        <td className="px-4 py-3.5 whitespace-nowrap hidden md:table-cell">
          <p className="text-xs font-medium text-slate-700">{entry.department}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{entry.visitType}</p>
        </td>

        {/* Doctor */}
        <td className="px-4 py-3.5 whitespace-nowrap hidden lg:table-cell">
          <p className="text-xs text-slate-600">{entry.doctor || '—'}</p>
        </td>

        {/* Arrival */}
        <td className="px-4 py-3.5 whitespace-nowrap hidden sm:table-cell">
          <p className="text-xs font-medium text-slate-600">{entry.arrivalTime}</p>
        </td>

        {/* Status */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <StatusBadge status={entry.status} />
        </td>

        {/* Actions */}
        <td className="px-4 py-3.5 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-2">
            {entry.status === 'Waiting' && (
              <button
                onClick={() => onCall(entry)}
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
              >
                📣 Call
              </button>
            )}
            {nextStatus && (
              <button
                onClick={() => onStatusChange(entry.id, nextStatus)}
                className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors
                  ${nextStatus === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
              >
                {nextStatus === 'In Progress' ? '▶ Start' : '✓ Done'}
              </button>
            )}
            {entry.status !== 'Completed' && entry.status !== 'Cancelled' && (
              <button
                onClick={() => onStatusChange(entry.id, 'Cancelled')}
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded notes row */}
      {expanded && entry.notes && (
        <tr className="bg-amber-50/40 border-b border-slate-100">
          <td colSpan={7} className="px-6 py-2.5">
            <p className="text-xs text-slate-600"><span className="font-semibold text-amber-700">📋 Notes:</span> {entry.notes}</p>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function ReceptionistDashboard() {
  const navigate   = useNavigate();
  const [user, setUser]           = useState(null);
  const [queue, setQueue]         = useState(SEED_QUEUE);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch]       = useState('');
  const [toast, setToast]         = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tokenCounter, setTokenCounter] = useState(SEED_QUEUE.length + 1);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auth guard
  useEffect(() => {
    const stored = localStorage.getItem('user') || localStorage.getItem('sahay_user');
    if (!stored) { navigate('/auth/hospital/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'Receptionist') { navigate('/'); return; }
    setUser(parsed);
  }, [navigate]);

  const showToast = useCallback((type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Metrics derived from queue
  const stats = {
    total: queue.length,
    waiting: queue.filter(q => q.status === 'Waiting').length,
    inProgress: queue.filter(q => q.status === 'In Progress').length,
    completed: queue.filter(q => q.status === 'Completed').length,
    highPriority: queue.filter(q => q.priority === 'High' && q.status !== 'Completed' && q.status !== 'Cancelled').length,
  };

  // Filtered queue
  const filtered = queue
    .filter(q => filterStatus === 'ALL' || q.status === filterStatus)
    .filter(q => {
      const s = search.toLowerCase();
      return !s || q.name.toLowerCase().includes(s) || q.token.toLowerCase().includes(s) || q.phone.includes(s);
    });

  const handleStatusChange = useCallback((id, newStatus) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));
    showToast('success', 'Status Updated', `Patient status changed to "${newStatus}".`);
  }, [showToast]);

  const handleCall = useCallback((entry) => {
    showToast('success', 'Patient Called', `📣 Now calling ${entry.name} (${entry.token}) to ${entry.department}.`);
  }, [showToast]);

  const handleRegister = useCallback((form) => {
    const token = `T-${String(tokenCounter).padStart(2, '0')}`;
    const newEntry = {
      id: `Q${Date.now()}`,
      token,
      name: form.name.trim(),
      age: parseInt(form.age),
      gender: form.gender,
      phone: form.phone.trim(),
      visitType: form.visitType,
      department: form.department,
      doctor: form.doctor.trim() || '—',
      status: 'Waiting',
      arrivalTime: formatTime(new Date()),
      priority: form.priority,
      notes: form.notes.trim() || '',
    };
    setQueue(prev => [...prev, newEntry]);
    setTokenCounter(prev => prev + 1);
    setShowModal(false);
    showToast('success', 'Patient Registered', `${form.name} has been added to the queue with token ${token}.`);
  }, [tokenCounter, showToast]);

  const handleLogout = () => {
    ['token', 'sahay_token', 'user', 'sahay_user'].forEach(k => localStorage.removeItem(k));
    navigate('/auth/hospital/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-[85vh] bg-gradient-to-br from-slate-50 via-rose-50/20 to-pink-50/25 px-4 sm:px-8 py-8">
      <Toast toast={toast} />
      {showModal && <RegisterModal onClose={() => setShowModal(false)} onRegister={handleRegister} />}

      <div className="max-w-7xl mx-auto space-y-7">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-200/50 shrink-0">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Reception Desk
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Live Queue
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-semibold text-slate-700">{user.name}</span>
                &nbsp;·&nbsp;
                <span>{user.hospitalName || 'Healthcare Facility'}</span>
                &nbsp;·&nbsp;
                <span className="font-mono text-slate-600 text-xs">
                  {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {stats.highPriority > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-pulse">
                ⚡ {stats.highPriority} Priority
              </span>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-bold shadow-md shadow-rose-200/50 hover:from-rose-600 hover:to-pink-700 transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Register Walk-in
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* ── Stat Cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            label="Total Today" value={stats.total} sub="Patients registered today"
            gradient="bg-slate-400" iconBg="bg-slate-100"
          />
          <StatCard
            icon={<svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="In Waiting" value={stats.waiting} sub="Awaiting consultation"
            gradient="bg-amber-400" iconBg="bg-amber-100"
          />
          <StatCard
            icon={<svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="In Progress" value={stats.inProgress} sub="Currently being seen"
            gradient="bg-sky-400" iconBg="bg-sky-100"
          />
          <StatCard
            icon={<svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
            label="Completed" value={stats.completed} sub="Consultations done"
            gradient="bg-emerald-400" iconBg="bg-emerald-100"
          />
        </div>

        {/* ── Queue Table ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Table Header Bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-slate-800">Live Patient Queue</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Showing {filtered.length} of {queue.length} patients · Click row to see notes
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" placeholder="Search name, token, phone…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 bg-slate-50 focus:bg-white w-56 transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'Waiting', 'In Progress', 'Completed', 'Cancelled'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all
                    ${filterStatus === s
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  {s}
                  {s !== 'ALL' && (
                    <span className="ml-1 opacity-70">({queue.filter(q => q.status === s).length})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Token</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Department / Visit</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Doctor</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Arrival</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm font-semibold text-slate-500">No patients found</p>
                        <p className="text-xs text-slate-400">Try changing the filter or register a new walk-in</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry, i) => (
                    <QueueRow
                      key={entry.id}
                      entry={entry}
                      index={i}
                      onStatusChange={handleStatusChange}
                      onCall={handleCall}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">
              Last refreshed: {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              &nbsp;·&nbsp; Queue resets daily at midnight
            </p>
            <div className="flex items-center gap-3">
              {Object.entries(QUEUE_STATUS).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                  <span className={`w-2 h-2 rounded-full ${v.dot.replace(' animate-pulse', '')}`} />
                  {v.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick Info Footer ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Today's Date */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Today's Date</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* OPD Hours */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">OPD Hours</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">8:00 AM – 6:00 PM</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">● Open Now</span>
            </div>
          </div>

          {/* Next Token */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Next Token</p>
              <p className="text-2xl font-extrabold text-rose-600 mt-0.5 font-mono">
                T-{String(tokenCounter).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
