import React, { useState, useCallback } from 'react';
import receptionistApi from '../services/receptionistApi';

// ─── Field config ──────────────────────────────────────────────────────────────
const GENDERS    = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const EMPTY_FORM = {
  firstName: '', lastName: '', dob: '', gender: 'Male',
  bloodGroup: '', contactPhone: '',
  address: { village: '', district: '', state: '', pincode: '' },
  abhaId: '',
};

// ─── Tiny field components ─────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {children} {required && <span className="text-rose-500">*</span>}
    </label>
  );
}

function Input({ error, ...props }) {
  return (
    <>
      <input
        {...props}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2
          focus:ring-rose-400 focus:border-rose-400 transition-all bg-slate-50 focus:bg-white
          ${error ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'}`}
      />
      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
    </>
  );
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none
        focus:ring-2 focus:ring-rose-400 bg-slate-50 focus:bg-white transition-all"
    >
      {children}
    </select>
  );
}

// ─── PatientRegistrationForm ───────────────────────────────────────────────────
export default function PatientRegistrationForm({ onSuccess }) {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setAddress = (key, val) =>
    setForm((f) => ({ ...f, address: { ...f.address, [key]: val } }));

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim())  e.lastName  = 'Last name is required';
    if (!form.dob)              e.dob       = 'Date of birth is required';
    if (!form.gender)           e.gender    = 'Gender is required';
    if (form.contactPhone && !/^\d{10}$/.test(form.contactPhone.trim()))
      e.contactPhone = 'Must be a 10-digit number';
    if (form.abhaId && !/^\d{2}-\d{4}-\d{4}-\d{4}$/.test(form.abhaId.trim()))
      e.abhaId = 'Format: XX-XXXX-XXXX-XXXX';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Search existing patient ────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!searchPhone.trim() || searchPhone.trim().length < 2) return;
    setSearching(true);
    setSearchResults(null);
    try {
      const res = await receptionistApi.searchPatients(searchPhone.trim());
      setSearchResults(res.data.patients || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchPhone]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const payload = {
        firstName:    form.firstName.trim(),
        lastName:     form.lastName.trim(),
        dob:          form.dob,
        gender:       form.gender,
        contactPhone: form.contactPhone.trim() || undefined,
        bloodGroup:   form.bloodGroup          || undefined,
        address:      form.address,
        abhaId:       form.abhaId.trim()       || undefined,
      };
      const res = await receptionistApi.registerPatient(payload);
      onSuccess?.({ type: 'registered', patient: res.data.patient });
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      // If duplicate phone, the API returns the existing patient — surface it
      const existing = err.response?.data?.existingPatient;
      if (existing) {
        setApiError(`${msg} (Existing: ${existing.fullName}, ${existing.contactPhone})`);
      } else {
        setApiError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Search existing patient ───────────────────────────────────────── */}
      <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4">
        <p className="text-xs font-bold text-sky-800 mb-2.5 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Check if patient already registered
        </p>
        <div className="flex gap-2">
          <input
            type="text" placeholder="Enter name or phone number…"
            value={searchPhone}
            onChange={(e) => { setSearchPhone(e.target.value); setSearchResults(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-3 py-2 rounded-xl border border-sky-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-colors disabled:opacity-60"
          >
            {searching ? '…' : 'Search'}
          </button>
        </div>
        {searchResults !== null && (
          <div className="mt-3">
            {searchResults.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">No existing records found — proceed to register below.</p>
            ) : (
              <div className="space-y-2">
                {searchResults.map((p) => (
                  <div key={p._id}
                    className="flex items-center justify-between bg-white border border-sky-200 rounded-xl px-3.5 py-2.5">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{p.fullName}</p>
                      <p className="text-[11px] text-slate-400">{p.contactPhone} · {p.gender}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSuccess?.({ type: 'found', patient: p })}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-sky-100 text-sky-800 hover:bg-sky-200 transition-colors"
                    >
                      Use this patient →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Registration form ─────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-px bg-slate-100" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">New Patient Details</p>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>First Name</Label>
            <Input
              type="text" placeholder="e.g. Ramesh"
              value={form.firstName}
              onChange={(e) => setField('firstName', e.target.value)}
              error={errors.firstName}
            />
          </div>
          <div>
            <Label required>Last Name</Label>
            <Input
              type="text" placeholder="e.g. Kumar"
              value={form.lastName}
              onChange={(e) => setField('lastName', e.target.value)}
              error={errors.lastName}
            />
          </div>
        </div>

        {/* DOB / Gender / Blood Group */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label required>Date of Birth</Label>
            <Input
              type="date" value={form.dob}
              onChange={(e) => setField('dob', e.target.value)}
              error={errors.dob}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <Label required>Gender</Label>
            <Select value={form.gender} onChange={(e) => setField('gender', e.target.value)}>
              {GENDERS.map((g) => <option key={g}>{g}</option>)}
            </Select>
          </div>
          <div>
            <Label>Blood Group</Label>
            <Select value={form.bloodGroup} onChange={(e) => setField('bloodGroup', e.target.value)}>
              <option value="">— Select —</option>
              {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
            </Select>
          </div>
        </div>

        {/* Phone */}
        <div>
          <Label>Contact Phone</Label>
          <Input
            type="tel" placeholder="10-digit mobile number"
            value={form.contactPhone}
            onChange={(e) => setField('contactPhone', e.target.value)}
            error={errors.contactPhone}
          />
        </div>

        {/* ABHA ID */}
        <div>
          <Label>ABHA ID
            <span className="ml-1.5 text-[10px] font-normal text-slate-400 normal-case">
              (Ayushman Bharat Health Account — optional)
            </span>
          </Label>
          <Input
            type="text" placeholder="XX-XXXX-XXXX-XXXX"
            value={form.abhaId}
            onChange={(e) => setField('abhaId', e.target.value)}
            error={errors.abhaId}
          />
        </div>

        {/* Address */}
        <div>
          <Label>Address</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'village', placeholder: 'Village / Area' },
              { key: 'district', placeholder: 'District' },
              { key: 'state', placeholder: 'State' },
              { key: 'pincode', placeholder: 'Pincode' },
            ].map(({ key, placeholder }) => (
              <input
                key={key}
                type="text"
                placeholder={placeholder}
                value={form.address[key]}
                onChange={(e) => setAddress(key, e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-slate-50 focus:bg-white transition-all"
              />
            ))}
          </div>
        </div>

        {/* API error banner */}
        {apiError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <svg className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{apiError}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm
            font-bold shadow-sm shadow-rose-200 hover:from-rose-600 hover:to-pink-700 transition-all
            active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Registering…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Register Patient
            </>
          )}
        </button>
      </form>
    </div>
  );
}
