import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  FiGrid,
  FiFolder,
  FiCpu,
  FiFileText,
  FiLayers,
  FiSettings,
  FiLogOut,
  FiShield,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

// Main Navigation Items with corresponding paths and icons
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: FiGrid },
  { id: 'cases', label: 'Cases', path: '/cases', icon: FiFolder },
  { id: 'ai-investigation', label: 'AI Investigation', path: '/ai-investigation', icon: FiCpu },
  { id: 'reports', label: 'Reports', path: '/reports', icon: FiFileText },
  { id: 'audit-logs', label: 'Audit Logs', path: '/audit-logs', icon: FiLayers },
  { id: 'settings', label: 'Settings', path: '/settings', icon: FiSettings },
];

/**
 * Sidebar Component
 * Provides the main persistent vertical navigation for the TRACE AI DFIR platform.
 * Supports collapse/expand state, active route indicators, and mobile responsive setups.
 *
 * @param {Object} props
 * @param {Function} [props.onLogout] - Optional logout click callback handler
 */
export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Active route matching algorithm
  const isItemActive = (itemPath) => {
    const currentPath = location.pathname;
    if (itemPath === '/cases') {
      // Keep "Cases" active for child routes like /cases/new, /cases/123
      return currentPath.startsWith('/cases');
    }
    return currentPath === itemPath;
  };

  const handleLogoutClick = (e) => {
    if (onLogout) {
      e.preventDefault();
      onLogout();
    }
  };

  return (
    <aside 
      className={`trace-sidebar ${isCollapsed ? 'trace-sidebar--collapsed' : ''}`}
      style={{ width: isCollapsed ? '68px' : '260px' }}
      aria-label="Sidebar Navigation"
    >
      {/* Self-contained CSS styles for the sidebar */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-sidebar {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background-color: var(--bg-sidebar, #04070e);
            border-right: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            transition: width var(--transition-speed, 200ms) ease;
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
            flex-shrink: 0;
            z-index: 50;
          }

          /* Header / Branding Area */
          .trace-sidebar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            height: 70px;
            overflow: hidden;
            box-sizing: border-box;
            position: relative;
          }

          .trace-sidebar-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--text-primary, #f8fafc);
            text-decoration: none;
            user-select: none;
            min-width: 0;
          }

          .trace-sidebar-brand-icon {
            font-size: 1.3rem;
            color: var(--color-primary, #3b82f6);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .trace-sidebar-brand-text {
            display: flex;
            flex-direction: column;
            transition: opacity var(--transition-speed, 200ms) ease;
            white-space: nowrap;
            overflow: hidden;
          }

          .trace-sidebar-brand-name {
            font-size: 1.05rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            margin: 0;
            line-height: 1.1;
          }

          .trace-sidebar-brand-subtitle {
            font-size: 0.625rem;
            font-weight: 600;
            color: var(--color-secondary, #06b6d4);
            letter-spacing: 0.08em;
            margin: 0;
            margin-top: 1px;
          }

          /* Collapse / Expand Toggle Button */
          .trace-sidebar-toggle {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            color: var(--text-secondary, #cbd5e1);
            border-radius: var(--radius-sm, 4px);
            width: 26px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all var(--transition-speed, 200ms) ease;
            outline: none;
            padding: 0;
          }

          .trace-sidebar-toggle:hover {
            background: var(--bg-surface-elevated, #162035);
            color: var(--text-primary, #f8fafc);
            border-color: var(--border-color-hover, rgba(255, 255, 255, 0.15));
          }

          .trace-sidebar-toggle:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: 1px;
          }

          /* Navigation Area */
          .trace-sidebar-nav-container {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 16px 8px;
            flex-grow: 1;
            overflow-y: auto;
            overflow-x: hidden;
          }

          /* Custom navigation scrollbar */
          .trace-sidebar-nav-container::-webkit-scrollbar {
            width: 4px;
          }
          .trace-sidebar-nav-container::-webkit-scrollbar-track {
            background: transparent;
          }
          .trace-sidebar-nav-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.05);
            border-radius: var(--radius-full, 9999px);
          }

          .trace-sidebar-nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            color: var(--text-secondary, #cbd5e1);
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: var(--radius-sm, 4px);
            transition: all var(--transition-speed, 200ms) ease;
            position: relative;
            border: 1px solid transparent;
            background: transparent;
            cursor: pointer;
            text-align: left;
            outline: none;
            height: 40px;
            box-sizing: border-box;
          }

          .trace-sidebar-nav-item:hover {
            background-color: rgba(255, 255, 255, 0.03);
            color: var(--text-primary, #f8fafc);
          }

          .trace-sidebar-nav-item:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: -2px;
          }

          .trace-sidebar-nav-item-icon {
            font-size: 1.15rem;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: color var(--transition-speed, 200ms) ease;
          }

          .trace-sidebar-nav-item-label {
            white-space: nowrap;
            transition: opacity var(--transition-speed, 200ms) ease;
          }

          /* Active Menu Item States */
          .trace-sidebar-nav-item.active {
            background-color: var(--color-primary-light, rgba(59, 130, 246, 0.1));
            border-color: rgba(59, 130, 246, 0.15);
            color: var(--text-primary, #f8fafc);
            font-weight: 600;
          }

          .trace-sidebar-nav-item.active .trace-sidebar-nav-item-icon {
            color: var(--color-primary, #3b82f6);
          }

          .trace-sidebar-nav-item.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 8px;
            bottom: 8px;
            width: 3px;
            background-color: var(--color-primary, #3b82f6);
            border-radius: 0 var(--radius-sm, 4px) var(--radius-sm, 4px) 0;
          }

          /* Footer / Logout Area */
          .trace-sidebar-footer {
            padding: 12px 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.03);
            display: flex;
            flex-direction: column;
            gap: 4px;
            box-sizing: border-box;
          }

          .trace-sidebar-logout-btn {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            color: var(--text-muted, #64748b);
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: var(--radius-sm, 4px);
            transition: all var(--transition-speed, 200ms) ease;
            border: 1px solid transparent;
            background: transparent;
            cursor: pointer;
            text-align: left;
            outline: none;
            width: 100%;
            box-sizing: border-box;
            height: 40px;
          }

          .trace-sidebar-logout-btn:hover {
            background-color: rgba(239, 68, 68, 0.06);
            color: var(--status-critical, #ef4444);
          }

          .trace-sidebar-logout-btn:focus-visible {
            outline: 2px solid var(--status-critical, #ef4444);
            outline-offset: -2px;
          }

          .trace-sidebar-logout-icon {
            font-size: 1.15rem;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          /* Collapsed Mode State Adjustments */
          .trace-sidebar--collapsed .trace-sidebar-brand-text,
          .trace-sidebar--collapsed .trace-sidebar-nav-item-label {
            opacity: 0;
            pointer-events: none;
            display: none;
          }

          .trace-sidebar--collapsed .trace-sidebar-header {
            justify-content: center;
            padding: 16px 0;
          }

          .trace-sidebar--collapsed .trace-sidebar-toggle {
            position: absolute;
            right: 21px; /* Center-aligned inside the header when collapsed */
            top: 22px;
          }

          .trace-sidebar--collapsed .trace-sidebar-nav-item,
          .trace-sidebar--collapsed .trace-sidebar-logout-btn {
            justify-content: center;
            padding: 10px 0;
          }

          .trace-sidebar--collapsed .trace-sidebar-nav-item::before {
            display: none; /* Hide indicator line to keep design balanced */
          }

          /* Responsive Overlay Support (for later phone drawer setup) */
          @media (max-width: 768px) {
            .trace-sidebar {
              position: fixed;
              left: 0;
              top: 0;
              bottom: 0;
            }
          }
        `
      }} />

      {/* Brand Header */}
      <div className="trace-sidebar-header">
        <Link to="/dashboard" className="trace-sidebar-brand" title="TRACE AI DFIR">
          <div className="trace-sidebar-brand-icon">
            <FiShield />
          </div>
          <div className="trace-sidebar-brand-text">
            <span className="trace-sidebar-brand-name">TRACE AI</span>
            <span className="trace-sidebar-brand-subtitle">DFIR PLATFORM</span>
          </div>
        </Link>
        
        {!isCollapsed && (
          <button
            type="button"
            className="trace-sidebar-toggle"
            onClick={() => setIsCollapsed(true)}
            aria-label="Collapse sidebar"
            title="Collapse Sidebar"
          >
            <FiChevronLeft />
          </button>
        )}
        
        {isCollapsed && (
          <button
            type="button"
            className="trace-sidebar-toggle"
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand sidebar"
            title="Expand Sidebar"
          >
            <FiChevronRight />
          </button>
        )}
      </div>

      {/* Main Navigation List */}
      <nav className="trace-sidebar-nav-container" aria-label="Main Navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.path);
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`trace-sidebar-nav-item ${active ? 'active' : ''}`}
              title={isCollapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <span className="trace-sidebar-nav-item-icon">
                <Icon />
              </span>
              <span className="trace-sidebar-nav-item-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Navigation Section */}
      <div className="trace-sidebar-footer">
        <Link
          to="/login"
          onClick={handleLogoutClick}
          className="trace-sidebar-logout-btn"
          title={isCollapsed ? 'Logout' : undefined}
          aria-label="Logout"
        >
          <span className="trace-sidebar-logout-icon">
            <FiLogOut />
          </span>
          <span className="trace-sidebar-nav-item-label">Logout</span>
        </Link>
      </div>
    </aside>
  );
}
