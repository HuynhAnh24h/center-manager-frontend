import React, { useEffect, useState, useCallback } from 'react';
import { BookPlus, Pencil, Trash2, Clock, Users, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../../components/layout/Topbar.jsx';
import { Modal, Pagination, SearchInput, EmptyState, ConfirmModal, PageHeader, FormRow, Badge } from '../../components/common/index.jsx';
import { courseService } from '../../services/index.js';
import { formatCurrency, LEVEL_LABEL, debounce } from '../../utils/helpers.js';

const EMPTY = { courseName: '', description: '', duration: '', fee: '', level: 'beginner', category: '', isActive: true };

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async (p = 1, s = '') => {
    setLoading(true);
    try {
      const { data } = await courseService.getAll({ page: p, limit: 9, search: s });
      setCourses(data.data); setTotal(data.total); setTotalPages(data.totalPages);
    } catch { toast.error('Lỗi tải khóa học'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(page, search); }, [page]);
  const debouncedSearch = useCallback(debounce((v) => { setPage(1); fetch(1, v); }, 400), []);
  const handleSearch = (v) => { setSearch(v); debouncedSearch(v); };

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit = (c) => { setSelected(c); setForm({ ...c }); setModal('edit'); };
  const openDelete = (c) => { setSelected(c); setModal('delete'); };

  const handleSave = async () => {
    if (!form.courseName || !form.fee || !form.duration) return toast.error('Vui lòng điền đầy đủ thông tin');
    setSaving(true);
    try {
      modal === 'create' ? await courseService.create(form) : await courseService.update(selected._id, form);
      toast.success(modal === 'create' ? 'Tạo khóa học thành công!' : 'Cập nhật thành công!');
      setModal(null); fetch(page, search);
    } catch (e) { toast.error(e.response?.data?.message || 'Lỗi'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await courseService.delete(selected._id); toast.success('Đã xóa khóa học'); setModal(null); fetch(1, search); }
    catch { toast.error('Xóa thất bại'); }
  };

  const F = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const LEVEL_COLOR = { beginner: 'badge-success', intermediate: 'badge-warning', advanced: 'badge-error' };

  return (
    <>
      <Topbar title="Quản lý khóa học" subtitle={`${total} khóa học trong hệ thống`} />
      <div className="page-body">
        <PageHeader
          title="Danh sách khóa học"
          actions={<button className="btn btn-primary" onClick={openCreate}><BookPlus size={15} /> Thêm khóa học</button>}
        />
        <div className="flex items-center gap-3 mb-4">
          <SearchInput value={search} onChange={handleSearch} placeholder="Tìm khóa học..." />
        </div>

        {loading ? (
          <div className="grid grid-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card" style={{ padding: 20 }}>
                {[100, 60, 40, 80].map((w, j) => <div key={j} className="skeleton" style={{ height: 14, width: `${w}%`, marginBottom: 10 }} />)}
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="card"><EmptyState message="Chưa có khóa học nào" /></div>
        ) : (
          <div className="grid grid-3 gap-4">
            {courses.map((c) => (
              <div key={c._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Color header */}
                <div style={{ height: 6, background: 'linear-gradient(90deg, var(--gold-400), var(--gold-600))' }} />
                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: 'var(--gold-700)', background: 'var(--gold-50)', padding: '2px 8px', borderRadius: 4 }}>{c.courseCode}</span>
                    <Badge label={LEVEL_LABEL[c.level]} cls={LEVEL_COLOR[c.level]} />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>{c.courseName}</h3>
                  {c.category && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{c.category}</p>}
                  {c.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>{c.description.slice(0, 80)}{c.description.length > 80 ? '...' : ''}</p>}

                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <Clock size={13} color="var(--gold-500)" />
                      {c.duration} buổi
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <Users size={13} color="var(--gold-500)" />
                      {c.totalStudents || 0} học viên
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 16, fontWeight: 800, color: 'var(--gold-700)' }}>
                      <DollarSign size={14} />
                      {formatCurrency(c.fee)}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)} title="Sửa"><Pencil size={14} /></button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => openDelete(c)} title="Xóa"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Thêm khóa học mới' : 'Chỉnh sửa khóa học'} onClose={() => setModal(null)} size="md"
          footer={<><button className="btn btn-outline" onClick={() => setModal(null)}>Hủy</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button></>}>
          <div className="form-group">
            <label className="form-label">Tên khóa học *</label>
            <input className="form-control" value={form.courseName} onChange={F('courseName')} placeholder="VD: Tiếng Anh Giao Tiếp" />
          </div>
          <FormRow>
            <div className="form-group">
              <label className="form-label">Học phí (VND) *</label>
              <input className="form-control" type="number" value={form.fee} onChange={F('fee')} placeholder="3500000" />
            </div>
            <div className="form-group">
              <label className="form-label">Số buổi *</label>
              <input className="form-control" type="number" value={form.duration} onChange={F('duration')} placeholder="40" />
            </div>
          </FormRow>
          <FormRow>
            <div className="form-group">
              <label className="form-label">Cấp độ</label>
              <select className="form-control" value={form.level} onChange={F('level')}>
                {Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Danh mục</label>
              <input className="form-control" value={form.category} onChange={F('category')} placeholder="VD: Ngoại ngữ" />
            </div>
          </FormRow>
          <div className="form-group">
            <label className="form-label">Mô tả</label>
            <textarea className="form-control" rows={3} value={form.description} onChange={F('description')} placeholder="Mô tả ngắn về khóa học..." />
          </div>
        </Modal>
      )}

      {modal === 'delete' && selected && (
        <ConfirmModal title="Xóa khóa học" message={`Xóa khóa học "${selected.courseName}"?`} onConfirm={handleDelete} onCancel={() => setModal(null)} danger />
      )}
    </>
  );
}
