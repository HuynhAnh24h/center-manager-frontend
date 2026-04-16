import React from 'react';
import useAuthStore from '../../store/authStore.js';
import { formatDate } from '../../utils/helpers.js';
import NotificationPanel from './NotificationPanel.jsx';

export default function Topbar({ title, subtitle }) {
  const { user } = useAuthStore();

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
      </div>
      <div className="topbar-spacer" />
      <div style={{
        fontSize: 12, color: 'var(--text-secondary)',
        background: 'var(--gold-50)', border: '1px solid var(--gold-200)',
        padding: '4px 12px', borderRadius: 20,
      }}>
        {formatDate(new Date(), 'EEEE, dd/MM/yyyy')}
      </div>
      <NotificationPanel />
    </header>
  );
}
