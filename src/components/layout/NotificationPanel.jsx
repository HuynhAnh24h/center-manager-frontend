import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell, X, CheckCheck, Trash2,
  CheckCircle2, AlertCircle, Info, AlertTriangle,
  UserPlus, Pencil, Trash, CreditCard, CalendarPlus,
  BookPlus, UserMinus, FilePlus,
} from 'lucide-react';
import { togglePanel, closePanel, markRead, markAllRead, clearAll, removeNotification } from '../../store/slices/notificationSlice.js';
import { formatDate } from '../../utils/helpers.js';

const TYPE_CONFIG = {
  success: { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', Icon: CheckCircle2 },
  error:   { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', Icon: AlertCircle },
  warning: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', Icon: AlertTriangle },
  info:    { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', Icon: Info },
};

const ICON_MAP = {
  'user-plus':    UserPlus,
  'user-minus':   UserMinus,
  'pencil':       Pencil,
  'trash':        Trash,
  'credit-card':  CreditCard,
  'calendar-plus': CalendarPlus,
  'book-plus':    BookPlus,
  'file-plus':    FilePlus,
  'alert-circle': AlertCircle,
};

function NotificationItem({ item, onRead, onRemove }) {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
  const IconComp = ICON_MAP[item.icon] || cfg.Icon;

  return (
    <div
      onClick={() => onRead(item.id)}
      style={{
        display: 'flex', gap: 12, padding: '12px 16px',
        background: item.read ? 'transparent' : cfg.bg,
        borderLeft: `3px solid ${item.read ? 'transparent' : cfg.color}`,
        cursor: 'pointer', transition: 'background 0.2s',
        position: 'relative',
      }}
      onMouseEnter={e => { if (item.read) e.currentTarget.style.background = 'var(--gray-50)'; }}
      onMouseLeave={e => { if (item.read) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: `${cfg.color}18`, border: `1.5px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconComp size={16} color={cfg.color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</span>
          {!item.read && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{item.message}</p>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
          {formatDate(item.createdAt, 'HH:mm dd/MM')}
        </span>
      </div>

      {/* Remove btn */}
      <button
        onClick={e => { e.stopPropagation(); onRemove(item.id); }}
        style={{
          position: 'absolute', top: 10, right: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: 2, borderRadius: 4,
          opacity: 0, transition: 'opacity 0.15s',
        }}
        className="notif-remove-btn"
      >
        <X size={13} />
      </button>

      <style>{`.notif-remove-btn { opacity: 0 } div:hover > .notif-remove-btn { opacity: 1 }`}</style>
    </div>
  );
}

export default function NotificationPanel() {
  const dispatch = useDispatch();
  const { items, unreadCount, isOpen } = useSelector(s => s.notifications);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        dispatch(closePanel());
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, dispatch]);

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => dispatch(togglePanel())}
        style={{ position: 'relative' }}
        title="Thông báo"
      >
        <Bell size={18} style={{ color: isOpen ? 'var(--gold-600)' : undefined }} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 5, right: 5,
            minWidth: 16, height: 16, borderRadius: 8,
            background: 'var(--error)', border: '2px solid white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 800, color: '#fff',
            lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 64,
          right: 24,
          width: 380,
          maxHeight: 520,
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideDown 0.18s ease-out',
        }}>
          <style>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
            background: 'var(--gray-50)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={16} color="var(--gold-600)" />
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Thông báo</span>
              {unreadCount > 0 && (
                <span style={{
                  background: 'var(--gold-100)', color: 'var(--gold-700)',
                  fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20,
                }}>
                  {unreadCount} mới
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {unreadCount > 0 && (
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 11, padding: '4px 8px', gap: 4 }}
                  onClick={() => dispatch(markAllRead())}
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck size={13} /> Đọc tất cả
                </button>
              )}
              {items.length > 0 && (
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 11, padding: '4px 8px', gap: 4, color: 'var(--error)' }}
                  onClick={() => dispatch(clearAll())}
                  title="Xóa tất cả"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {items.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <Bell size={36} style={{ margin: '0 auto 12px', color: 'var(--gray-300)', display: 'block' }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Chưa có thông báo nào</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {items.map(item => (
                  <NotificationItem
                    key={item.id}
                    item={item}
                    onRead={(id) => dispatch(markRead(id))}
                    onRemove={(id) => dispatch(removeNotification(id))}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div style={{
              padding: '10px 16px', borderTop: '1px solid var(--border)',
              background: 'var(--gray-50)', textAlign: 'center',
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {items.length} thông báo · {unreadCount} chưa đọc
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
