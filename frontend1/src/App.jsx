import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layout/DashboardLayout';
import Login from './pages/Login';

// ============= EXISTING PAGES =============
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Staff from './pages/Staff';
import Shifts from './pages/Shifts';
import Machinery from './pages/Machinery';
import Suppliers from './pages/Suppliers';
import RawMaterials from './pages/RawMaterials';
import Purchases from './pages/Purchases';
import Products from './pages/Products';
import Finance from './pages/Finance';
import Inventory from './pages/Inventory'; // ✅ NEW: Auto-updating Inventory page

// ============= NEW HR MODULES =============
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';

// ============= NEW PRODUCTION MODULES =============
import Production from './pages/Production';
import QualityControl from './pages/QualityControl';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <DashboardLayout>{children}</DashboardLayout>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* ============= PUBLIC ROUTES ============= */}
        <Route path="/login" element={<Login />} />

        {/* ============= PROTECTED ROUTES ============= */}
        
        {/* Dashboard */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        {/* Organization */}
        <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
        <Route path="/shifts" element={<ProtectedRoute><Shifts /></ProtectedRoute>} />

        {/* HR Management */}
        <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
        <Route path="/hr/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
        <Route path="/hr/leaves" element={<ProtectedRoute><Leaves /></ProtectedRoute>} />
        <Route path="/hr/payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />

        {/* Production */}
        <Route path="/production" element={<ProtectedRoute><Production /></ProtectedRoute>} />
        <Route path="/quality-control" element={<ProtectedRoute><QualityControl /></ProtectedRoute>} />

        {/* Inventory */}
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} /> {/* ✅ NEW: Main Inventory Page */}
        <Route path="/inventory/raw-materials" element={<ProtectedRoute><RawMaterials /></ProtectedRoute>} />
        <Route path="/inventory/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/inventory/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
        <Route path="/inventory/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />

        {/* Asset Management */}
        <Route path="/machinery" element={<ProtectedRoute><Machinery /></ProtectedRoute>} />
        
        {/* Finance */}
        <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;