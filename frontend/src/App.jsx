import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import PatientAuth from './pages/auth/PatientAuth';
import HospitalRegister from './pages/auth/HospitalRegister';
import HospitalLogin from './pages/auth/HospitalLogin';
import GovtLogin from './pages/auth/GovtLogin';
import PatientDashboard from './pages/dashboards/PatientDashboard';
import HospitalAdminDashboard from './pages/dashboards/HospitalAdminDashboard';
import GovtDashboard from './pages/dashboards/GovtDashboard';
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import LabDashboard from './pages/dashboards/LabDashboard';
import AshaDashboard from './pages/dashboards/AshaDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-mint-100 selection:text-mint-900">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Landing */}
            <Route path="/" element={<Landing />} />

            {/* Authentication Routes */}
            <Route path="/auth/patient" element={<PatientAuth />} />
            <Route path="/auth/hospital/register" element={<HospitalRegister />} />
            {/* Unified Staff & Admin Login (Prompt 2.4) */}
            <Route path="/auth/hospital/login" element={<HospitalLogin />} />
            <Route path="/auth/govt" element={<GovtLogin />} />

            {/* Dashboards — role-specific routes (Prompt 2.4) */}
            <Route path="/dashboard/patient" element={<PatientDashboard />} />
            <Route path="/dashboard/govt" element={<GovtDashboard />} />

            {/* Hospital Admin — /dashboard/admin (new canonical) + /dashboard/hospital (legacy alias) */}
            <Route path="/dashboard/admin" element={<HospitalAdminDashboard />} />
            <Route path="/dashboard/hospital" element={<HospitalAdminDashboard />} />

            {/* Staff dashboards */}
            <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
            <Route path="/dashboard/lab" element={<LabDashboard />} />
            <Route path="/dashboard/asha" element={<AshaDashboard />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
