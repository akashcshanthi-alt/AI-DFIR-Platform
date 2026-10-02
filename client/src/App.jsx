import React, { useState, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, Outlet } from 'react-router-dom';

// Import pages
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Cases from './pages/Cases/Cases';
import CreateCase from './pages/Cases/CreateCase';
import CaseDetails from './pages/Cases/CaseDetails';
import AuditLogs from './pages/AuditLogs/AuditLogs';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import AIInvestigation from './pages/AIInvestigation/AIInvestigation';
import ReportsCenter from './pages/Reports/ReportsCenter';
import Profile from './pages/Profile/Profile';
import VerificationCenter from './pages/VerificationCenter/VerificationCenter';

// Import layout components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { auth, getResolvedUserName } from './services/firebase';
import { signOut } from 'firebase/auth';
import { authService } from './services/auth.service';

/**
 * ProtectedRoute Wrapper
 * Validates JWT clearance session and enforces optional RBAC constraints.
 */
function ProtectedRoute({ children, allowedRoles }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = localStorage.getItem('operatorRole');
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  return children;
}

/**
 * PublicRoute Wrapper
 * Prevents authenticated analysts from revisiting login/register pages.
 */
function PublicRoute({ children }) {
  return authService.isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
}

/**
 * MainLayout Wrapper
 * Coordinates the master authenticated layout containing the Sidebar, Header,
 * and page viewport content area. Injects custom styling rules to hide internal
 * child sidebars and headers rendered in existing page components to avoid duplicate UI layers.
 */
function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // User details state populated from local storage and synced with Firebase Auth
  const [userName, setUserName] = useState(() => {
    const stored = localStorage.getItem('operatorName');
    return stored && stored !== 'Security Analyst' ? stored : '';
  });
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('operatorEmail') || '');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('operatorRole') || 'Investigator');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const email = user.email || localStorage.getItem('operatorEmail') || '';
        const storedName = localStorage.getItem('operatorName');
        const resolved = getResolvedUserName(user, storedName);
        const role = localStorage.getItem('operatorRole') || (email.toLowerCase().includes('admin') ? 'Admin' : 'Investigator');

        setUserName(resolved);
        setUserEmail(email);
        setUserRole(role);

        localStorage.setItem('operatorName', resolved);
        if (email) localStorage.setItem('operatorEmail', email);
        localStorage.setItem('operatorRole', role);
      } else {
        const storedName = localStorage.getItem('operatorName');
        const storedEmail = localStorage.getItem('operatorEmail');
        const storedRole = localStorage.getItem('operatorRole');
        if (storedName) setUserName(storedName);
        if (storedEmail) setUserEmail(storedEmail);
        if (storedRole) setUserRole(storedRole);
      }
    });

    return () => unsubscribe();
  }, []);

  // Terminate developer session and redirect to Login
  const handleLogout = async () => {
    try {
      await authService.logout();
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      authService.clearAuth();
      navigate('/login', { replace: true });
    }
  };

  // Determine Title based on current route path
  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/cases') return 'Cases';
    if (path === '/cases/new') return 'Create New Case';
    if (path.startsWith('/cases/')) return 'Case Investigation';
    if (path === '/ai-investigation') return 'AI Investigation';
    if (path === '/audit-logs') return 'Audit Logs';
    if (path === '/reports') return 'Reports';
    if (path === '/profile') return 'My Profile';
    return 'Dashboard';
  };

  return (
    <div className="trace-app-layout">
      {/* Global CSS overrides to hide duplicate inner components in child pages */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-app-layout {
            display: flex;
            min-height: 100vh;
            background-color: var(--bg-main, #060913);
            color: var(--text-primary, #f8fafc);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            width: 100%;
            box-sizing: border-box;
          }

          .trace-app-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            height: 100vh;
            overflow: hidden;
            box-sizing: border-box;
          }

          .trace-app-content {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
          }


          /* Reset layouts of child page wrappers to flex naturally under App.jsx container */
          .trace-dashboard-layout,
          .trace-cases-layout,
          .trace-create-layout,
          .trace-details-layout,
          .trace-audit-layout,
          .trace-settings-layout,
          .trace-profile-layout,
          .trace-reports-page {
            display: block !important;
            width: 100% !important;
            min-height: auto !important;
            background-color: transparent !important;
          }

          .trace-dashboard-main,
          .trace-cases-main,
          .trace-create-main,
          .trace-details-main,
          .trace-audit-main,
          .trace-settings-main,
          .trace-profile-main,
          .trace-reports-main {
            display: block !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            flex: none !important;
          }

          /* Standardize content padding and disable internal scroll container clashes */
          .trace-dashboard-content,
          .trace-cases-content,
          .trace-create-content,
          .trace-details-content,
          .trace-audit-content,
          .trace-settings-content,
          .trace-profile-content,
          .trace-reports-content {
            padding: 24px !important;
            overflow-y: visible !important;
            height: auto !important;
            min-height: auto !important;
          }
        `
      }} />

      {/* Main Persistent Sidebar Navigation */}
      <Sidebar onLogout={handleLogout} />

      {/* Right Column Layout Wrapper */}
      <div className="trace-app-main">
        {/* Route Aware Header */}
        <Header 
          title={getHeaderTitle()} 
          userName={userName} 
          userEmail={userEmail}
          userRole={userRole || 'Investigator'} 
        />

        {/* Scrollable Page viewport Content */}
        <div className="trace-app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone Authentication Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/verify" element={<PublicRoute><VerificationCenter /></PublicRoute>} />

        {/* Protected Authenticated Routing Layout */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/new" element={<CreateCase />} />
          <Route path="/cases/:id" element={<CaseDetails />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/settings" element={<Navigate to="/profile" replace />} />
          <Route path="/ai-investigation" element={<AIInvestigation />} />
          <Route path="/reports" element={<ReportsCenter />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}