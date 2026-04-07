import React, { useEffect, useState, useCallback } from 'react';
import { UserPlus, Pencil, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../../components/layout/Topbar.jsx';
import {
  Badge, Modal, Pagination, SearchInput,
  EmptyState, LoadingRows, ConfirmModal, PageHeader, FormRow,
} from '../../components/common/index.jsx';
import { studentService } from '../../services/index.js';
import { formatDate, STATUS_STUDENT, debounce } from '../../utils/helpers.js';

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
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'detail' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

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

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <SearchInput value={search} onChange={handleSearch} placeholder="Tìm theo tên, mã, SĐT..." />
          <select className="form-control" style={{ width: 160 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_STUDENT).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
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
