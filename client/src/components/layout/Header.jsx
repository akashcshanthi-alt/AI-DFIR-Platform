import React, { useState, useEffect } from 'react';
import { FiSearch, FiBell, FiChevronDown, FiSun, FiMoon } from 'react-icons/fi';

/**
 * Header Component
 * Persistent top header for TRACE AI DFIR. Displays current route/page title,
 * global search input, alert notifications, and analyst profile badge.
 *
 * @param {Object} props
 * @param {string} [props.title="Dashboard"] - Header title corresponding to active page
 * @param {string} [props.userName="Security Analyst"] - Current analyst username or full name
 * @param {string} [props.userRole="Investigator"] - Current analyst role
 * @param {string} [props.className=""] - Optional custom CSS class name
 */
export default function Header({ 
  title = 'Dashboard', 
  userName = 'Security Analyst', 
  userRole = 'Investigator', 
  className = '' 
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('trace-theme');
    return saved || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('trace-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Dynamically calculate user initials (e.g., "Security Analyst" -> "SA")
  const getUserInitials = (name) => {
    if (!name) return 'SA';
    const trimmed = name.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  };

  const initials = getUserInitials(userName);

  return (
    <header className={`trace-header ${className}`} role="banner">
      {/* Self-contained CSS rules for Header */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 70px;
            background-color: var(--bg-secondary, #0a0f1d);
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            padding: 0 24px;
            box-sizing: border-box;
            width: 100%;
            flex-shrink: 0;
            z-index: 40;
          }

          /* Left Section: Page title and app identifier */
          .trace-header-left {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          .trace-header-title {
            font-size: 1.15rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
          }

          .trace-header-subtitle {
            font-size: 0.6875rem;
            font-weight: 600;
            color: var(--text-muted, #64748b);
            letter-spacing: 0.06em;
            text-transform: uppercase;
            border-left: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            padding-left: 12px;
            height: 14px;
            display: flex;
            align-items: center;
            user-select: none;
            white-space: nowrap;
          }

          /* Center Section: Compact search field */
          .trace-header-center {
            flex: 1;
            max-width: 380px;
            margin: 0 32px;
          }

          .trace-header-search {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
          }

          .trace-header-search-icon {
            position: absolute;
            left: 12px;
            color: var(--text-muted, #64748b);
            font-size: 0.95rem;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-header-search-input {
            width: 100%;
            background-color: var(--bg-main, #060913);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 8px 12px 8px 36px;
            color: var(--text-primary, #f8fafc);
            font-size: 0.875rem;
            outline: none;
            transition: all var(--transition-speed, 200ms) ease;
            height: 36px;
            box-sizing: border-box;
          }

          .trace-header-search-input:focus {
            border-color: var(--color-primary, #3b82f6);
            box-shadow: 0 0 0 1px var(--color-primary-light, rgba(59, 130, 246, 0.15));
          }

          .trace-header-search-input::placeholder {
            color: var(--text-muted, #64748b);
          }

          /* Right Section: Alerts and Profile */
          .trace-header-right {
            display: flex;
            align-items: center;
            gap: 16px;
            flex-shrink: 0;
          }

          .trace-header-notification-btn {
            background: transparent;
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            color: var(--text-secondary, #cbd5e1);
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
            transition: all var(--transition-speed, 200ms) ease;
            padding: 0;
            outline: none;
          }

          .trace-header-notification-btn:hover {
            background-color: rgba(255, 255, 255, 0.02);
            color: var(--text-primary, #f8fafc);
            border-color: var(--border-color-hover, rgba(255, 255, 255, 0.15));
          }

          .trace-header-notification-btn:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: 1px;
          }

          .trace-header-notification-dot {
            position: absolute;
            top: 7px;
            right: 7px;
            width: 6px;
            height: 6px;
            background-color: var(--status-critical, #ef4444);
            border-radius: 50%;
          }

          .trace-header-profile {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: var(--radius-sm, 4px);
            border: 1px solid transparent;
            transition: all var(--transition-speed, 200ms) ease;
            user-select: none;
            outline: none;
            background: transparent;
            text-align: left;
          }

          .trace-header-profile:hover {
            background-color: rgba(255, 255, 255, 0.02);
            border-color: var(--border-color, rgba(255, 255, 255, 0.08));
          }

          .trace-header-profile:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: 1px;
          }

          .trace-header-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: var(--color-primary-light, rgba(59, 130, 246, 0.1));
            border: 1px solid var(--color-primary, #3b82f6);
            color: var(--color-primary, #3b82f6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8125rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            flex-shrink: 0;
          }

          .trace-header-profile-info {
            display: flex;
            flex-direction: column;
          }

          .trace-header-profile-name {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            line-height: 1.25;
          }

          .trace-header-profile-role {
            font-size: 0.6875rem;
            color: var(--text-muted, #64748b);
            font-weight: 500;
            line-height: 1.15;
          }

          .trace-header-chevron {
            color: var(--text-muted, #64748b);
            font-size: 0.8rem;
            margin-left: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Responsive Breakpoints */
          @media (max-width: 768px) {
            .trace-header {
              padding: 0 16px;
            }
            .trace-header-center {
              margin: 0 16px;
            }
            .trace-header-profile-info,
            .trace-header-chevron {
              display: none; /* Hide texts, show avatar only */
            }
          }

          @media (max-width: 576px) {
            .trace-header-center {
              display: none; /* Hide search input completely to fit title and avatar */
            }
            .trace-header-subtitle {
              display: none; /* Hide subtitle to preserve title space */
            }
          }
        `
      }} />

      {/* Left Section: Page Title & App Identity */}
      <div className="trace-header-left">
        <h1 className="trace-header-title">{title}</h1>
        <span className="trace-header-subtitle">TRACE AI DFIR</span>
      </div>

      {/* Center Section: Compact Global Search */}
      <div className="trace-header-center">
        <div className="trace-header-search">
          <span className="trace-header-search-icon" aria-hidden="true">
            <FiSearch />
          </span>
          <input
            type="text"
            className="trace-header-search-input"
            placeholder="Search cases..."
            aria-label="Search cases"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right Section: System Action & Profile Dropdown */}
      <div className="trace-header-right">
        {/* Alerts / Notifications */}
        <button
          type="button"
          className="trace-header-notification-btn"
          aria-label="System notifications"
          title="System notifications"
        >
          <FiBell aria-hidden="true" />
          <span className="trace-header-notification-dot" />
        </button>

        {/* User profile capsule (acts as visual dropdown trigger) */}
        <button 
          type="button" 
          className="trace-header-profile"
          aria-label={`User settings for ${userName} (${userRole})`}
          title="User Profile"
        >
          <div className="trace-header-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="trace-header-profile-info">
            <span className="trace-header-profile-name">{userName}</span>
            <span className="trace-header-profile-role">{userRole}</span>
          </div>
          <span className="trace-header-chevron" aria-hidden="true">
            <FiChevronDown />
          </span>
        </button>
      </div>
    </header>
  );
}
