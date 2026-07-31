import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

// Import pages
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Cases from './pages/Cases/Cases';
import CreateCase from './pages/Cases/CreateCase';
import CaseDetails from './pages/Cases/CaseDetails';
import AuditLogs from './pages/AuditLogs/AuditLogs';
import Settings from './pages/Settings/Settings';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import AIInvestigation from './pages/AIInvestigation/AIInvestigation';

// Import layout components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Local development auth guard — checks if user is authenticated in localStorage
const isAuthenticated = () => localStorage.getItem('isAuthenticated') === 'true';

/**
 * ProtectedRoute Wrapper
 * Re-routes unauthenticated users to the operator login portal.
 */
function ProtectedRoute({ children }) {
  // Prototype development guard — replace with real authentication later.
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

/**
 * PublicRoute Wrapper
 * Restricts authenticated analysts from returning to login/register screens,
 * re-routing them to the SOC dashboard telemetry.
 */
function PublicRoute({ children }) {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
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

  // Terminate developer session and redirect to Login
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login', { replace: true });
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
    if (path === '/settings') return 'Settings';
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
          .trace-settings-layout {
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
          .trace-settings-main {
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
          .trace-settings-content {
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
          userName="Security Analyst" 
          userRole="Investigator" 
        />

        {/* Scrollable Page viewport Content */}
        <div className="trace-app-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/new" element={<CreateCase />} />
            <Route path="/cases/:id" element={<CaseDetails />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/settings" element={<Settings />} />
            
            <Route path="/ai-investigation" element={<AIInvestigation />} />
            <Route path="/reports" element={<Navigate to="/cases/TRC-2026-0042" replace />} />
            
            {/* Fallback handler for unknown authenticated paths */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
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

        {/* Protected Authenticated Routing Layout */}
        <Route path="/*" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}