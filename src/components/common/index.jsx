import React from 'react';
import { X, ChevronLeft, ChevronRight, Search, AlertCircle } from 'lucide-react';

// ─── Badge ────────────────────────────────────────────────
export const Badge = ({ label, cls }) => (
  <span className={`badge ${cls}`}>{label}</span>
);

// ─── Modal ────────────────────────────────────────────────
export const Modal = ({ title, onClose, children, footer, size = 'md' }) => {
  const maxW = { sm: '420px', md: '560px', lg: '720px', xl: '900px' }[size];
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: maxW }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// ─── Pagination ───────────────────────────────────────────
export const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-between" style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
      <span className="text-sm text-muted">Trang {page} / {totalPages}</span>
      <div className="pagination">
        <button className="page-btn" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          <ChevronLeft size={14} />
        </button>
        {pages.map((p) => (
          <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPageChange(p)}>
            {p}
          </button>
        ))}
        <button className="page-btn" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// ─── SearchInput ──────────────────────────────────────────
export const SearchInput = ({ value, onChange, placeholder = 'Tìm kiếm...' }) => (
  <div className="search-bar" style={{ width: 260 }}>
    <Search size={15} className="search-icon" />
    <input
      className="form-control"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

// ─── EmptyState ───────────────────────────────────────────
export const EmptyState = ({ message = 'Không có dữ liệu' }) => (
  <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
    <AlertCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
    <p style={{ fontSize: 14 }}>{message}</p>
  </div>
);

// ─── LoadingRow ───────────────────────────────────────────
export const LoadingRows = ({ cols = 5, rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j}>
            <div className="skeleton" style={{ height: 16, width: '80%', borderRadius: 4 }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// ─── ConfirmModal ─────────────────────────────────────────
export const ConfirmModal = ({ title, message, onConfirm, onCancel, danger = false }) => (
  <Modal
    title={title}
    onClose={onCancel}
    footer={
      <>
        <button className="btn btn-outline" onClick={onCancel}>Hủy</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
          Xác nhận
        </button>
      </>
    }
  >
    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{message}</p>
  </Modal>
);

// ─── PageHeader ───────────────────────────────────────────
export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h2>
      {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-2">{actions}</div>}
  </div>
);

// ─── FormRow ──────────────────────────────────────────────
export const FormRow = ({ children, cols = 2 }) => (
  <div className={`grid grid-${cols}`} style={{ gap: 14 }}>{children}</div>
);

// ─── StatCard ─────────────────────────────────────────────
export const StatCard = ({ icon, value, label, trend, trendUp, color = 'var(--gold-100)' }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: color }}>{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {trend && (
      <div className={`stat-trend ${trendUp ? 'up' : 'down'}`}>
        {trendUp ? '↑' : '↓'} {trend}
      </div>
    )}
  </div>
);
