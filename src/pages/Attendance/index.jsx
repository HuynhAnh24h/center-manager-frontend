import React, { useEffect, useState, useCallback } from 'react';
import {
  ClipboardCheck, CheckCircle2, XCircle, Clock, FileQuestion,
  ChevronDown, ChevronLeft, CalendarDays, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../../components/layout/Topbar.jsx';
import { Badge, Modal, EmptyState } from '../../components/common/index.jsx';
import { ShiftBadge, SHIFT_CONFIG } from '../../components/common/ShiftBadge.jsx';
import { attendanceService, classService } from '../../services/index.js';
import { formatDate, STATUS_ATTENDANCE, SHIFT_LABEL, STATUS_CLASS, DAY_LABEL } from '../../utils/helpers.js';

// Shift config is now in ShiftBadge.jsx (shared)

const STATUS_ICONS = {
  present: <CheckCircle2 size={15} color="#10b981" />,
  absent:  <XCircle      size={15} color="#ef4444" />,
  late:    <Clock        size={15} color="#f59e0b" />,
  excused: <FileQuestion size={15} color="#3b82f6" />,
};

const STATUS_BTN_COLOR = {
  present: { active: '#10b981', text: '#fff' },
  absent:  { active: '#ef4444', text: '#fff' },
  late:    { active: '#f59e0b', text: '#fff' },
  excused: { active: '#3b82f6', text: '#fff' },
};

export default function AttendancePage() {
  // ── Phase: 'list' = browse classes | 'detail' = per-class view ──
  const [phase,         setPhase]         = useState('list');

  // ── Class list ────────────────────────────────────────────
  const [classes,       setClasses]       = useState([]);
  const [classesLoading,setClassesLoading]= useState(true);
  const [classSearch,   setClassSearch]   = useState('');

  // ── Selected class detail ─────────────────────────────────
  const [activeClass,   setActiveClass]   = useState(null);   // full class doc
  const [sessions,      setSessions]      = useState([]);
  const [sessionsLoading,setSessionsLoading]=useState(false);
  const [expandedSession,setExpandedSession]=useState(null);

  // ── Take-attendance modal ─────────────────────────────────
  const [modal,         setModal]         = useState(false);
  const [form,          setForm]          = useState({});
  const [saving,        setSaving]        = useState(false);

  // ─────────────────────────────────────────────────────────
  // Load all classes (not filtered by status so teacher sees all)
  useEffect(() => {
    setClassesLoading(true);
    classService.getAll({ limit: 200 })
      .then(({ data }) => setClasses(data.data))
      .catch(() => toast.error('Lỗi tải lớp học'))
      .finally(() => setClassesLoading(false));
  }, []);

  // Load sessions when entering detail phase
  const enterClass = useCallback(async (cls) => {
    setActiveClass(cls);
    setPhase('detail');
    setExpandedSession(null);
    setSessionsLoading(true);
    try {
      // Get full class (with populated students) + sessions
      const [clsRes, attRes] = await Promise.all([
        classService.getById(cls._id),
        attendanceService.getByClass(cls._id, { limit: 100 }),
      ]);
      setActiveClass(clsRes.data.data);
      setSessions(attRes.data.data);
    } catch { toast.error('Lỗi tải dữ liệu điểm danh'); }
    finally { setSessionsLoading(false); }
  }, []);

  const goBack = () => { setPhase('list'); setActiveClass(null); setSessions([]); };

  // ── Open take-attendance modal ────────────────────────────
  const openTake = () => {
    if (!activeClass?.students?.length) return toast.error('Lớp chưa có học viên nào');
    setForm({
      sessionDate:   new Date().toISOString().slice(0, 10),
      sessionNumber: sessions.length + 1,
      shift:         activeClass.schedule?.[0]?.shift || 'morning',
      notes:         '',
      records:       (activeClass.students || []).map((s) => ({
        student:     s._id,
        studentName: s.fullName,
        studentCode: s.studentCode,
        status:      'present',
        note:        '',
      })),
    });
    setModal(true);
  };

  const updateRecord = (idx, field, value) => {
    const r = [...form.records]; r[idx] = { ...r[idx], [field]: value };
    setForm({ ...form, records: r });
  };

  const markAll = (status) => setForm({ ...form, records: form.records.map((r) => ({ ...r, status })) });

  const handleSave = async () => {
    setSaving(true);
    try {
      await attendanceService.create({ ...form, classId: activeClass._id });
      toast.success('Điểm danh thành công!');
      setModal(false);
      const { data } = await attendanceService.getByClass(activeClass._id, { limit: 100 });
      setSessions(data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi điểm danh');
    } finally { setSaving(false); }
  };

  // ── Filtered class list ───────────────────────────────────
  const filteredClasses = classes.filter((c) => {
    if (!classSearch) return true;
    const q = classSearch.toLowerCase();
    return c.className.toLowerCase().includes(q) || c.classCode.toLowerCase().includes(q);
  });

  // ── Attendance summary for a class ───────────────────────
  const getStats = (sessionList) =>
    sessionList.reduce((acc, s) => {
      s.records?.forEach((r) => { acc[r.status] = (acc[r.status] || 0) + 1; });
      return acc;
    }, { present: 0, absent: 0, late: 0, excused: 0 });

  const stats = getStats(sessions);

  // ─────────────────────────────────────────────────────────
  return (
    <>
      <Topbar
        title={phase === 'list' ? 'Quản lý điểm danh' : `Điểm danh — ${activeClass?.className}`}
        subtitle={phase === 'list' ? 'Chọn lớp học để xem và điểm danh' : `${activeClass?.classCode} · ${sessions.length} buổi đã điểm danh`}
      />

      <div className="page-body">

        {/* ════════════════════════════════
            PHASE: LIST — Browse classes
            ════════════════════════════════ */}
        {phase === 'list' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Chọn lớp để điểm danh</h2>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', maxWidth: 320, marginBottom: 16 }}>
              <input
                className="form-control"
                style={{ paddingLeft: 12 }}
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc mã lớp..."
              />
            </div>

            {classesLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                {[...Array(6)].map((_, i) => <div key={i} className="card" style={{ height: 140 }}><div className="skeleton" style={{ height: '100%' }} /></div>)}
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="card"><EmptyState message="Không tìm thấy lớp học nào" /></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 14 }}>
                {filteredClasses.map((c) => (
                  <div
                    key={c._id}
                    className="card"
                    style={{ cursor: 'pointer', transition: 'transform 0.18s, box-shadow 0.18s', overflow: 'hidden' }}
                    onClick={() => enterClass(c)}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                  >
                    {/* Top accent */}
                    <div style={{ height: 4, background: c.status === 'ongoing' ? 'linear-gradient(90deg,#10b981,#059669)' : c.status === 'upcoming' ? 'linear-gradient(90deg,#3b82f6,#2563eb)' : 'linear-gradient(90deg,var(--gray-300),var(--gray-400))' }} />

                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{c.className}</div>
                          <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--gold-700)', fontWeight: 700 }}>{c.classCode}</div>
                        </div>
                        <Badge {...STATUS_CLASS[c.status]} />
                      </div>

                      {/* Schedule chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                        {(c.schedule || []).map((s, i) => (
                          <span key={i} style={{ background: SHIFT_CONFIG[s.shift]?.bg || '#f3f4f6', color: SHIFT_CONFIG[s.shift]?.text || '#374151', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                            {SHIFT_CONFIG[s.shift]?.Icon && React.createElement(SHIFT_CONFIG[s.shift].Icon, { size: 11 })} {DAY_LABEL[s.dayOfWeek]} {s.startTime}–{s.endTime}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-secondary)' }}>
                          <Users size={13} color="var(--gold-500)" />
                          {c.students?.length ?? 0} học viên
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-secondary)' }}>
                          <CalendarDays size={13} color="var(--gold-500)" />
                          {c.course?.courseName || 'Chưa có khóa học'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════
            PHASE: DETAIL — Per-class view
            ════════════════════════════════ */}
        {phase === 'detail' && activeClass && (
          <>
            {/* Back button + action */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <button className="btn btn-outline btn-sm" onClick={goBack} style={{ gap: 6 }}>
                <ChevronLeft size={15} /> Quay lại danh sách lớp
              </button>
              <button className="btn btn-primary" onClick={openTake} style={{ gap: 6 }}>
                <ClipboardCheck size={15} /> Điểm danh buổi mới
              </button>
            </div>

            {/* Class info banner */}
            <div className="card" style={{ marginBottom: 18, padding: '18px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>{activeClass.className}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {activeClass.classCode} · {activeClass.course?.courseName}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {(activeClass.schedule || []).map((s, i) => (
                      <span key={i} style={{ background: SHIFT_CONFIG[s.shift]?.bg || '#f3f4f6', color: SHIFT_CONFIG[s.shift]?.text || '#374151', padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {SHIFT_CONFIG[s.shift]?.Icon && React.createElement(SHIFT_CONFIG[s.shift].Icon, { size: 12 })} {DAY_LABEL[s.dayOfWeek]} {s.startTime}–{s.endTime}{s.room ? ` · ${s.room}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  {[
                    { label: 'Học viên', value: activeClass.students?.length ?? 0, sub: `/ ${activeClass.maxStudents} chỗ`, color: 'var(--gold-700)' },
                    { label: 'Đã điểm danh', value: sessions.length, sub: 'buổi', color: '#3b82f6' },
                  ].map(({ label, value, sub, color }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats mini row */}
            {sessions.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
                {[
                  { key: 'present', label: 'Có mặt',  color: '#10b981', bg: '#ecfdf5' },
                  { key: 'absent',  label: 'Vắng',     color: '#ef4444', bg: '#fef2f2' },
                  { key: 'late',    label: 'Muộn',     color: '#f59e0b', bg: '#fffbeb' },
                  { key: 'excused', label: 'Có phép',  color: '#3b82f6', bg: '#eff6ff' },
                ].map(({ key, label, color, bg }) => (
                  <div key={key} style={{ background: bg, border: `1px solid ${color}25`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, background: `${color}18`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {STATUS_ICONS[key]}
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{stats[key]}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sessions accordion */}
            <div className="card">
              <div style={{ padding: '16px 22px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Lịch sử điểm danh</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sessions.length} buổi</span>
              </div>

              {sessionsLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>
              ) : sessions.length === 0 ? (
                <div style={{ padding: '50px 24px', textAlign: 'center' }}>
                  <ClipboardCheck size={40} color="var(--gold-300)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Chưa có buổi điểm danh nào</p>
                  <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={openTake}>
                    <ClipboardCheck size={15} /> Điểm danh buổi đầu tiên
                  </button>
                </div>
              ) : sessions.map((session) => {
                const presentCount = session.records?.filter((r) => r.status === 'present').length || 0;
                const totalCount   = session.records?.length || 0;
                const pct          = totalCount ? Math.round((presentCount / totalCount) * 100) : 0;
                const isExpanded   = expandedSession === session._id;

                return (
                  <div key={session._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {/* Session row */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', padding: '13px 22px', cursor: 'pointer' }}
                      onClick={() => setExpandedSession(isExpanded ? null : session._id)}
                    >
                      {/* Session number badge */}
                      <div style={{ width: 36, height: 36, background: 'var(--gold-50)', border: '2px solid var(--gold-200)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: 'var(--gold-700)', flexShrink: 0, marginRight: 14 }}>
                        {session.sessionNumber}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>Buổi {session.sessionNumber} — {formatDate(session.sessionDate)}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                          {session.shift && (
                            <ShiftBadge shift={session.shift} />
                          )}
                          <span>{presentCount}/{totalCount} có mặt</span>
                          {session.takenBy && <span>· {session.takenBy.name}</span>}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 14 }}>
                        <div style={{ height: 6, width: 90, background: 'var(--gray-100)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444', borderRadius: 3, transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, minWidth: 32, color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>{pct}%</span>
                      </div>

                      <ChevronDown size={16} color="var(--text-muted)" style={{ flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
                    </div>

                    {/* Expanded: per-student records */}
                    {isExpanded && (
                      <div style={{ background: 'var(--gray-50)', borderTop: '1px solid var(--border)', padding: '14px 22px 16px' }}>
                        {session.notes && (
                          <div style={{ background: 'var(--gold-50)', border: '1px solid var(--gold-200)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: 'var(--gold-800)' }}>
                            📝 {session.notes}
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 8 }}>
                          {(session.records || []).map((r, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '8px 12px', background: 'white', borderRadius: 8,
                              border: `1px solid ${r.status === 'present' ? '#d1fae5' : r.status === 'absent' ? '#fecaca' : r.status === 'late' ? '#fde68a' : '#bfdbfe'}`,
                            }}>
                              {STATUS_ICONS[r.status]}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {r.student?.fullName || '—'}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.student?.studentCode}</div>
                              </div>
                              <Badge {...STATUS_ATTENDANCE[r.status]} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════
          Take Attendance Modal
          ══════════════════════════════════════ */}
      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 680, width: '100%' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Điểm danh buổi {form.sessionNumber}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{activeClass?.className}</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Session info row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Ngày học</label>
                  <input className="form-control" type="date" value={form.sessionDate} onChange={(e) => setForm({ ...form, sessionDate: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Ca học</label>
                  <select className="form-control" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
                    {Object.entries(SHIFT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Số buổi</label>
                  <input className="form-control" type="number" value={form.sessionNumber} onChange={(e) => setForm({ ...form, sessionNumber: Number(e.target.value) })} min={1} />
                </div>
              </div>

              {/* Quick actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  Danh sách học viên ({form.records?.length || 0})
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn-sm" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', gap: 4 }} onClick={() => markAll('present')}>
                    <CheckCircle2 size={12} /> Tất cả có mặt
                  </button>
                  <button type="button" className="btn btn-sm" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', gap: 4 }} onClick={() => markAll('absent')}>
                    <XCircle size={12} /> Tất cả vắng
                  </button>
                </div>
              </div>

              {/* Student records */}
              <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(form.records || []).map((r, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10, border: '1.5px solid',
                    borderColor: r.status === 'present' ? '#a7f3d0' : r.status === 'absent' ? '#fecaca' : r.status === 'late' ? '#fde68a' : '#bfdbfe',
                    background:  r.status === 'present' ? '#f0fdf4'   : r.status === 'absent' ? '#fef2f2'  : r.status === 'late' ? '#fffbeb'  : '#eff6ff',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}>
                    {/* Avatar */}
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: 'var(--gold-700)', flexShrink: 0 }}>
                      {(r.studentName || '?').charAt(0)}
                    </div>
                    {/* Name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.studentName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.studentCode}</div>
                    </div>
                    {/* Status buttons */}
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {Object.entries(STATUS_ATTENDANCE).map(([k, v]) => {
                        const isActive = r.status === k;
                        const c = STATUS_BTN_COLOR[k];
                        return (
                          <button key={k} type="button"
                            onClick={() => updateRecord(i, 'status', k)}
                            style={{
                              padding: '4px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                              border: `1.5px solid ${c.active}`, cursor: 'pointer', transition: 'all 0.12s',
                              background: isActive ? c.active : 'transparent',
                              color: isActive ? c.text : c.active,
                              minWidth: 58,
                            }}
                          >{v.label}</button>
                        );
                      })}
                    </div>
                    {/* Note */}
                    <input
                      className="form-control"
                      style={{ width: 110, fontSize: 12, flexShrink: 0 }}
                      value={r.note}
                      onChange={(e) => updateRecord(i, 'note', e.target.value)}
                      placeholder="Ghi chú..."
                    />
                  </div>
                ))}
              </div>

              <div className="form-group" style={{ marginTop: 14, marginBottom: 0 }}>
                <label className="form-label">Ghi chú buổi học</label>
                <input className="form-control" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Nội dung buổi học, nhận xét chung..." />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : <><ClipboardCheck size={14} /> Lưu điểm danh</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
