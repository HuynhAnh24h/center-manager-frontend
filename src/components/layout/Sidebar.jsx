import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, CalendarDays,
  ClipboardCheck, CreditCard, LogOut, GraduationCap,
} from 'lucide-react';
import useAuthStore from '../../store/authStore.js';
import { getInitials, ROLE_LABEL } from '../../utils/helpers.js';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Tổng quan', section: 'main' },
  { to: '/students', icon: Users, label: 'Học viên', section: 'main' },
  { to: '/courses', icon: BookOpen, label: 'Khóa học', section: 'main' },
  { to: '/classes', icon: CalendarDays, label: 'Lớp học', section: 'main' },
  { to: '/attendance', icon: ClipboardCheck, label: 'Điểm danh', section: 'academic' },
  { to: '/tuition', icon: CreditCard, label: 'Học phí', section: 'academic' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const mainItems = NAV_ITEMS.filter((i) => i.section === 'main');
  const academicItems = NAV_ITEMS.filter((i) => i.section === 'academic');

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <GraduationCap size={22} color="#18181b" />
        </div>
        <h1>EduCenter</h1>
        <p>Hệ thống quản lý đào tạo</p>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Quản lý</div>
        {mainItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="nav-icon" />
            {label}
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: 8 }}>Học vụ</div>
        {academicItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="nav-icon" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{getInitials(user?.name || 'U')}</div>
          <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
            <h4 className="truncate">{user?.name || 'Admin'}</h4>
            <p>{ROLE_LABEL[user?.role] || user?.role}</p>
          </div>
        </div>
        <button
          className="nav-item"
          onClick={handleLogout}
          style={{ marginTop: 8, color: '#f87171' }}
        >
          <LogOut className="nav-icon" size={16} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
