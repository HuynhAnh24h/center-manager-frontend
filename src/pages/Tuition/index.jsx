import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, CreditCard, CheckCircle2, AlertCircle, Clock,
  Download, FileSpreadsheet, ChevronDown, Search, X,
  SlidersHorizontal, Banknote, CalendarDays, BookOpen, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../../components/layout/Topbar.jsx';
import {
  Badge, Modal, Pagination, EmptyState, LoadingRows, PageHeader, FormRow,
} from '../../components/common/index.jsx';
import { tuitionService, studentService, classService, courseService } from '../../services/index.js';
import { formatDate, formatCurrency, STATUS_TUITION, debounce } from '../../utils/helpers.js';

const PAYMENT_METHODS = {
  cash: 'Tiền mặt', bank_transfer: 'Chuyển khoản',
  momo: 'MoMo', vnpay: 'VNPay', other: 'Khác',
};
const PM_ICON = { cash: '💵', bank_transfer: '🏦', momo: '📱', vnpay: '💳', other: '🔖' };

// ── CSV export ───────────────────────────────────────────────
const exportCSV = (rows, filename) => {
  const headers = Object.keys(rows[0] || {});
  const csv = [
    '\uFEFF' + headers.join(','),
    ...rows.map(r => headers.map(h => {
      const v = String(r[h] ?? '').replace(/"/g, '""');
      return v.includes(',') || v.includes('\n') || v.includes('"') ? `"${v}"` : v;
    }).join(',')),
  ].join('\r\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })),
    download: `${filename}.csv`,
  });
  a.click(); URL.revokeObjectURL(a.href);
};

const fetchAll = async (params) => {
  let all = [], page = 1, totalPages = 1;
  do {
    const { data } = await tuitionService.getAll({ ...params, page, limit: 200 });
    all = [...all, ...data.data]; totalPages = data.totalPages; page++;
  } while (page <= totalPages);
  return all;
};

const toRow = (t) => ({
  'Mã phiếu': t.receiptCode || '',
  'Trạng thái': STATUS_TUITION[t.status]?.label || t.status,
  'Mã HV': t.student?.studentCode || '',
  'Học viên': t.student?.fullName || '',
  'SĐT': t.student?.phone || '',
  'Lớp học': t.class?.className || '',
  'Mã lớp': t.class?.classCode || '',
  'Khóa học': t.course?.courseName || '',
  'Học phí gốc': t.amount || 0,
  'Giảm giá': t.discount || 0,
  'Thực thu': t.finalAmount || 0,
  'Hạn đóng': t.dueDate ? formatDate(t.dueDate) : '',
  'Ngày đóng': t.paidDate ? formatDate(t.paidDate) : '',
  'Hình thức TT': PAYMENT_METHODS[t.paymentMethod] || '',
  'Ghi chú': t.notes || '',
});

