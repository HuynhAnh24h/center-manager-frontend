import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BookPlus, Pencil, Trash2, Clock, Users, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../../components/layout/Topbar.jsx';
import { Modal, Pagination, SearchInput, EmptyState, ConfirmModal, PageHeader, FormRow, Badge } from '../../components/common/index.jsx';
import {
  fetchCourses, createCourse, updateCourse, deleteCourse,
  setPage, setSearch,
} from '../../store/slices/coursesSlice.js';
import { formatCurrency, LEVEL_LABEL, debounce } from '../../utils/helpers.js';

const EMPTY = { courseName: '', description: '', duration: '', fee: '', level: 'beginner', category: '', isActive: true };
const LEVEL_COLOR = { beginner: 'badge-success', intermediate: 'badge-warning', advanced: 'badge-error' };

export default function CoursesPage() {
  const dispatch = useDispatch();
  const { list: courses, total, totalPages, page, search, loading } = useSelector(s => s.courses);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchCourses({ page, limit: 9, search }));
  }, [dispatch, page, search]);

  const debouncedSearch = useCallback(debounce(v => dispatch(setSearch(v)), 400), []);
  const handleSearch = v => debouncedSearch(v);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit = c => { setSelected(c); setForm({ ...c }); setModal('edit'); };
  const openDelete = c => { setSelected(c); setModal('delete'); };

  const handleSave = async () => {
    if (!form.courseName || !form.fee || !form.duration) return toast.error('Vui lòng điền đầy đủ thông tin');
    setSaving(true);
    try {
      let result = modal === 'create'
        ? await dispatch(createCourse(form))
        : await dispatch(updateCourse({ id: selected._id, data: form }));
      if (result.error) { toast.error(result.payload || 'Lỗi'); return; }
      toast.success(modal === 'create' ? 'Tạo khóa học thành công!' : 'Cập nhật thành công!');
      setModal(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteCourse({ id: selected._id, name: selected.courseName }));
    if (result.error) { toast.error(result.payload || 'Xóa thất bại'); return; }
    toast.success('Đã xóa khóa học');
    setModal(null);
  };

  const F = f => e => setForm({ ...form, [f]: e.target.value });

  return (
    <>
      <Topbar title="Quản lý khóa học" subtitle={`${total} khóa học trong hệ thống`} />
      <div className="page-body">
        <PageHeader title="Danh sách khóa học"
          actions={<button className="btn btn-primary" onClick={openCreate}><BookPlus size={15} /> Thêm khóa học</button>} />
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
          <EmptyState message="Chưa có khóa học nào" />
        ) : (
          <div className="grid grid-3 gap-4">
            {courses.map(c => (
              <div key={c._id} className="card course-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{c.courseName}</h3>
                    <Badge label={LEVEL_LABEL[c.level] || c.level} cls={LEVEL_COLOR[c.level] || 'badge-gray'} />
                  </div>
                  {c.category && <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 6 }}>{c.category}</span>}
                  {c.description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</p>}
                </div>
                <div style={{ padding: '12px 20px', display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <Clock size={13} color="var(--gold-500)" />
                    <span>{c.duration} buổi</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <DollarSign size={13} color="var(--gold-500)" />
                    <span style={{ fontWeight: 700, color: 'var(--gold-700)' }}>{formatCurrency(c.fee)}</span>
                  </div>
                </div>
                <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openEdit(c)}><Pencil size={13} /> Sửa</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => openDelete(c)}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div style={{ marginTop: 16 }}>
            <Pagination page={page} totalPages={totalPages} onPageChange={p => dispatch(setPage(p))} />
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Thêm khóa học' : 'Chỉnh sửa khóa học'}
          onClose={() => setModal(null)} size="md"
          footer={<><button className="btn btn-outline" onClick={() => setModal(null)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : modal === 'create' ? 'Tạo khóa học' : 'Lưu'}</button></>}>
          <div className="form-group"><label className="form-label">Tên khóa học *</label><input className="form-control" value={form.courseName} onChange={F('courseName')} placeholder="Tiếng Anh giao tiếp" /></div>
          <FormRow cols={2}>
            <div className="form-group"><label className="form-label">Số buổi học *</label><input className="form-control" type="number" value={form.duration} onChange={F('duration')} placeholder="24" /></div>
            <div className="form-group"><label className="form-label">Học phí *</label><input className="form-control" type="number" value={form.fee} onChange={F('fee')} placeholder="3500000" /></div>
          </FormRow>
          <FormRow cols={2}>
            <div className="form-group"><label className="form-label">Trình độ</label><select className="form-control" value={form.level} onChange={F('level')}>{Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Danh mục</label><input className="form-control" value={form.category} onChange={F('category')} placeholder="Tiếng Anh, Tin học..." /></div>
          </FormRow>
          <div className="form-group"><label className="form-label">Mô tả</label><textarea className="form-control" rows={3} value={form.description} onChange={F('description')} placeholder="Mô tả khóa học..." /></div>
        </Modal>
      )}

      {modal === 'delete' && selected && (
        <ConfirmModal title="Xóa khóa học"
          message={`Bạn có chắc muốn xóa khóa học "${selected.courseName}"?`}
          onConfirm={handleDelete} onCancel={() => setModal(null)} danger />
      )}
    </>
  );
}
