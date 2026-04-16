import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Pencil, Trash2, Users, UserPlus, UserMinus, ChevronRight, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../../components/layout/Topbar.jsx';
import { Badge, Modal, Pagination, SearchInput, EmptyState, LoadingRows, ConfirmModal, PageHeader, FormRow } from '../../components/common/index.jsx';
import { ShiftBadge, SHIFT_CONFIG } from '../../components/common/ShiftBadge.jsx';
import {
  fetchClasses, createClass, updateClass, deleteClass, enrollStudent, removeStudent,
  setPage, setSearch, setStatusFilter, setShiftFilter, setTypeFilter,
} from '../../store/slices/classesSlice.js';
import { courseService, classService, studentService } from '../../services/index.js';
import { formatDate, STATUS_CLASS, SHIFT_LABEL, DAY_LABEL, LEVEL_LABEL, debounce } from '../../utils/helpers.js';

const CLASS_TYPE_LABEL = { group: 'Theo nhóm', individual: 'Cá nhân' };
const CLASS_TYPE_COLOR = { group: { bg: '#e0f2fe', text: '#075985' }, individual: { bg: '#fef9c3', text: '#854d0e' } };
const EMPTY_FORM = {
  className: '', course: '', classType: 'group', startDate: '', maxStudents: 30,
  status: 'upcoming', notes: '',
  schedule: [{ dayOfWeek: 1, shift: 'morning', startTime: '08:00', endTime: '10:00', room: '' }],
};

