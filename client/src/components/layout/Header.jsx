import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiBell, FiChevronDown, FiSun, FiMoon, FiCheck, FiTrash2, FiAlertCircle, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { notificationService } from '../../services/notification.service';
import { socketService } from '../../services/socket';

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
  const navigate = useNavigate();
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

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await notificationService.getNotifications({ limit: 20, sortBy: 'createdAt', sortOrder: 'desc' });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('[Header] Failed to load notifications:', err);
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchNotifications();
    }
  }, []);

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketService.connect();

    socketService.subscribeToNotifications((newNotif) => {
      setNotifications(prev => {
        const exists = prev.some(n => n._id === newNotif._id || n.notificationId === newNotif.notificationId);
        if (exists) return prev;
        return [newNotif, ...prev].slice(0, 20);
      });
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socketService.unsubscribeFromNotifications();
    };
  }, []);

  const handleMarkRead = async (e, id) => {
    e.stopPropagation();
    try {
      const data = await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id || n.notificationId === id) ? { ...n, isRead: true } : n)
      );
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('[Header] Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const data = await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[Header] Failed to mark all read:', err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      const data = await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id && n.notificationId !== id));
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('[Header] Failed to delete notification:', err);
    }
  };

  const handleItemClick = async (notification) => {
    const id = notification._id || notification.notificationId;
    if (!notification.isRead) {
      try {
        const data = await notificationService.markAsRead(id);
        setNotifications(prev =>
          prev.map(n => (n._id === id || n.notificationId === id) ? { ...n, isRead: true } : n)
        );
        setUnreadCount(data.unreadCount);
      } catch (err) {
        console.error('[Header] Failed to mark read on click:', err);
      }
    }
    setShowNotifications(false);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const displayedNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    return true;
  });

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
            max-width: 520px;
            margin: 0 48px;
            display: flex;
            align-items: center;
          }

          .trace-header-search {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
          }

          .trace-header-search-icon {
            position: absolute;
            left: 16px;
            top: 50% !important;
            transform: translateY(-50%) !important;
            color: #94A3B8 !important;
            font-size: 1.1rem;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
          }

          .trace-header-search input.trace-header-search-input {
            width: 100%;
            height: 48px !important;
            background-color: #0B1220 !important;
            border: 1px solid rgba(34, 211, 238, 0.35) !important;
            border-radius: 12px !important;
            padding: 0 16px 0 48px !important;
            color: #FFFFFF !important;
            font-size: 0.875rem !important;
            outline: none !important;
            transition: all 0.25s ease !important;
            box-sizing: border-box !important;
            display: flex !important;
            align-items: center !important;
            line-height: normal !important;
          }

          .trace-header-search input.trace-header-search-input:focus {
            border-color: #22D3EE !important;
            box-shadow: 0 0 15px rgba(34, 211, 238, 0.4) !important;
          }

          .trace-header-search input.trace-header-search-input::placeholder {
            color: #94A3B8 !important;
            opacity: 1 !important;
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

          .trace-header-notification-container {
            position: relative;
            display: flex;
            align-items: center;
          }

          .trace-header-notification-count-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background-color: #ef4444;
            color: white;
            font-size: 9px;
            font-weight: 700;
            border-radius: 50%;
            min-width: 14px;
            height: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 3px;
            box-shadow: 0 0 5px rgba(239, 68, 68, 0.6);
            line-height: 1;
          }

          .trace-notification-dropdown {
            position: absolute;
            top: 48px;
            right: 0;
            width: 360px;
            background-color: #0b1220;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
            z-index: 100;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .trace-notification-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }

          .trace-notification-header h3 {
            font-size: 14px;
            font-weight: 600;
            color: #f8fafc;
            margin: 0;
          }

          .trace-notification-mark-all-btn {
            background: transparent;
            border: none;
            color: #22d3ee;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 4px;
            transition: background-color 0.2s;
            outline: none;
          }

          .trace-notification-mark-all-btn:hover {
            background-color: rgba(34, 211, 238, 0.08);
          }

          .trace-notification-tabs {
            display: flex;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            background-color: rgba(255,255,255,0.01);
          }

          .trace-notification-tab {
            flex: 1;
            text-align: center;
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            color: #94a3b8;
            font-size: 12px;
            font-weight: 600;
            padding: 10px 0;
            cursor: pointer;
            transition: all 0.2s;
            outline: none;
          }

          .trace-notification-tab.active {
            color: #22d3ee;
            border-bottom-color: #22d3ee;
            background-color: rgba(255,255,255,0.02);
          }

          .trace-notification-list {
            max-height: 320px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
          }

          .trace-notification-item {
            display: flex;
            gap: 12px;
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            transition: background-color 0.2s;
            position: relative;
            cursor: pointer;
          }

          .trace-notification-item:hover {
            background-color: rgba(255, 255, 255, 0.02);
          }

          .trace-notification-item.unread {
            background-color: rgba(34, 211, 238, 0.02);
          }

          .trace-notification-item.unread::before {
            content: "";
            position: absolute;
            left: 6px;
            top: 50%;
            transform: translateY(-50%);
            width: 6px;
            height: 6px;
            background-color: #22d3ee;
            border-radius: 50%;
          }

          .trace-notification-item-content {
            flex: 1;
            min-width: 0;
            text-align: left;
          }

          .trace-notification-item-title {
            font-size: 13px;
            font-weight: 600;
            color: #f8fafc;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 6px;
            line-height: 1.3;
          }

          .trace-notification-item-message {
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.4;
            word-break: break-word;
          }

          .trace-notification-item-time {
            font-size: 10px;
            color: #64748b;
            margin-top: 6px;
            display: block;
          }

          .trace-notification-badge {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 1px 5px;
            border-radius: 4px;
            line-height: 1;
          }

          .trace-notification-badge.critical {
            background-color: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
          }

          .trace-notification-badge.warning {
            background-color: rgba(245, 158, 11, 0.15);
            border: 1px solid rgba(245, 158, 11, 0.3);
            color: #f59e0b;
          }

          .trace-notification-badge.success {
            background-color: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #10b981;
          }

          .trace-notification-badge.info {
            background-color: rgba(59, 130, 246, 0.15);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: #3b82f6;
          }

          .trace-notification-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            justify-content: flex-start;
            align-items: center;
            opacity: 0.7;
            transition: opacity 0.2s;
          }

          .trace-notification-item:hover .trace-notification-actions {
            opacity: 1;
          }

          .trace-notification-action-btn {
            background: transparent;
            border: none;
            color: #64748b;
            font-size: 13px;
            cursor: pointer;
            padding: 4px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            outline: none;
          }

          .trace-notification-action-btn:hover {
            color: #f8fafc;
            background-color: rgba(255,255,255,0.05);
          }

          .trace-notification-action-btn.delete-btn:hover {
            color: #ef4444;
            background-color: rgba(239, 68, 68, 0.1);
          }

          .trace-notification-empty, .trace-notification-loading, .trace-notification-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 36px 16px;
            text-align: center;
            color: #94a3b8;
            font-size: 13px;
          }

          .trace-notification-empty-icon {
            font-size: 28px;
            color: #38bdf8;
            margin-bottom: 8px;
          }

          .trace-notification-spinner {
            width: 24px;
            height: 24px;
            border: 2px solid rgba(34, 211, 238, 0.2);
            border-top-color: #22d3ee;
            border-radius: 50%;
            animation: spin-clockwise 1s infinite linear;
            margin-bottom: 8px;
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate(`/cases?q=${encodeURIComponent(searchQuery)}`);
              }
            }}
          />
        </div>
      </div>

      {/* Right Section: System Action & Profile Dropdown */}
      <div className="trace-header-right">
        {/* Alerts / Notifications */}
        <div className="trace-header-notification-container" ref={dropdownRef}>
          <button
            type="button"
            className="trace-header-notification-btn"
            onClick={() => setShowNotifications(prev => !prev)}
            aria-label="System notifications"
            title="System notifications"
          >
            <FiBell aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="trace-header-notification-count-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="trace-notification-dropdown">
              <div className="trace-notification-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    type="button" 
                    className="trace-notification-mark-all-btn"
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="trace-notification-tabs">
                <button
                  type="button"
                  className={`trace-notification-tab ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`trace-notification-tab ${activeTab === 'unread' ? 'active' : ''}`}
                  onClick={() => setActiveTab('unread')}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              <div className="trace-notification-list">
                {isLoading && notifications.length === 0 ? (
                  <div className="trace-notification-loading">
                    <div className="trace-notification-spinner"></div>
                    <span>Synchronizing clearance feeds...</span>
                  </div>
                ) : error ? (
                  <div className="trace-notification-error">
                    <FiAlertCircle className="trace-notification-empty-icon" style={{ color: '#ef4444' }} />
                    <span>{error}</span>
                  </div>
                ) : displayedNotifications.length === 0 ? (
                  <div className="trace-notification-empty">
                    <FiCheckCircle className="trace-notification-empty-icon" />
                    <span>All clear. No notifications.</span>
                  </div>
                ) : (
                  displayedNotifications.map((notif) => {
                    const id = notif._id || notif.notificationId;
                    return (
                      <div 
                        key={id} 
                        className={`trace-notification-item ${!notif.isRead ? 'unread' : ''}`}
                        onClick={() => handleItemClick(notif)}
                      >
                        <div className="trace-notification-item-content">
                          <div className="trace-notification-item-title">
                            {notif.type && (
                              <span className={`trace-notification-badge ${notif.type.toLowerCase()}`}>
                                {notif.type}
                              </span>
                            )}
                            {notif.title}
                          </div>
                          <div className="trace-notification-item-message">
                            {notif.message}
                          </div>
                          <span className="trace-notification-item-time">
                            {formatTime(notif.createdAt)}
                          </span>
                        </div>

                        <div className="trace-notification-actions">
                          {!notif.isRead && (
                            <button
                              type="button"
                              className="trace-notification-action-btn"
                              onClick={(e) => handleMarkRead(e, id)}
                              title="Mark as read"
                            >
                              <FiCheck />
                            </button>
                          )}
                          <button
                            type="button"
                            className="trace-notification-action-btn delete-btn"
                            onClick={(e) => handleDelete(e, id)}
                            title="Delete notification"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile capsule (acts as visual dropdown trigger) */}
        <button 
          type="button" 
          className="trace-header-profile"
          onClick={() => navigate('/profile')}
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
