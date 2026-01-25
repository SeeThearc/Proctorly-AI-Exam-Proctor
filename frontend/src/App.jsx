import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './utils/ProtectedRoute';

// Auth pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import FaceSetup from './pages/Auth/FaceSetup';

// Student pages
import StudentDashboard from './pages/Student/Dashboard';
import AvailableExams from './pages/Student/AvailableExams';
import ExamInstructions from './pages/Student/ExamInstructions';
import ExamAttempt from './pages/Student/ExamAttempt.jsx';
import ExamResults from './pages/Student/ExamResults';
import ExamHistory from './pages/Student/ExamHistory';

// Faculty pages
import FacultyDashboard from './pages/Faculty/Dashboard';
import CreateExam from './pages/Faculty/CreateExam';
import ExamList from './pages/Faculty/ExamList';
import ExamDetails from './Pages/Faculty/ExamDetails';
import EditExam from './Pages/Faculty/EditExam';
import SessionReports from './pages/Faculty/SessionReports';
// import MonitorExam from './pages/Faculty/MonitorExam';

// Admin pages
import AdminDashboard from './pages/Admin/Dashboard';
import UserManagement from './pages/Admin/UserManagement';
import CreateUser from './pages/Admin/CreateUser';
import SystemStats from './pages/Admin/SystemStats';

// Common pages
import Unauthorized from './Pages/Unauthorized';
import NotFound from './pages/NotFound';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Student routes */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/face-setup" element={
            <ProtectedRoute allowedRoles={['student']}>
              <FaceSetup />
            </ProtectedRoute>
          } />
          <Route path="/student/exams" element={
            <ProtectedRoute allowedRoles={['student']}>
              <AvailableExams />
            </ProtectedRoute>
          } />
          <Route path="/student/exam/:examId/instructions" element={
            <ProtectedRoute allowedRoles={['student']}>
              <ExamInstructions />
            </ProtectedRoute>
          } />
          <Route path="/student/exam/:examId/attempt" element={
            <ProtectedRoute allowedRoles={['student']}>
              <ExamAttempt />
            </ProtectedRoute>
          } />
          <Route path="/student/results/:sessionId" element={
            <ProtectedRoute allowedRoles={['student']}>
              <ExamResults />
            </ProtectedRoute>
          } />
          <Route path="/student/history" element={
            <ProtectedRoute allowedRoles={['student']}>
              <ExamHistory />
            </ProtectedRoute>
          } />

          {/* Faculty routes */}
          <Route path="/faculty" element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <FacultyDashboard />
            </ProtectedRoute>
          } />
          <Route path="/faculty/exams" element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <ExamList />
            </ProtectedRoute>
          } />
          <Route path="/faculty/exams/create" element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <CreateExam />
            </ProtectedRoute>
          } />
          <Route path="/faculty/exams/:examId" element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <ExamDetails />
            </ProtectedRoute>
          } />
          <Route path="/faculty/exams/:examId/edit" element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <EditExam />
            </ProtectedRoute>
          } />
          <Route path="/faculty/exams/:examId/sessions" element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <SessionReports />
            </ProtectedRoute>
          } />
          {/* <Route path="/faculty/exams/:examId/monitor" element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <MonitorExam />
            </ProtectedRoute>
          } /> */}

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/create" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateUser />
            </ProtectedRoute>
          } />
          <Route path="/admin/stats" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SystemStats />
            </ProtectedRoute>
          } />

          {/* Default redirect based on role */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;