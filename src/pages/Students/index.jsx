import React, { useEffect, useState, useCallback } from 'react';
import { UserPlus, Pencil, Trash2, Eye, CreditCard, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../../components/layout/Topbar.jsx';
import {
  Badge, Modal, Pagination, SearchInput,
  EmptyState, LoadingRows, ConfirmModal, PageHeader, FormRow,
} from '../../components/common/index.jsx';
import { studentService, tuitionService } from '../../services/index.js';
import { formatDate, formatCurrency, STATUS_STUDENT, STATUS_TUITION, debounce } from '../../utils/helpers.js';

const EMPTY_FORM = {
  fullName: '', phone: '', email: '', gender: 'male',
  dateOfBirth: '', address: '', parentName: '', parentPhone: '', notes: '',
};

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Tuition state
  const [tuitions, setTuitions] = useState([]);
  const [tuitionSummary, setTuitionSummary] = useState(null);
  const [tuitionLoading, setTuitionLoading] = useState(false);

  const fetchStudents = useCallback(async (p = page, s = search, st = statusFilter) => {
    setLoading(true);
    try {
      const { data } = await studentService.getAll({ page: p, limit: 10, search: s, status: st || undefined });
      setStudents(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Lỗi tải danh sách học viên');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(1, search, statusFilter); }, [statusFilter]);
  useEffect(() => { fetchStudents(page, search, statusFilter); }, [page]);

  const debouncedSearch = useCallback(
    debounce((val) => { setPage(1); fetchStudents(1, val, statusFilter); }, 400),
    [statusFilter]
  );

  const handleSearch = (val) => { setSearch(val); debouncedSearch(val); };

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create'); };
  const openEdit = (s) => { setSelected(s); setForm({ ...s, dateOfBirth: s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : '' }); setModal('edit'); };
  const openDetail = (s) => { setSelected(s); setModal('detail'); };
  const openDelete = (s) => { setSelected(s); setModal('delete'); };

  const openTuition = async (s) => {
    setSelected(s);
    setModal('tuition');
    setTuitionLoading(true);
    setTuitions([]);
    setTuitionSummary(null);
    try {
      const { data } = await tuitionService.getByStudent(s._id);
      setTuitions(data.data);
      setTuitionSummary(data.summary);
    } catch {
      toast.error('Lỗi tải học phí');
    } finally {
      setTuitionLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) return toast.error('Vui lòng nhập họ tên');
    setSaving(true);
    try {
      if (modal === 'create') {
        await studentService.create(form);
        toast.success('Thêm học viên thành công!');
      } else {
        await studentService.update(selected._id, form);
        toast.success('Cập nhật thành công!');
      }
      setModal(null);
      fetchStudents(page, search, statusFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await studentService.delete(selected._id);
      toast.success('Đã xóa học viên');
      setModal(null);
      fetchStudents(1, search, statusFilter);
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  const F = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const paidTuitions = tuitions.filter(t => t.status === 'paid');
  const unpaidTuitions = tuitions.filter(t => ['pending', 'overdue', 'partial'].includes(t.status));

  return (
    <>
      <Topbar title="Quản lý học viên" subtitle={`${total} học viên trong hệ thống`} />
      <div className="page-body">
        <PageHeader
          title="Danh sách học viên"
          actions={
            <button className="btn btn-primary" onClick={openCreate}>
              <UserPlus size={15} /> Thêm học viên
            </button>
          }
        />

        <div className="flex items-center gap-3 mb-4">
          <SearchInput value={search} onChange={handleSearch} placeholder="Tìm theo tên, mã, SĐT..." />
          <select className="form-control" style={{ width: 160 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_STUDENT).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Mã HV</th>
                  <th>Họ và tên</th>
                  <th>Điện thoại</th>
                  <th>Giới tính</th>
                  <th>Phụ huynh</th>
                  <th>Trạng thái</th>
                  <th>Ngày đăng ký</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <LoadingRows cols={8} rows={8} />
                ) : students.length === 0 ? (
                  <tr><td colSpan={8}><EmptyState message="Chưa có học viên nào" /></td></tr>
                ) : (
                  students.map((s) => (
                    <tr key={s._id}>
                      <td><span style={{ fontWeight: 700, color: 'var(--gold-700)', fontFamily: 'monospace', fontSize: 13 }}>{s.studentCode}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--gold-700)', flexShrink: 0 }}>
                            {s.fullName.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{s.fullName}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td>{s.phone || '—'}</td>
                      <td>{s.gender === 'male' ? 'Nam' : s.gender === 'female' ? 'Nữ' : 'Khác'}</td>
                      <td>
                        <div style={{ fontSize: 13 }}>{s.parentName || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.parentPhone}</div>
                      </td>
                      <td><Badge {...STATUS_STUDENT[s.status]} /></td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(s.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openDetail(s)} title="Chi tiết"><Eye size={14} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openTuition(s)} title="Học phí" style={{ color: 'var(--gold-600)' }}><CreditCard size={14} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(s)} title="Sửa"><Pencil size={14} /></button>
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => openDelete(s)} title="Xóa"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* Create / Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? 'Thêm học viên mới' : 'Chỉnh sửa học viên'}
          onClose={() => setModal(null)}
          size="lg"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : modal === 'create' ? 'Thêm học viên' : 'Lưu thay đổi'}
              </button>
            </>
          }
        >
          <FormRow cols={2}>
            <div className="form-group">
              <label className="form-label">Họ và tên *</label>
              <input className="form-control" value={form.fullName} onChange={F('fullName')} placeholder="Nguyễn Văn A" />
            </div>
            <div className="form-group">
              <label className="form-label">Giới tính</label>
              <select className="form-control" value={form.gender} onChange={F('gender')}>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </FormRow>
          <FormRow cols={2}>
            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input className="form-control" value={form.phone} onChange={F('phone')} placeholder="0901234567" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={form.email} onChange={F('email')} placeholder="email@gmail.com" />
            </div>
          </FormRow>
          <FormRow cols={2}>
            <div className="form-group">
              <label className="form-label">Ngày sinh</label>
              <input className="form-control" type="date" value={form.dateOfBirth} onChange={F('dateOfBirth')} />
            </div>
            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select className="form-control" value={form.status || 'active'} onChange={F('status')}>
                {Object.entries(STATUS_STUDENT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </FormRow>
          <div className="form-group">
            <label className="form-label">Địa chỉ</label>
            <input className="form-control" value={form.address} onChange={F('address')} placeholder="Số nhà, đường, quận..." />
          </div>
          <FormRow cols={2}>
            <div className="form-group">
              <label className="form-label">Tên phụ huynh</label>
              <input className="form-control" value={form.parentName} onChange={F('parentName')} placeholder="Nguyễn Văn B" />
            </div>
            <div className="form-group">
              <label className="form-label">SĐT phụ huynh</label>
              <input className="form-control" value={form.parentPhone} onChange={F('parentPhone')} placeholder="0912345678" />
            </div>
          </FormRow>
          <div className="form-group">
            <label className="form-label">Ghi chú</label>
            <textarea className="form-control" rows={2} value={form.notes} onChange={F('notes')} placeholder="Thông tin thêm..." />
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {modal === 'detail' && selected && (
        <Modal title="Chi tiết học viên" onClose={() => setModal(null)} size="md"
          footer={<><button className="btn btn-outline" onClick={() => setModal(null)}>Đóng</button><button className="btn btn-primary" onClick={() => openEdit(selected)}>Chỉnh sửa</button></>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
            {[
              ['Mã học viên', selected.studentCode],
              ['Họ và tên', selected.fullName],
              ['Giới tính', selected.gender === 'male' ? 'Nam' : selected.gender === 'female' ? 'Nữ' : 'Khác'],
              ['Điện thoại', selected.phone || '—'],
              ['Email', selected.email || '—'],
              ['Ngày sinh', formatDate(selected.dateOfBirth)],
              ['Phụ huynh', selected.parentName || '—'],
              ['SĐT PH', selected.parentPhone || '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 6 }}>Trạng thái</div>
            <Badge {...STATUS_STUDENT[selected.status]} />
          </div>
          {selected.notes && (
            <div style={{ marginTop: 12, padding: 12, background: 'var(--gold-50)', borderRadius: 8, border: '1px solid var(--gold-200)', fontSize: 13 }}>
              {selected.notes}
            </div>
          )}
        </Modal>
      )}

      {/* Tuition Modal */}
      {modal === 'tuition' && selected && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 780, width: '100%' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Học phí — {selected.fullName}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{selected.studentCode}</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}><X size={18} /></button>
            </div>

            <div className="modal-body">
              {tuitionLoading ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>
              ) : (
                <>
                  {/* Summary cards */}
                  {tuitionSummary && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                      <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--gold-50)', border: '1px solid var(--gold-200)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gold-700)', marginBottom: 4 }}>Tổng học phí</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold-800)' }}>{formatCurrency(tuitionSummary.totalAmount)}</div>
                      </div>
                      <div style={{ padding: '14px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#166534', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={12} /> Đã đóng</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>{formatCurrency(tuitionSummary.paidAmount)}</div>
                        <div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>
                          {tuitionSummary.totalAmount > 0 ? Math.round(tuitionSummary.paidAmount / tuitionSummary.totalAmount * 100) : 0}% tổng học phí
                        </div>
                      </div>
                      <div style={{ padding: '14px 16px', borderRadius: 10, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#9a3412', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> Chưa đóng</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#ea580c' }}>{formatCurrency(tuitionSummary.unpaidAmount)}</div>
                        <div style={{ fontSize: 11, color: '#9a3412', marginTop: 2 }}>
                          {tuitionSummary.totalAmount > 0 ? Math.round(tuitionSummary.unpaidAmount / tuitionSummary.totalAmount * 100) : 0}% tổng học phí
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Progress bar */}
                  {tuitionSummary && tuitionSummary.totalAmount > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                        <span>Tiến độ đóng học phí</span>
                        <span style={{ fontWeight: 700 }}>{formatCurrency(tuitionSummary.paidAmount)} / {formatCurrency(tuitionSummary.totalAmount)}</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, Math.round(tuitionSummary.paidAmount / tuitionSummary.totalAmount * 100))}%`, background: 'linear-gradient(90deg, #16a34a, #22c55e)', borderRadius: 8, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  )}

                  {tuitions.length === 0 ? (
                    <EmptyState message="Chưa có phiếu học phí nào" />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {tuitions.map((t) => (
                        <div key={t._id} style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--white)', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{t.class?.className || '—'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              {t.course?.courseName} · Hạn: {formatDate(t.dueDate)}
                              {t.paidDate && ` · Đã đóng: ${formatDate(t.paidDate)}`}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{formatCurrency(t.finalAmount)}</div>
                            {t.discount > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatCurrency(t.amount)}</div>}
                          </div>
                          <div style={{ flexShrink: 0 }}>
                            <Badge {...(STATUS_TUITION[t.status] || { label: t.status, cls: 'badge-gray' })} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {modal === 'delete' && selected && (
        <ConfirmModal
          title="Xóa học viên"
          message={`Bạn có chắc muốn xóa học viên "${selected.fullName}"? Hành động này không thể hoàn tác.`}
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
          danger
        />
      )}
    </>
  );
}
