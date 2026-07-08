import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Compiler from './pages/Compiler';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BatchManagement from './pages/BatchManagement';
import TeacherStudents from './pages/TeacherStudents';
import TeacherContests from './pages/TeacherContests';
import AdminProblems from './pages/AdminProblems';
import AdminTests from './pages/AdminTests';
import CompanyDashboard from './pages/CompanyDashboard';
import Problems from './pages/Problems';
import ProblemDetail from './pages/ProblemDetail';
import CreateQuestion from './pages/CreateQuestion';
import CreateTest from './pages/CreateTest';
import Contests from './pages/Contests';
import CandidateResults from './pages/CandidateResults';
import ProctoringReport from './pages/ProctoringReport';
import LiveExamDashboard from './pages/LiveExamDashboard';
import PlagiarismReport from './pages/PlagiarismReport';
import Profile from './pages/Profile';
import Progress from './pages/Progress';
import TakeTest from './pages/TakeTest';
import TestDetail from './pages/TestDetail';
import StudyPlans from './pages/StudyPlans';
import StudyPlanDetail from './pages/StudyPlanDetail';
import NotFound from './pages/NotFound';

function SmartHome() {
  const { user } = useAuth();
  if (!user) return <Landing />;
  switch (user.role) {
    case 'ADMIN': return <Navigate to="/admin" replace />;
    case 'TEACHER': return <Navigate to="/teacher" replace />;
    case 'COMPANY': return <Navigate to="/company" replace />;
    default: return <Navigate to="/problems" replace />;
  }
}

function AppContent() {
  const location = useLocation();
  // While taking a test, hide the global navbar (Problems, Compiler, Study Plans, Contests, etc.)
  // so students can't navigate away. Test problems open at /problem/:id?testId=..., and the
  // test runner lives at /test/:id.
  const inTest = location.pathname.startsWith('/test/')
    || new URLSearchParams(location.search).has('testId');
  const hideNavbar = inTest
    || location.pathname === '/login'
    || location.pathname === '/register'
    || location.pathname === '/forgot-password'
    || location.pathname === '/reset-password'
    || location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* Home — redirect logged-in users to dashboard */}
        <Route path="/" element={<SmartHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Authenticated Routes */}
        <Route path="/compiler" element={
          <ProtectedRoute>
            <Compiler />
          </ProtectedRoute>
        } />
        <Route path="/problems" element={
          <ProtectedRoute>
            <Problems />
          </ProtectedRoute>
        } />
        <Route path="/problem/:id" element={
          <ProtectedRoute>
            <ProblemDetail />
          </ProtectedRoute>
        } />
        <Route path="/contests" element={
          <ProtectedRoute>
            <Contests />
          </ProtectedRoute>
        } />
        <Route path="/test/:id" element={
          <ProtectedRoute>
            <TakeTest />
          </ProtectedRoute>
        } />
        <Route path="/contest/:id" element={
          <ProtectedRoute>
            <TestDetail />
          </ProtectedRoute>
        } />
        <Route path="/contest/:id/live" element={
          <ProtectedRoute roles={['TEACHER', 'ADMIN', 'COMPANY']}>
            <LiveExamDashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/profile/:username" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/progress" element={
          <ProtectedRoute>
            <Progress />
          </ProtectedRoute>
        } />
        <Route path="/studyplans" element={
          <ProtectedRoute>
            <StudyPlans />
          </ProtectedRoute>
        } />
        <Route path="/studyplan/:planId" element={
          <ProtectedRoute>
            <StudyPlanDetail />
          </ProtectedRoute>
        } />

        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute roles={['STUDENT']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />

        {/* Teacher Routes */}
        <Route path="/teacher" element={
          <ProtectedRoute roles={['TEACHER', 'ADMIN']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        <Route path="/teacher/contests" element={
          <ProtectedRoute roles={['TEACHER', 'ADMIN']}>
            <TeacherContests />
          </ProtectedRoute>
        } />
        <Route path="/teacher/create-question" element={
          <ProtectedRoute roles={['TEACHER', 'ADMIN', 'COMPANY']}>
            <CreateQuestion />
          </ProtectedRoute>
        } />
        <Route path="/teacher/edit-question/:id" element={
          <ProtectedRoute roles={['TEACHER', 'ADMIN']}>
            <CreateQuestion />
          </ProtectedRoute>
        } />
        <Route path="/teacher/create-test" element={
          <ProtectedRoute roles={['TEACHER', 'ADMIN']}>
            <CreateTest />
          </ProtectedRoute>
        } />
        <Route path="/teacher/edit-test/:id" element={
          <ProtectedRoute roles={['TEACHER', 'ADMIN']}>
            <CreateTest />
          </ProtectedRoute>
        } />

        {/* Company Routes */}
        <Route path="/company" element={
          <ProtectedRoute roles={['COMPANY', 'ADMIN']}>
            <CompanyDashboard />
          </ProtectedRoute>
        } />
        <Route path="/company/create-test" element={
          <ProtectedRoute roles={['COMPANY', 'ADMIN']}>
            <CreateTest />
          </ProtectedRoute>
        } />
        <Route path="/company/candidates/:testId" element={
          <ProtectedRoute roles={['COMPANY', 'ADMIN']}>
            <CandidateResults />
          </ProtectedRoute>
        } />

        {/* Proctoring & Plagiarism Reports (Teacher/Admin/Company) */}
        <Route path="/proctoring/:testId" element={
          <ProtectedRoute roles={['TEACHER', 'ADMIN', 'COMPANY']}>
            <ProctoringReport />
          </ProtectedRoute>
        } />
        <Route path="/plagiarism/:testId" element={
          <ProtectedRoute roles={['TEACHER', 'ADMIN', 'COMPANY']}>
            <PlagiarismReport />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/batches" element={
          <ProtectedRoute roles={['ADMIN', 'TEACHER']}>
            <BatchManagement />
          </ProtectedRoute>
        } />
        <Route path="/teacher/students" element={
          <ProtectedRoute roles={['ADMIN', 'TEACHER']}>
            <TeacherStudents />
          </ProtectedRoute>
        } />
        <Route path="/admin/problems" element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminProblems />
          </ProtectedRoute>
        } />
        <Route path="/admin/tests" element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminTests />
          </ProtectedRoute>
        } />

        {/* 404 — must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#2d2d2d',
            color: '#eff2f6',
            border: '1px solid #3e3e3e',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: '500',
            maxWidth: '480px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          },
          success: {
            style: {
              background: '#1a2e1a',
              color: '#00b8a3',
              border: '1px solid rgba(0,184,163,0.3)',
            },
            iconTheme: { primary: '#00b8a3', secondary: '#1a2e1a' },
          },
          error: {
            style: {
              background: '#2a1515',
              color: '#ef4743',
              border: '1px solid rgba(239,71,67,0.3)',
            },
            iconTheme: { primary: '#ef4743', secondary: '#2a1515' },
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
