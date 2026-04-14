import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore.js';
import Sidebar from './components/layout/Sidebar.jsx';

// Lazy pages
import Dashboard from './pages/Dashboard/index.jsx';
import StudentsPage from './pages/Students/index.jsx';
import CoursesPage from './pages/Courses/index.jsx';
import ClassesPage from './pages/Classes/index.jsx';
import AttendancePage from './pages/Attendance/index.jsx';
import TuitionPage from './pages/Tuition/index.jsx';
import TuitionAdminPage from './pages/TuitionAdmin/index.jsx';
import LoginPage from './pages/Login.jsx';

// Protected route wrapper
const ProtectedLayout = () => {
  const { isAuthenticated, fetchMe } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) fetchMe();
  }, []);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/tuition" element={<TuitionPage />} />
          <Route path="/tuition-admin" element={<TuitionAdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Be Vietnam Pro, sans-serif',
            fontSize: '13.5px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
          },
          success: { iconTheme: { primary: '#f59e0b', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
