import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

export const formatDate = (date, fmt = 'dd/MM/yyyy') => {
  if (!date) return '—';
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, fmt, { locale: vi });
  } catch {
    return '—';
  }
};

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const SHIFT_LABEL = {
  morning: 'Buổi sáng',
  afternoon: 'Buổi chiều',
  evening: 'Buổi tối',
};

export const DAY_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export const STATUS_STUDENT = {
  active: { label: 'Đang học', cls: 'badge-success' },
  inactive: { label: 'Ngừng học', cls: 'badge-gray' },
  graduated: { label: 'Tốt nghiệp', cls: 'badge-gold' },
  suspended: { label: 'Tạm dừng', cls: 'badge-warning' },
};

export const STATUS_CLASS = {
  upcoming: { label: 'Sắp khai giảng', cls: 'badge-info' },
  ongoing: { label: 'Đang học', cls: 'badge-success' },
  completed: { label: 'Đã kết thúc', cls: 'badge-gray' },
  cancelled: { label: 'Đã hủy', cls: 'badge-error' },
};

export const STATUS_TUITION = {
  pending: { label: 'Chưa đóng', cls: 'badge-warning' },
  paid: { label: 'Đã đóng', cls: 'badge-success' },
  overdue: { label: 'Quá hạn', cls: 'badge-error' },
  partial: { label: 'Đóng 1 phần', cls: 'badge-info' },
  waived: { label: 'Miễn học phí', cls: 'badge-gold' },
};

export const STATUS_ATTENDANCE = {
  present: { label: 'Có mặt', cls: 'badge-success' },
  absent: { label: 'Vắng', cls: 'badge-error' },
  late: { label: 'Muộn', cls: 'badge-warning' },
  excused: { label: 'Có phép', cls: 'badge-info' },
};

export const LEVEL_LABEL = {
  beginner: 'Cơ bản',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
};

export const ROLE_LABEL = {
  admin: 'Quản trị viên',
  teacher: 'Giáo viên',
  staff: 'Nhân viên',
};

export const getInitials = (name = '') =>
  name.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase();

export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