export default function ClassesPage() {
  const dispatch = useDispatch();
  const { list: classes, total, totalPages, page, search, statusFilter, shiftFilter, typeFilter, loading } = useSelector(s => s.classes);

  const [courses, setCourses] = useState([]);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Manage students modal state (local)
  const [classDetail, setClassDetail] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(null);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const loadParams = { page, limit: 10, search, status: statusFilter || undefined, shift: shiftFilter || undefined, classType: typeFilter || undefined };

  useEffect(() => {
    dispatch(fetchClasses(loadParams));
  }, [dispatch, page, search, statusFilter, shiftFilter, typeFilter]);

  useEffect(() => {
    courseService.getAll({ limit: 100 }).then(({ data }) => setCourses(data.data)).catch(() => {});
  }, []);

  const debouncedSearch = useCallback(debounce(v => dispatch(setSearch(v)), 400), []);
  const handleSearch = v => debouncedSearch(v);

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create'); };
  const openEdit = c => {
    setSelected(c);
    setForm({ ...c, classType: c.classType || 'group', course: c.course?._id || c.course, startDate: c.startDate?.slice(0, 10) || '' });
    setModal('edit');
  };
  const openDelete = c => { setSelected(c); setModal('delete'); };

  const openManageStudents = async cls => {
    setSelected(cls); setModal('students'); setStudentsLoading(true);
    try {
      const [clsRes, stuRes] = await Promise.all([
        classService.getById(cls._id),
        studentService.getAll({ limit: 500, status: 'active' }),
      ]);
      setClassDetail(clsRes.data.data);
      setAllStudents(stuRes.data.data);
    } catch { toast.error('Lỗi tải dữ liệu'); }
    finally { setStudentsLoading(false); }
  };

  const handleSave = async () => {
    if (!form.className || !form.course || !form.startDate) return toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
    setSaving(true);
    try {
      let result = modal === 'create'
        ? await dispatch(createClass(form))
        : await dispatch(updateClass({ id: selected._id, data: form }));
      if (result.error) { toast.error(result.payload || 'Lỗi'); return; }
      toast.success(modal === 'create' ? 'Tạo lớp học thành công!' : 'Cập nhật thành công!');
      setModal(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteClass({ id: selected._id, name: selected.className }));
    if (result.error) { toast.error(result.payload || 'Xóa thất bại'); return; }
    toast.success('Đã xóa lớp học'); setModal(null);
  };

  const handleEnroll = async (studentId) => {
    const stu = allStudents.find(s => s._id === studentId);
    setEnrollLoading(studentId);
    try {
      const result = await dispatch(enrollStudent({ classId: selected._id, studentId, studentName: stu?.fullName || '', className: selected.className }));
      if (result.error) { toast.error(result.payload || 'Không thể thêm'); return; }
      toast.success('Đã thêm học viên vào lớp!');
      // Refresh classDetail
      const { data } = await classService.getById(selected._id);
      setClassDetail(data.data);
    } catch { toast.error('Không thể thêm'); }
    finally { setEnrollLoading(null); }
  };

  const handleRemove = async (studentId, studentName) => {
    if (!window.confirm(`Xóa "${studentName}" khỏi lớp?`)) return;
    setEnrollLoading(studentId);
    try {
      const result = await dispatch(removeStudent({ classId: selected._id, studentId, studentName, className: selected.className }));
      if (result.error) { toast.error(result.payload || 'Không thể xóa'); return; }
      toast.success('Đã xóa học viên khỏi lớp');
      const { data } = await classService.getById(selected._id);
      setClassDetail(data.data);
    } catch { toast.error('Không thể xóa'); }
    finally { setEnrollLoading(null); }
  };

  const F = f => e => setForm({ ...form, [f]: e.target.value });
  const updateSchedule = (idx, field, value) => { const s = [...form.schedule]; s[idx] = { ...s[idx], [field]: value }; setForm({ ...form, schedule: s }); };
  const addSchedule = () => setForm({ ...form, schedule: [...form.schedule, { dayOfWeek: 1, shift: 'morning', startTime: '08:00', endTime: '10:00', room: '' }] });
  const removeSchedule = idx => setForm({ ...form, schedule: form.schedule.filter((_, i) => i !== idx) });

  const enrolledIds = new Set((classDetail?.students || []).map(s => s._id?.toString()));
  const availableStudents = allStudents.filter(s => {
    if (enrolledIds.has(s._id?.toString())) return false;
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return s.fullName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q) || (s.phone || '').includes(q);
  });
  const isFull = classDetail && classDetail.students?.length >= classDetail.maxStudents;

  return (
    <>
      <Topbar title="Quản lý lớp học" subtitle={`${total} lớp học trong hệ thống`} />
      <div className="page-body">
        <PageHeader title="Danh sách lớp học"
          actions={<button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Thêm lớp học</button>} />

        <div className="flex items-center gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={handleSearch} placeholder="Tìm theo tên, mã lớp..." />
          <select className="form-control" style={{ width: 160 }} value={statusFilter} onChange={e => dispatch(setStatusFilter(e.target.value))}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_CLASS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="form-control" style={{ width: 150 }} value={shiftFilter} onChange={e => dispatch(setShiftFilter(e.target.value))}>
            <option value="">Tất cả ca học</option>
            {Object.entries(SHIFT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="form-control" style={{ width: 150 }} value={typeFilter} onChange={e => dispatch(setTypeFilter(e.target.value))}>
            <option value="">Tất cả loại lớp</option>
            {Object.entries(CLASS_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Mã lớp</th><th>Tên lớp</th><th>Loại</th><th>Khóa học</th>
                  <th>Lịch học</th><th>Học viên</th><th>Khai giảng</th><th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <LoadingRows cols={9} rows={6} />
                  : classes.length === 0 ? <tr><td colSpan={9}><EmptyState message="Chưa có lớp học nào" /></td></tr>
                  : classes.map(c => (
                    <tr key={c._id}>
                      <td><span style={{ fontWeight: 700, color: 'var(--gold-700)', fontFamily: 'monospace', fontSize: 13 }}>{c.classCode}</span></td>
                      <td><div style={{ fontWeight: 600 }}>{c.className}</div></td>
                      <td>{c.classType && <span style={{ background: CLASS_TYPE_COLOR[c.classType]?.bg || '#f3f4f6', color: CLASS_TYPE_COLOR[c.classType]?.text || '#374151', padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{CLASS_TYPE_LABEL[c.classType] || c.classType}</span>}</td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.course?.courseName || '—'}</div>
                        {c.course?.level && <span style={{ fontSize: 10, background: 'var(--gold-100)', color: 'var(--gold-800)', padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>{LEVEL_LABEL[c.course.level] || c.course.level}</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {(c.schedule || []).slice(0, 2).map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <ShiftBadge shift={s.shift} />
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{DAY_LABEL[s.dayOfWeek]} {s.startTime}–{s.endTime}</span>
                            </div>
                          ))}
                          {c.schedule?.length > 2 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{c.schedule.length - 2} ca khác</span>}
                        </div>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" style={{ gap: 5, padding: '4px 10px' }} onClick={() => openManageStudents(c)}>
                          <Users size={13} color="var(--gold-500)" />
                          <span style={{ fontWeight: 700 }}>{c.students?.length ?? 0}</span>
                          <span style={{ color: 'var(--text-muted)' }}>/ {c.maxStudents}</span>
                          <ChevronRight size={12} color="var(--text-muted)" />
                        </button>
                      </td>
                      <td style={{ fontSize: 13 }}>{formatDate(c.startDate)}</td>
                      <td><Badge {...STATUS_CLASS[c.status]} /></td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                          <button className="btn btn-outline btn-sm" style={{ gap: 4 }} onClick={() => openManageStudents(c)}><UserPlus size={13} /> Học viên</button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => openDelete(c)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={p => dispatch(setPage(p))} />
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Tạo lớp học mới' : 'Chỉnh sửa lớp học'}
          onClose={() => setModal(null)} size="lg"
          footer={<><button className="btn btn-outline" onClick={() => setModal(null)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : modal === 'create' ? 'Tạo lớp' : 'Lưu'}</button></>}>
          <FormRow cols={2}>
            <div className="form-group"><label className="form-label">Tên lớp *</label><input className="form-control" value={form.className} onChange={F('className')} placeholder="Anh văn K1-2025" /></div>
            <div className="form-group"><label className="form-label">Khóa học *</label>
              <select className="form-control" value={form.course} onChange={F('course')}>
                <option value="">-- Chọn khóa học --</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.courseName}</option>)}
              </select>
            </div>
          </FormRow>
          <FormRow cols={2}>
            <div className="form-group"><label className="form-label">Loại lớp</label><select className="form-control" value={form.classType} onChange={F('classType')}>{Object.entries(CLASS_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Ngày khai giảng *</label><input className="form-control" type="date" value={form.startDate} onChange={F('startDate')} /></div>
          </FormRow>
          <FormRow cols={2}>
            <div className="form-group"><label className="form-label">Sĩ số tối đa</label><input className="form-control" type="number" value={form.maxStudents} onChange={F('maxStudents')} /></div>
            <div className="form-group"><label className="form-label">Trạng thái</label><select className="form-control" value={form.status} onChange={F('status')}>{Object.entries(STATUS_CLASS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
          </FormRow>
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label className="form-label" style={{ margin: 0 }}>Lịch học</label>
              <button type="button" className="btn btn-outline btn-sm" onClick={addSchedule}><Plus size={12} /> Thêm ca</button>
            </div>
            {form.schedule.map((s, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 130px 1fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <select className="form-control" style={{ fontSize: 12 }} value={s.dayOfWeek} onChange={e => updateSchedule(i, 'dayOfWeek', Number(e.target.value))}>{DAY_LABEL.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}</select>
                <select className="form-control" style={{ fontSize: 12 }} value={s.shift} onChange={e => updateSchedule(i, 'shift', e.target.value)}>{Object.entries(SHIFT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                <input className="form-control" style={{ fontSize: 12 }} type="time" value={s.startTime} onChange={e => updateSchedule(i, 'startTime', e.target.value)} />
                <input className="form-control" style={{ fontSize: 12 }} type="time" value={s.endTime} onChange={e => updateSchedule(i, 'endTime', e.target.value)} />
                <input className="form-control" style={{ fontSize: 12 }} value={s.room} onChange={e => updateSchedule(i, 'room', e.target.value)} placeholder="Phòng học" />
                <button type="button" className="btn btn-danger btn-icon btn-sm" onClick={() => removeSchedule(i)} disabled={form.schedule.length === 1}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
          <div className="form-group"><label className="form-label">Ghi chú</label><textarea className="form-control" rows={2} value={form.notes} onChange={F('notes')} /></div>
        </Modal>
      )}

      {modal === 'delete' && selected && (
        <ConfirmModal title="Xóa lớp học" message={`Xóa lớp "${selected.className}"?`} onConfirm={handleDelete} onCancel={() => setModal(null)} danger />
      )}

      {/* Manage Students Modal */}
      {modal === 'students' && selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 880, width: '100%' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Quản lý học viên — {selected.className}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                  {selected.classCode} · {classDetail ? `${classDetail.students?.length || 0} / ${classDetail.maxStudents} chỗ${isFull ? ' — Lớp đã đầy' : ''}` : '...'}
                </p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {studentsLoading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Đang tải...</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700 }}>Đã đăng ký <span style={{ background: 'var(--gold-100)', color: 'var(--gold-800)', padding: '1px 8px', borderRadius: 20, fontSize: 12 }}>{classDetail?.students?.length || 0}</span></h4>
                      {classDetail && <span style={{ fontSize: 12, fontWeight: 600, color: isFull ? 'var(--error)' : 'var(--success)' }}>{isFull ? '⚠ Đã đầy lớp' : `Còn ${classDetail.maxStudents - (classDetail.students?.length || 0)} chỗ`}</span>}
                    </div>
                    <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {!classDetail?.students?.length ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}><Users size={32} style={{ margin: '0 auto 8px', opacity: 0.25 }} />Chưa có học viên nào</div>
                        : classDetail.students.map(s => (
                          <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,var(--gold-200),var(--gold-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{s.fullName?.charAt(0)}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.fullName}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.studentCode} · {s.phone || '—'}</div>
                            </div>
                            <button className="btn btn-danger btn-sm" style={{ gap: 4, padding: '4px 10px', flexShrink: 0 }} onClick={() => handleRemove(s._id, s.fullName)} disabled={enrollLoading === s._id}>
                              {enrollLoading === s._id ? '...' : <><UserMinus size={12} /> Xóa</>}
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Thêm học viên <span style={{ background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '1px 8px', borderRadius: 20, fontSize: 12 }}>{availableStudents.length} chưa trong lớp</span></h4>
                    <div style={{ position: 'relative', marginBottom: 10 }}>
                      <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <input className="form-control" style={{ paddingLeft: 32, fontSize: 13 }} value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Tìm theo tên, mã HV, SĐT..." />
                    </div>
                    {isFull && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#991b1b' }}>⚠ Lớp đã đầy. Tăng sĩ số tối đa để thêm học viên.</div>}
                    <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {availableStudents.length === 0 ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}><Search size={28} style={{ margin: '0 auto 8px', opacity: 0.2 }} />{studentSearch ? 'Không tìm thấy' : 'Tất cả học viên đã trong lớp'}</div>
                        : availableStudents.map(s => (
                          <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'var(--gray-500)', flexShrink: 0 }}>{s.fullName?.charAt(0)}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.fullName}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.studentCode} · {s.phone || '—'}</div>
                            </div>
                            <button className="btn btn-primary btn-sm" style={{ gap: 4, padding: '5px 12px', flexShrink: 0 }} onClick={() => handleEnroll(s._id)} disabled={enrollLoading === s._id || isFull}>
                              {enrollLoading === s._id ? '...' : <><UserPlus size={12} /> Thêm</>}
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setModal(null)}>Đóng</button></div>
          </div>
        </div>
      )}
    </>
  );
}
