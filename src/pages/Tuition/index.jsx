import React, { useEffect, useState, useCallback } from 'react';
import { Plus, CreditCard, CheckCircle2, AlertCircle, Clock, Download, FileSpreadsheet, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../../components/layout/Topbar.jsx';
import { Badge, Modal, Pagination, SearchInput, EmptyState, LoadingRows, PageHeader, FormRow } from '../../components/common/index.jsx';
import { tuitionService, studentService, classService, courseService } from '../../services/index.js';
import { formatDate, formatCurrency, STATUS_TUITION, debounce } from '../../utils/helpers.js';

const PAYMENT_METHODS = { cash:'Tiền mặt', bank_transfer:'Chuyển khoản', momo:'MoMo', vnpay:'VNPay', other:'Khác' };

// ── Excel export (pure browser, no server needed) ──────────
// Uses SheetJS via CDN — we build the XLSX manually with CSV fallback
const exportToExcel = async (rows, filename, sheetName) => {
  // Build CSV content (universal fallback that opens in Excel)
  const headers = Object.keys(rows[0] || {});
  const csv = [
    '\uFEFF' + headers.join(','), // BOM for UTF-8 in Excel
    ...rows.map(r => headers.map(h => {
      const v = String(r[h] ?? '').replace(/"/g, '""');
      return v.includes(',') || v.includes('\n') || v.includes('"') ? `"${v}"` : v;
    }).join(','))
  ].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Fetch ALL records for a given status (all pages) ───────
const fetchAllByStatus = async (status) => {
  let all = [], page = 1, totalPages = 1;
  do {
    const { data } = await tuitionService.getAll({ page, limit: 200, status });
    all = [...all, ...data.data];
    totalPages = data.totalPages;
    page++;
  } while (page <= totalPages);
  return all;
};

const mapRow = (t, label) => ({
  'Mã phiếu':          t.receiptCode || '',
  'Trạng thái':        label,
  'Mã học viên':       t.student?.studentCode || '',
  'Họ và tên':         t.student?.fullName || '',
  'SĐT học viên':      t.student?.phone || '',
  'Lớp học':           t.class?.className || '',
  'Mã lớp':            t.class?.classCode || '',
  'Khóa học':          t.course?.courseName || '',
  'Học phí':           t.amount || 0,
  'Giảm giá':          t.discount || 0,
  'Thực thu':          t.finalAmount || 0,
  'Hạn đóng':          t.dueDate   ? formatDate(t.dueDate)   : '',
  'Ngày đóng':         t.paidDate  ? formatDate(t.paidDate)  : '',
  'Hình thức TT':      PAYMENT_METHODS[t.paymentMethod] || '',
  'Ghi chú':           t.notes || '',
});

// ── Export dropdown ─────────────────────────────────────────
function ExportMenu() {
  const [open,        setOpen]        = useState(false);
  const [exporting,   setExporting]   = useState(null); // 'paid'|'overdue'|'pending'|'all'

  const handleExport = async (type) => {
    setOpen(false);
    setExporting(type);
    toast('Đang xuất dữ liệu...', { icon: '⏳' });
    try {
      let rows = [];
      if (type === 'all') {
        const [paid, overdue, pending, partial, waived] = await Promise.all([
          fetchAllByStatus('paid'),
          fetchAllByStatus('overdue'),
          fetchAllByStatus('pending'),
          fetchAllByStatus('partial'),
          fetchAllByStatus('waived'),
        ]);
        rows = [
          ...paid.map(t    => mapRow(t, 'Đã đóng')),
          ...overdue.map(t => mapRow(t, 'Quá hạn')),
          ...pending.map(t => mapRow(t, 'Chưa đóng')),
          ...partial.map(t => mapRow(t, 'Đóng 1 phần')),
          ...waived.map(t  => mapRow(t, 'Miễn HP')),
        ];
      } else {
        const LABEL = { paid:'Đã đóng', overdue:'Quá hạn', pending:'Chưa đóng', partial:'Đóng 1 phần' };
        const data = await fetchAllByStatus(type);
        rows = data.map(t => mapRow(t, LABEL[type]));
      }

      if (!rows.length) { toast.error('Không có dữ liệu để xuất'); return; }

      const FILE_NAME = {
        paid:    'HocPhi_DaDong',
        overdue: 'HocPhi_QuaHan',
        pending: 'HocPhi_ChuaDong',
        partial: 'HocPhi_DongMotPhan',
        all:     'HocPhi_TatCa',
      }[type];

      await exportToExcel(rows, FILE_NAME, FILE_NAME);
      toast.success(`Xuất ${rows.length} bản ghi thành công!`);
    } catch (e) {
      toast.error('Xuất file thất bại: ' + (e.message || ''));
    } finally {
      setExporting(null);
    }
  };

  const MENU = [
    { key:'paid',    icon:'✅', label:'Đã đóng học phí',       color:'#10b981' },
    { key:'pending', icon:'⏳', label:'Chưa đóng học phí',     color:'#f59e0b' },
    { key:'overdue', icon:'❌', label:'Học phí quá hạn',        color:'#ef4444' },
    { key:'partial', icon:'🔶', label:'Đóng 1 phần',            color:'#3b82f6' },
    null, // divider
    { key:'all',     icon:'📋', label:'Xuất tất cả (mọi TT)',  color:'#8b5cf6' },
  ];

  return (
    <div style={{ position:'relative' }}>
      <button
        className="btn btn-outline"
        style={{ gap:6 }}
        onClick={() => setOpen(!open)}
        disabled={!!exporting}
      >
        <FileSpreadsheet size={15} color="#10b981" />
        {exporting ? 'Đang xuất...' : 'Xuất Excel'}
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : '', transition:'transform 0.2s' }}/>
      </button>

      {open && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:90 }} onClick={() => setOpen(false)} />
          <div style={{
            position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:100,
            background:'#fff', border:'1px solid var(--border)', borderRadius:12,
            boxShadow:'var(--shadow-lg)', minWidth:230, padding:'6px 0', overflow:'hidden',
          }}>
            <div style={{ padding:'8px 14px 6px', fontSize:11, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', color:'var(--text-muted)' }}>
              Xuất báo cáo học phí
            </div>
            {MENU.map((item, i) =>
              !item ? (
                <div key={i} style={{ height:1, background:'var(--border)', margin:'4px 0' }}/>
              ) : (
                <button
                  key={item.key}
                  onClick={() => handleExport(item.key)}
                  style={{
                    display:'flex', alignItems:'center', gap:10, width:'100%',
                    padding:'9px 14px', background:'none', border:'none',
                    fontSize:13, fontWeight:500, cursor:'pointer', textAlign:'left',
                    transition:'background 0.12s',
                    color: exporting === item.key ? 'var(--text-muted)' : 'var(--text-primary)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--gold-50)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  disabled={!!exporting}
                >
                  <span style={{ fontSize:15 }}>{item.icon}</span>
                  <span style={{ flex:1 }}>{item.label}</span>
                  <Download size={13} color={item.color}/>
                </button>
              )
            )}
            <div style={{ padding:'6px 14px 8px', fontSize:11, color:'var(--text-muted)', borderTop:'1px solid var(--border)', marginTop:4 }}>
              Định dạng .csv, mở được bằng Excel
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function TuitionPage() {
  const [tuitions,    setTuitions]    = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [statusFilter,setStatusFilter]= useState('');
  const [loading,     setLoading]     = useState(true);
  const [stats,       setStats]       = useState({ stats:[], monthlyRevenue:0 });
  const [modal,       setModal]       = useState(null);
  const [selected,    setSelected]    = useState(null);
  const [saving,      setSaving]      = useState(false);

  const [students, setStudents] = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [courses,  setCourses]  = useState([]);
  const [form,     setForm]     = useState({ student:'', class:'', course:'', amount:'', discount:0, dueDate:'', notes:'' });
  const [payForm,  setPayForm]  = useState({ status:'paid', paymentMethod:'cash', paidDate:new Date().toISOString().slice(0,10), notes:'' });

  const fetchTuitions = useCallback(async (p=1, st='') => {
    setLoading(true);
    try {
      const { data } = await tuitionService.getAll({ page:p, limit:10, status: st||undefined });
      setTuitions(data.data); setTotal(data.total); setTotalPages(data.totalPages);
    } catch { toast.error('Lỗi tải học phí'); }
    finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    try { const { data } = await tuitionService.getStats(); setStats(data.data); } catch {}
  }, []);

  useEffect(() => { fetchTuitions(1, statusFilter); fetchStats(); }, [statusFilter]);
  useEffect(() => { fetchTuitions(page, statusFilter); }, [page]);
  useEffect(() => {
    studentService.getAll({ limit:500 }).then(({ data }) => setStudents(data.data)).catch(()=>{});
    classService.getAll({ limit:200 }).then(({ data }) => setClasses(data.data)).catch(()=>{});
    courseService.getAll({ limit:200 }).then(({ data }) => setCourses(data.data)).catch(()=>{});
  }, []);

  const openCreate = () => { setForm({ student:'', class:'', course:'', amount:'', discount:0, dueDate:'', notes:'' }); setModal('create'); };
  const openPay    = (t) => {
    setSelected(t);
    setPayForm({ status:'paid', paymentMethod:'cash', paidDate:new Date().toISOString().slice(0,10), notes:'' });
    setModal('pay');
  };

  const handleCreate = async () => {
    if (!form.student||!form.class||!form.course||!form.amount||!form.dueDate) return toast.error('Vui lòng điền đủ thông tin');
    setSaving(true);
    try {
      await tuitionService.create(form);
      toast.success('Tạo phiếu học phí thành công!');
      setModal(null); fetchTuitions(page, statusFilter); fetchStats();
    } catch (e) { toast.error(e.response?.data?.message||'Lỗi tạo phiếu'); }
    finally { setSaving(false); }
  };

  const handlePay = async () => {
    setSaving(true);
    try {
      await tuitionService.updateStatus(selected._id, payForm);
      toast.success('Cập nhật học phí thành công!');
      setModal(null); fetchTuitions(page, statusFilter); fetchStats();
    } catch { toast.error('Lỗi cập nhật'); }
    finally { setSaving(false); }
  };

  const handleCourseChange = (courseId) => {
    const c = courses.find(x => x._id===courseId);
    setForm({ ...form, course:courseId, amount:c?.fee||'' });
  };

  const statMap = (stats.stats||[]).reduce((acc,s) => { acc[s._id]=s; return acc; }, {});

  return (
    <>
      <Topbar title="Quản lý học phí" subtitle="Theo dõi tình trạng đóng học phí"/>
      <div className="page-body">
        <PageHeader
          title="Danh sách học phí"
          actions={
            <div style={{ display:'flex', gap:10 }}>
              <ExportMenu />
              <button className="btn btn-primary" onClick={openCreate}><Plus size={15}/> Tạo phiếu</button>
            </div>
          }
        />

        {/* ── Stats 5 ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
          {[
            { key:'paid',    label:'Đã đóng',      icon:<CheckCircle2 size={16} color="#10b981"/>, bg:'#ecfdf5', color:'#10b981' },
            { key:'pending', label:'Chưa đóng',     icon:<Clock        size={16} color="#f59e0b"/>, bg:'#fffbeb', color:'#f59e0b' },
            { key:'overdue', label:'Quá hạn',       icon:<AlertCircle  size={16} color="#ef4444"/>, bg:'#fef2f2', color:'#ef4444' },
            { key:'partial', label:'Đóng 1 phần',   icon:<CreditCard   size={16} color="#3b82f6"/>, bg:'#eff6ff', color:'#3b82f6' },
            { special:true,  label:'DT tháng này',  icon:<CreditCard   size={16} color="var(--gold-600)"/>, bg:'var(--gold-50)', color:'var(--gold-700)' },
          ].map((s,i) => (
            <div key={i} style={{ background:s.bg, border:`1px solid ${s.color}25`, borderRadius:12, padding:'14px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                {s.icon}
                <span style={{ fontSize:12, fontWeight:600, color:s.color }}>{s.label}</span>
              </div>
              <div style={{ fontSize:20, fontWeight:800, color:s.color }}>
                {s.special ? formatCurrency(stats.monthlyRevenue) : (statMap[s.key]?.count ?? 0)}
              </div>
              {!s.special && statMap[s.key] && statMap[s.key].totalAmount > 0 && (
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                  {formatCurrency(statMap[s.key].totalAmount)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Filter ── */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
          <select className="form-control" style={{ width:200 }} value={statusFilter} onChange={e=>{ setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_TUITION).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{total} phiếu</span>
        </div>

        {/* ── Table ── */}
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Mã phiếu</th>
                  <th>Học viên</th>
                  <th>Lớp học</th>
                  <th>Học phí</th>
                  <th>Giảm giá</th>
                  <th>Thực thu</th>
                  <th>Hạn đóng</th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                  <th style={{ textAlign:'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <LoadingRows cols={10} rows={6}/> : tuitions.length===0 ? (
                  <tr><td colSpan={10}><EmptyState message="Chưa có phiếu học phí nào"/></td></tr>
                ) : tuitions.map(t => (
                  <tr key={t._id}>
                    <td><span style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color:'var(--gold-700)' }}>{t.receiptCode}</span></td>
                    <td>
                      <div style={{ fontWeight:600, fontSize:13 }}>{t.student?.fullName}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{t.student?.studentCode} · {t.student?.phone}</div>
                    </td>
                    <td>
                      <div style={{ fontSize:13 }}>{t.class?.className||'—'}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{t.course?.courseName}</div>
                    </td>
                    <td style={{ fontSize:13 }}>{formatCurrency(t.amount)}</td>
                    <td style={{ fontSize:13, color:t.discount>0?'#10b981':'var(--text-muted)' }}>
                      {t.discount>0 ? `-${formatCurrency(t.discount)}` : '—'}
                    </td>
                    <td style={{ fontWeight:800, fontSize:14, color:'var(--gold-700)' }}>{formatCurrency(t.finalAmount)}</td>
                    <td style={{ fontSize:13 }}>
                      <div>{formatDate(t.dueDate)}</div>
                      {t.status==='overdue' && <div style={{ fontSize:11, color:'#ef4444', fontWeight:600 }}>Đã quá hạn</div>}
                    </td>
                    <td><Badge {...STATUS_TUITION[t.status]}/></td>
                    <td style={{ fontSize:12 }}>
                      {t.paidDate
                        ? <><div>{formatDate(t.paidDate)}</div><div style={{ color:'var(--text-muted)' }}>{PAYMENT_METHODS[t.paymentMethod]}</div></>
                        : '—'
                      }
                    </td>
                    <td>
                      <div style={{ display:'flex', justifyContent:'flex-end', gap:4 }}>
                        {(t.status==='pending'||t.status==='overdue'||t.status==='partial') && (
                          <button className="btn btn-primary btn-sm" onClick={() => openPay(t)} style={{ gap:4 }}>
                            <CheckCircle2 size={13}/> Thu tiền
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage}/>
        </div>
      </div>

      {/* ── Create modal ── */}
      {modal==='create' && (
        <Modal title="Tạo phiếu học phí" onClose={()=>setModal(null)} size="md"
          footer={<><button className="btn btn-outline" onClick={()=>setModal(null)}>Hủy</button><button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving?'Đang lưu...':'Tạo phiếu'}</button></>}>
          <div className="form-group">
            <label className="form-label">Học viên *</label>
            <select className="form-control" value={form.student} onChange={e=>setForm({...form,student:e.target.value})}>
              <option value="">— Chọn học viên —</option>
              {students.map(s=><option key={s._id} value={s._id}>{s.studentCode} — {s.fullName}</option>)}
            </select>
          </div>
          <FormRow cols={2}>
            <div className="form-group">
              <label className="form-label">Lớp học *</label>
              <select className="form-control" value={form.class} onChange={e=>setForm({...form,class:e.target.value})}>
                <option value="">— Chọn lớp —</option>
                {classes.map(c=><option key={c._id} value={c._id}>{c.className}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Khóa học *</label>
              <select className="form-control" value={form.course} onChange={e=>handleCourseChange(e.target.value)}>
                <option value="">— Chọn khóa học —</option>
                {courses.map(c=><option key={c._id} value={c._id}>{c.courseName} — {formatCurrency(c.fee)}</option>)}
              </select>
            </div>
          </FormRow>
          <FormRow cols={2}>
            <div className="form-group">
              <label className="form-label">Học phí (VND) *</label>
              <input className="form-control" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="3500000"/>
            </div>
            <div className="form-group">
              <label className="form-label">Giảm giá (VND)</label>
              <input className="form-control" type="number" value={form.discount} onChange={e=>setForm({...form,discount:e.target.value})} placeholder="0"/>
            </div>
          </FormRow>
          {form.amount && (
            <div style={{ background:'var(--gold-50)', border:'1px solid var(--gold-200)', borderRadius:8, padding:'10px 14px', marginBottom:12, fontSize:14 }}>
              <span style={{ color:'var(--text-secondary)' }}>Thực thu: </span>
              <span style={{ fontWeight:800, color:'var(--gold-700)' }}>
                {formatCurrency((Number(form.amount)||0)-(Number(form.discount)||0))}
              </span>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Hạn đóng *</label>
            <input className="form-control" type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Ghi chú</label>
            <textarea className="form-control" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
          </div>
        </Modal>
      )}

      {/* ── Pay modal ── */}
      {modal==='pay' && selected && (
        <Modal title="Thu học phí" onClose={()=>setModal(null)} size="sm"
          footer={<><button className="btn btn-outline" onClick={()=>setModal(null)}>Hủy</button><button className="btn btn-primary" onClick={handlePay} disabled={saving}>{saving?'Đang lưu...':'Xác nhận thu'}</button></>}>
          <div style={{ background:'var(--gold-50)', border:'1px solid var(--gold-200)', borderRadius:10, padding:'14px 16px', marginBottom:16 }}>
            <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:2 }}>
              {selected.student?.fullName} · {selected.class?.className}
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--gold-700)' }}>{formatCurrency(selected.finalAmount)}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Mã: {selected.receiptCode}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Trạng thái</label>
            <select className="form-control" value={payForm.status} onChange={e=>setPayForm({...payForm,status:e.target.value})}>
              {Object.entries(STATUS_TUITION).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Hình thức thanh toán</label>
            <select className="form-control" value={payForm.paymentMethod} onChange={e=>setPayForm({...payForm,paymentMethod:e.target.value})}>
              {Object.entries(PAYMENT_METHODS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Ngày thu</label>
            <input className="form-control" type="date" value={payForm.paidDate} onChange={e=>setPayForm({...payForm,paidDate:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Ghi chú</label>
            <textarea className="form-control" rows={2} value={payForm.notes} onChange={e=>setPayForm({...payForm,notes:e.target.value})}/>
          </div>
        </Modal>
      )}
    </>
  );
}