// ── Export dropdown ──────────────────────────────────────────
function ExportMenu({ getFilters }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const doExport = async (extraParams, filename) => {
    setOpen(false); setBusy(true);
    toast('Đang tải dữ liệu...', { icon: '⏳' });
    try {
      const rows = (await fetchAll({ ...getFilters(), ...extraParams })).map(toRow);
      if (!rows.length) { toast.error('Không có dữ liệu để xuất'); return; }
      exportCSV(rows, filename);
      toast.success(`Xuất ${rows.length} bản ghi thành công!`);
    } catch { toast.error('Xuất file thất bại'); }
    finally { setBusy(false); }
  };

  const items = [
    { label: '✅ Đã đóng học phí',             params: { status: 'paid' },    file: 'HocPhi_DaDong' },
    { label: '⏳ Chưa đóng học phí',           params: { status: 'pending' }, file: 'HocPhi_ChuaDong' },
    { label: '❌ Học phí quá hạn',             params: { status: 'overdue' }, file: 'HocPhi_QuaHan' },
    { label: '🔶 Đóng 1 phần',                 params: { status: 'partial' }, file: 'HocPhi_DongMotPhan' },
    null,
    { label: '🔍 Xuất theo bộ lọc hiện tại',  params: {},                    file: 'HocPhi_LocHienTai' },
    { label: '📦 Xuất tất cả',                 params: { status: undefined }, file: 'HocPhi_TatCa' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-outline" style={{ gap: 6 }} onClick={() => setOpen(o => !o)} disabled={busy}>
        <FileSpreadsheet size={15} color="#10b981" />
        {busy ? 'Đang xuất...' : 'Xuất Excel'}
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100, background: '#fff', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', minWidth: 250, padding: '6px 0' }}>
            <div style={{ padding: '8px 14px 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Xuất báo cáo học phí</div>
            {items.map((item, i) => !item
              ? <div key={i} style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              : (
                <button key={i} onClick={() => doExport(item.params, item.file)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', background: 'none', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <Download size={13} color="var(--text-muted)" />
                </button>
              )
            )}
            <div style={{ padding: '6px 14px 8px', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', marginTop: 4 }}>Định dạng .csv, mở được bằng Excel</div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Filter chip ──────────────────────────────────────────────
function Chip({ label, onRemove }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--gold-100)', color: 'var(--gold-800)', borderRadius: 20, padding: '3px 10px 3px 12px', fontSize: 12, fontWeight: 600 }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold-600)', display: 'flex', padding: 0, marginLeft: 2 }}>
        <X size={12} />
      </button>
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
export default function TuitionPage() {
  // ── Data ────────────────────────────────────────────────────
  const [tuitions,   setTuitions]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [stats,      setStats]      = useState({ stats: [], monthlyRevenue: 0 });

  // ── Filters ──────────────────────────────────────────────────
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter,  setClassFilter]  = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [monthFilter,  setMonthFilter]  = useState('');
  const [yearFilter,   setYearFilter]   = useState('');
  const [pmFilter,     setPmFilter]     = useState('');
  const [showFilters,  setShowFilters]  = useState(false);

  // ── Reference lists ──────────────────────────────────────────
  const [classes,  setClasses]  = useState([]);
  const [courses,  setCourses]  = useState([]);
  const [students, setStudents] = useState([]);

  // ── Modal ────────────────────────────────────────────────────
  const [modal,   setModal]   = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({ student: '', class: '', course: '', amount: '', discount: 0, dueDate: '', notes: '' });
  const [payForm, setPayForm] = useState({ status: 'paid', paymentMethod: 'cash', paidDate: new Date().toISOString().slice(0, 10), notes: '' });

  // ── Build params object ──────────────────────────────────────
  const getFilters = useCallback(() => {
    const p = {};
    if (search)       p.search        = search;
    if (statusFilter) p.status        = statusFilter;
    if (classFilter)  p.classId       = classFilter;
    if (courseFilter) p.courseId      = courseFilter;
    if (pmFilter)     p.paymentMethod = pmFilter;
    if (monthFilter)  p.month         = monthFilter;
    if (yearFilter)   p.year          = yearFilter;
    return p;
  }, [search, statusFilter, classFilter, courseFilter, pmFilter, monthFilter, yearFilter]);

  // ── Core fetch ───────────────────────────────────────────────
const doFetch = useCallback(async (p = 1, extraParams = {}) => {
  setLoading(true);

  try {
    const res = await tuitionService.getAll({
      page: p,
      limit: 15,
      ...extraParams
    });

    console.log("API raw:", res);

    const payload = res?.data || {};

    const list = payload.data || [];

    setTuitions(Array.isArray(list) ? list : []);
    setTotal(payload.total || 0);
    setTotalPages(payload.totalPages || 1);

  } catch (err) {
    console.error("Fetch tuition error:", err);
    setTuitions([]);
    toast.error('Lỗi tải học phí');
  } finally {
    setLoading(false);
  }
}, []);
  const refreshStats = useCallback(() => {
    tuitionService.getStats().then(({ data }) => setStats(data.data)).catch(() => {});
  }, []);

  // ── Initial load ─────────────────────────────────────────────
useEffect(() => {
  doFetch(1);
  refreshStats();

  studentService.getAll({ limit: 500 })
    .then(res => setStudents(res?.data?.data || res?.data || []))
    .catch(() => {});

  classService.getAll({ limit: 200 })
    .then(res => setClasses(res?.data?.data || res?.data || []))
    .catch(() => {});

  courseService.getAll({ limit: 200 })
    .then(res => setCourses(res?.data?.data || res?.data || []))
    .catch(() => {});
}, []);

  // ── Re-fetch when filters change (not on mount) ──────────────
  const isMount = React.useRef(true);
  useEffect(() => {
    if (isMount.current) { isMount.current = false; return; }
    setPage(1);
    doFetch(1, getFilters());
  }, [statusFilter, classFilter, courseFilter, monthFilter, yearFilter, pmFilter]);

  // ── Page change ──────────────────────────────────────────────
  const handlePageChange = (p) => {
    setPage(p);
    doFetch(p, getFilters());
  };

  // ── Debounced search ─────────────────────────────────────────
  const debouncedFetch = useCallback(
    debounce((q) => {
      setPage(1);
      const f = {};
      if (q)           f.search        = q;
      if (statusFilter) f.status       = statusFilter;
      if (classFilter)  f.classId      = classFilter;
      if (courseFilter) f.courseId     = courseFilter;
      if (pmFilter)     f.paymentMethod= pmFilter;
      if (monthFilter)  f.month        = monthFilter;
      if (yearFilter)   f.year         = yearFilter;
      doFetch(1, f);
    }, 400), [statusFilter, classFilter, courseFilter, pmFilter, monthFilter, yearFilter]
  );

  const handleSearch = (v) => { setSearch(v); debouncedFetch(v); };

  const clearAll = () => {
    setSearch(''); setStatusFilter(''); setClassFilter('');
    setCourseFilter(''); setMonthFilter(''); setYearFilter(''); setPmFilter('');
    setPage(1);
    doFetch(1, {});
  };

  // ── Active filter count ──────────────────────────────────────
  const chips = [
    search       && { label: `🔍 "${search}"`,                              clear: () => handleSearch('') },
    statusFilter && { label: `Trạng thái: ${STATUS_TUITION[statusFilter]?.label}`, clear: () => setStatusFilter('') },
    classFilter  && { label: `Lớp: ${classes.find(c=>c._id===classFilter)?.className||'...'}`,  clear: () => setClassFilter('') },
    courseFilter && { label: `Khóa: ${courses.find(c=>c._id===courseFilter)?.courseName||'...'}`, clear: () => setCourseFilter('') },
    (monthFilter||yearFilter) && { label: `Tháng ${monthFilter||'?'}/${yearFilter||'?'}`, clear: () => { setMonthFilter(''); setYearFilter(''); } },
    pmFilter     && { label: `TT: ${PAYMENT_METHODS[pmFilter]}`,           clear: () => setPmFilter('') },
  ].filter(Boolean);

  // ── Stats map ────────────────────────────────────────────────
  const statMap = (stats.stats || []).reduce((acc, s) => { acc[s._id] = s; return acc; }, {});
  const totalPaid    = statMap['paid']?.totalAmount || 0;
  const totalPending = (statMap['pending']?.totalAmount || 0) + (statMap['overdue']?.totalAmount || 0) + (statMap['partial']?.totalAmount || 0);
  const pctPaid = (totalPaid + totalPending) > 0 ? Math.round(totalPaid / (totalPaid + totalPending) * 100) : 0;

  // ── Modal helpers ────────────────────────────────────────────
  const openCreate = () => {
    setForm({ student: '', class: '', course: '', amount: '', discount: 0, dueDate: '', notes: '' });
    setModal('create');
  };
  const openPay = (t) => {
    setSelected(t);
    setPayForm({ status: 'paid', paymentMethod: 'cash', paidDate: new Date().toISOString().slice(0, 10), notes: '' });
    setModal('pay');
  };
  const openDetail = (t) => { setSelected(t); setModal('detail'); };

  const handleCreate = async () => {
    if (!form.student || !form.class || !form.course || !form.amount || !form.dueDate)
      return toast.error('Vui lòng điền đủ thông tin bắt buộc');
    setSaving(true);
    try {
      await tuitionService.create(form);
      toast.success('Tạo phiếu học phí thành công!');
      setModal(null); doFetch(page, getFilters()); refreshStats();
    } catch (e) { toast.error(e.response?.data?.message || 'Lỗi tạo phiếu'); }
    finally { setSaving(false); }
  };

  const handlePay = async () => {
    setSaving(true);
    try {
      await tuitionService.updateStatus(selected._id, payForm);
      toast.success('Cập nhật học phí thành công!');
      setModal(null); doFetch(page, getFilters()); refreshStats();
    } catch { toast.error('Lỗi cập nhật'); }
    finally { setSaving(false); }
  };

  const handleCourseChange = (courseId) => {
    const c = courses.find(x => x._id === courseId);
    setForm(f => ({ ...f, course: courseId, amount: c?.fee || '' }));
  };

  // ── Inline amounts ───────────────────────────────────────────
  const pageTotal   = tuitions.reduce((s, t) => s + t.finalAmount, 0);
  const pagePaid    = tuitions.filter(t => t.status === 'paid').reduce((s, t) => s + t.finalAmount, 0);
  const pageUnpaid  = tuitions.filter(t => ['pending','overdue','partial'].includes(t.status)).reduce((s, t) => s + t.finalAmount, 0);

  const currentYear = new Date().getFullYear();
  const years  = [currentYear, currentYear - 1, currentYear - 2];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // ── Stat card click toggle ───────────────────────────────────
  const toggleStatus = (key) => {
    const next = statusFilter === key ? '' : key;
    setStatusFilter(next);
    setPage(1);
  };

  return (
    <>
      <Topbar title="Quản lý học phí" subtitle="Theo dõi tình trạng đóng học phí" />
      <div className="page-body">
        <PageHeader
          title="Danh sách học phí"
          actions={
            <div style={{ display: 'flex', gap: 10 }}>
              <ExportMenu getFilters={getFilters} />
              <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Tạo phiếu</button>
            </div>
          }
        />

        {/* ── Stat cards ─────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { key: 'paid',    label: 'Đã đóng',     icon: <CheckCircle2 size={16} />, bg: '#ecfdf5', border: '#6ee7b7', color: '#059669' },
            { key: 'pending', label: 'Chưa đóng',   icon: <Clock        size={16} />, bg: '#fffbeb', border: '#fcd34d', color: '#d97706' },
            { key: 'overdue', label: 'Quá hạn',     icon: <AlertCircle  size={16} />, bg: '#fef2f2', border: '#fca5a5', color: '#dc2626' },
            { key: 'partial', label: 'Đóng 1 phần', icon: <CreditCard   size={16} />, bg: '#eff6ff', border: '#93c5fd', color: '#2563eb' },
            { special: true,  label: `Doanh thu T${new Date().getMonth() + 1}`, icon: <Banknote size={16} />, bg: 'var(--gold-50)', border: 'var(--gold-300)', color: 'var(--gold-700)' },
          ].map((s, i) => (
            <div key={i}
              style={{ background: s.bg, border: `2px solid ${statusFilter === s.key ? s.color : s.border}`, borderRadius: 12, padding: '14px 16px', cursor: s.key ? 'pointer' : 'default', transition: 'all 0.15s', boxShadow: statusFilter === s.key ? `0 0 0 3px ${s.color}22` : 'none' }}
              onClick={() => s.key && toggleStatus(s.key)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, color: s.color }}>
                {s.icon}
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>
                {s.special ? formatCurrency(stats.monthlyRevenue || 0) : (statMap[s.key]?.count ?? 0)}
              </div>
              {!s.special && statMap[s.key] && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{formatCurrency(statMap[s.key].totalAmount)}</div>
              )}
            </div>
          ))}
        </div>

        {/* ── Revenue progress bar ─────────────────────────────── */}
        {(totalPaid + totalPending) > 0 && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <span style={{ fontWeight: 700 }}>Tỷ lệ thu học phí tổng</span>
              <span style={{ color: 'var(--text-muted)' }}>
                {formatCurrency(totalPaid)} / {formatCurrency(totalPaid + totalPending)}
                <strong style={{ color: '#059669', marginLeft: 8 }}>({pctPaid}%)</strong>
              </span>
            </div>
            <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pctPaid}%`, background: 'linear-gradient(90deg, #059669, #34d399)', borderRadius: 8, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        )}

        {/* ── Search + filter bar ──────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input className="form-control" style={{ paddingLeft: 36, paddingRight: search ? 34 : 12 }}
              value={search} onChange={e => handleSearch(e.target.value)}
              placeholder="Tìm theo tên, mã học viên, SĐT..." />
            {search && (
              <button onClick={() => handleSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status select */}
          <select className="form-control" style={{ width: 180 }}
            value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_TUITION).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>

          {/* Toggle advanced */}
          <button className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'} btn-sm`}
            style={{ gap: 6, whiteSpace: 'nowrap' }}
            onClick={() => setShowFilters(v => !v)}>
            <SlidersHorizontal size={14} />
            Bộ lọc nâng cao
            {chips.filter(c => !String(c.label).startsWith('🔍') && !String(c.label).startsWith('Trạng thái')).length > 0 && (
              <span style={{ background: showFilters ? 'rgba(255,255,255,0.35)' : 'var(--gold-500)', color: '#fff', borderRadius: 20, padding: '0 6px', fontSize: 11, fontWeight: 700 }}>
                {chips.filter(c => !String(c.label).startsWith('🔍') && !String(c.label).startsWith('Trạng thái')).length}
              </span>
            )}
          </button>

          {chips.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearAll} style={{ color: '#ef4444', gap: 4 }}>
              <X size={13} /> Xóa tất cả
            </button>
          )}
        </div>

        {/* ── Advanced filters panel ───────────────────────────── */}
        {showFilters && (
          <div style={{ background: 'var(--gold-50)', border: '1px solid var(--gold-200)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-700)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <Users size={12} /> Lớp học
                </label>
                <select className="form-control" style={{ fontSize: 13 }} value={classFilter}
                  onChange={e => { setClassFilter(e.target.value); setPage(1); }}>
                  <option value="">Tất cả lớp học</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-700)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <BookOpen size={12} /> Khóa học
                </label>
                <select className="form-control" style={{ fontSize: 13 }} value={courseFilter}
                  onChange={e => { setCourseFilter(e.target.value); setPage(1); }}>
                  <option value="">Tất cả khóa học</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.courseName}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-700)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <CalendarDays size={12} /> Tháng / Năm hạn đóng
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select className="form-control" style={{ fontSize: 13 }} value={monthFilter}
                    onChange={e => { setMonthFilter(e.target.value); setPage(1); }}>
                    <option value="">Tháng</option>
                    {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
                  </select>
                  <select className="form-control" style={{ fontSize: 13, width: 90 }} value={yearFilter}
                    onChange={e => { setYearFilter(e.target.value); setPage(1); }}>
                    <option value="">Năm</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-700)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <CreditCard size={12} /> Hình thức thanh toán
                </label>
                <select className="form-control" style={{ fontSize: 13 }} value={pmFilter}
                  onChange={e => { setPmFilter(e.target.value); setPage(1); }}>
                  <option value="">Tất cả hình thức</option>
                  {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                    <option key={k} value={k}>{PM_ICON[k]} {v}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Active filter chips ──────────────────────────────── */}
        {chips.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Đang lọc:</span>
            {chips.map((c, i) => <Chip key={i} label={c.label} onRemove={c.clear} />)}
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>— {total} kết quả</span>
          </div>
        )}

        {/* ── Table ────────────────────────────────────────────── */}
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Mã phiếu</th>
                  <th>Học viên</th>
                  <th>Lớp / Khóa học</th>
                  <th style={{ textAlign: 'right' }}>Học phí</th>
                  <th style={{ textAlign: 'right' }}>Giảm giá</th>
                  <th style={{ textAlign: 'right' }}>Thực thu</th>
                  <th>Hạn đóng</th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? <LoadingRows cols={10} rows={8} />
                  : tuitions.length === 0
                    ? <tr><td colSpan={10}><EmptyState message={chips.length ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có phiếu học phí nào'} /></td></tr>
                    : tuitions.map(t => (
                      <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => openDetail(t)}>
                        <td onClick={e => e.stopPropagation()}>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--gold-700)' }}>{t.receiptCode}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gold-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--gold-700)', flexShrink: 0 }}>
                              {t.student?.fullName?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{t.student?.fullName || '—'}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.student?.studentCode} · {t.student?.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{t.class?.className || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.course?.courseName}</div>
                        </td>
                        <td style={{ textAlign: 'right', fontSize: 13 }}>{formatCurrency(t.amount)}</td>
                        <td style={{ textAlign: 'right', fontSize: 13, color: t.discount > 0 ? '#059669' : 'var(--text-muted)' }}>
                          {t.discount > 0 ? `−${formatCurrency(t.discount)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--gold-700)' }}>{formatCurrency(t.finalAmount)}</span>
                        </td>
                        <td style={{ fontSize: 13 }}>
                          <div>{formatDate(t.dueDate)}</div>
                          {t.status === 'overdue' && <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>⚠ Quá hạn</div>}
                        </td>
                        <td><Badge {...(STATUS_TUITION[t.status] || { label: t.status, cls: 'badge-gray' })} /></td>
                        <td style={{ fontSize: 12 }}>
                          {t.paidDate
                            ? <><div style={{ fontWeight: 600 }}>{formatDate(t.paidDate)}</div><div style={{ color: 'var(--text-muted)' }}>{PM_ICON[t.paymentMethod]} {PAYMENT_METHODS[t.paymentMethod]}</div></>
                            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            {['pending', 'overdue', 'partial'].includes(t.status) && (
                              <button className="btn btn-primary btn-sm" onClick={() => openPay(t)} style={{ gap: 4, whiteSpace: 'nowrap' }}>
                                <CheckCircle2 size={13} /> Thu tiền
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          {tuitions.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span>📄 <strong>{total}</strong> phiếu</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>Trang này: <strong style={{ color: 'var(--gold-700)' }}>{formatCurrency(pageTotal)}</strong></span>
              <span>✅ Đã thu: <strong style={{ color: '#059669' }}>{formatCurrency(pagePaid)}</strong></span>
              <span>⏳ Chưa thu: <strong style={{ color: '#d97706' }}>{formatCurrency(pageUnpaid)}</strong></span>
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </div>

      {/* ══ Detail Modal ══════════════════════════════════════ */}
      {modal === 'detail' && selected && (
        <Modal title="Chi tiết phiếu học phí" onClose={() => setModal(null)} size="md"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Đóng</button>
              {['pending', 'overdue', 'partial'].includes(selected.status) && (
                <button className="btn btn-primary" onClick={() => { setModal(null); setTimeout(() => openPay(selected), 50); }}>
                  <CheckCircle2 size={14} /> Thu tiền
                </button>
              )}
            </>
          }>
          <div style={{ textAlign: 'center', padding: '12px 0 18px', borderBottom: '2px dashed var(--gold-200)', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>Phiếu học phí</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold-700)', fontFamily: 'monospace', margin: '6px 0' }}>{selected.receiptCode}</div>
            <Badge {...(STATUS_TUITION[selected.status] || { label: selected.status, cls: 'badge-gray' })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
            {[
              ['Học viên',    selected.student?.fullName],
              ['Mã HV',       selected.student?.studentCode],
              ['SĐT',         selected.student?.phone || '—'],
              ['Lớp học',     selected.class?.className || '—'],
              ['Khóa học',    selected.course?.courseName || '—'],
              ['Mã lớp',      selected.class?.classCode || '—'],
              ['Hạn đóng',    formatDate(selected.dueDate)],
              ['Ngày đóng',   selected.paidDate ? formatDate(selected.paidDate) : '—'],
              ['Hình thức TT', selected.paymentMethod ? `${PM_ICON[selected.paymentMethod]} ${PAYMENT_METHODS[selected.paymentMethod]}` : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, background: 'var(--gold-50)', border: '1px solid var(--gold-200)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Học phí gốc</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(selected.amount)}</span>
            </div>
            {selected.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: '#059669' }}>Giảm giá</span>
                <span style={{ fontWeight: 600, color: '#059669' }}>−{formatCurrency(selected.discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px dashed var(--gold-300)', fontSize: 16 }}>
              <span style={{ fontWeight: 700, color: 'var(--gold-800)' }}>Thực thu</span>
              <span style={{ fontWeight: 900, color: 'var(--gold-800)' }}>{formatCurrency(selected.finalAmount)}</span>
            </div>
          </div>
          {selected.notes && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
              📝 {selected.notes}
            </div>
          )}
        </Modal>
      )}

      {/* ══ Create Modal ══════════════════════════════════════ */}
      {modal === 'create' && (
        <Modal title="Tạo phiếu học phí mới" onClose={() => setModal(null)} size="md"
          footer={<><button className="btn btn-outline" onClick={() => setModal(null)}>Hủy</button><button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Đang lưu...' : 'Tạo phiếu'}</button></>}>
          <div className="form-group">
            <label className="form-label">Học viên *</label>
            <select className="form-control" value={form.student} onChange={e => setForm(f => ({ ...f, student: e.target.value }))}>
              <option value="">— Chọn học viên —</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.studentCode} — {s.fullName} ({s.phone})</option>)}
            </select>
          </div>
          <FormRow cols={2}>
            <div className="form-group">
              <label className="form-label">Lớp học *</label>
              <select className="form-control" value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))}>
                <option value="">— Chọn lớp —</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Khóa học *</label>
              <select className="form-control" value={form.course} onChange={e => handleCourseChange(e.target.value)}>
                <option value="">— Chọn khóa học —</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.courseName} — {formatCurrency(c.fee)}</option>)}
              </select>
            </div>
          </FormRow>
          <FormRow cols={2}>
            <div className="form-group">
              <label className="form-label">Học phí (VND) *</label>
              <input className="form-control" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="3500000" />
            </div>
            <div className="form-group">
              <label className="form-label">Giảm giá (VND)</label>
              <input className="form-control" type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} placeholder="0" />
            </div>
          </FormRow>
          {form.amount && (
            <div style={{ background: 'var(--gold-50)', border: '1px solid var(--gold-200)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Thực thu:</span>
              <span style={{ fontWeight: 800, color: 'var(--gold-700)', fontSize: 16 }}>{formatCurrency((Number(form.amount) || 0) - (Number(form.discount) || 0))}</span>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Hạn đóng *</label>
            <input className="form-control" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Ghi chú</label>
            <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ghi chú nếu có..." />
          </div>
        </Modal>
      )}

      {/* ══ Pay Modal ═════════════════════════════════════════ */}
      {modal === 'pay' && selected && (
        <Modal title="Thu học phí" onClose={() => setModal(null)} size="sm"
          footer={<><button className="btn btn-outline" onClick={() => setModal(null)}>Hủy</button><button className="btn btn-primary" onClick={handlePay} disabled={saving}>{saving ? 'Đang lưu...' : 'Xác nhận thu'}</button></>}>
          <div style={{ background: 'var(--gold-50)', border: '1px solid var(--gold-200)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Mã phiếu: {selected.receiptCode}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}><strong>{selected.student?.fullName}</strong> · {selected.class?.className}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--gold-700)' }}>{formatCurrency(selected.finalAmount)}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Trạng thái</label>
            <select className="form-control" value={payForm.status} onChange={e => setPayForm(f => ({ ...f, status: e.target.value }))}>
              {Object.entries(STATUS_TUITION).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Hình thức thanh toán</label>
            <select className="form-control" value={payForm.paymentMethod} onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))}>
              {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{PM_ICON[k]} {v}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Ngày thu</label>
            <input className="form-control" type="date" value={payForm.paidDate} onChange={e => setPayForm(f => ({ ...f, paidDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Ghi chú</label>
            <textarea className="form-control" rows={2} value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </Modal>
      )}
    </>
  );
}
