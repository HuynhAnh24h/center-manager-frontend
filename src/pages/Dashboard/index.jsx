import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, BookOpen, CalendarDays, CreditCard,
  TrendingUp, ClipboardCheck, AlertCircle,
  CheckCircle2, GraduationCap, Clock,
} from 'lucide-react';
import Topbar from '../../components/layout/Topbar.jsx';
import { studentService, tuitionService, attendanceService, classService, courseService } from '../../services/index.js';
import { formatCurrency, formatDate, STATUS_CLASS } from '../../utils/helpers.js';

// ── Colour tokens ──────────────────────────────────────────
const GOLD    = '#f59e0b';
const GREEN   = '#10b981';
const BLUE    = '#3b82f6';
const RED     = '#ef4444';
const PURPLE  = '#8b5cf6';
const PIE_COLORS = { paid: GREEN, pending: GOLD, overdue: RED, partial: BLUE, waived: PURPLE };

// ── Custom tooltips ────────────────────────────────────────
const TipRevenue = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', boxShadow:'var(--shadow-md)', fontSize:13 }}>
      <p style={{ fontWeight:700, marginBottom:4 }}>{label}</p>
      <p style={{ color:GOLD }}>Doanh thu: {formatCurrency(payload[0]?.value)}</p>
    </div>
  );
};

const TipStudents = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', boxShadow:'var(--shadow-md)', fontSize:13 }}>
      <p style={{ fontWeight:700, marginBottom:4 }}>{label}</p>
      <p style={{ color:BLUE }}>Học viên: {payload[0]?.value}</p>
    </div>
  );
};

// ── Loading skeleton ───────────────────────────────────────
const Skeleton = ({ w='100%', h=16, r=6 }) => (
  <div className="skeleton" style={{ width:w, height:h, borderRadius:r }} />
);

// ── Stat card ──────────────────────────────────────────────
function KpiCard({ icon, bg, value, label, sub, subColor = 'var(--text-secondary)', loading }) {
  return (
    <div className="stat-card">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ width:46, height:46, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {icon}
        </div>
      </div>
      {loading
        ? <><Skeleton h={28} w="60%" r={4} /><Skeleton h={14} w="80%" r={4} style={{ marginTop:6 }} /></>
        : <>
            <div style={{ fontSize:28, fontWeight:800, color:'var(--text-primary)', lineHeight:1, marginBottom:4 }}>{value}</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)', fontWeight:500 }}>{label}</div>
            {sub && <div style={{ fontSize:12, marginTop:6, fontWeight:600, color:subColor }}>{sub}</div>}
          </>
      }
    </div>
  );
}

// ── Section header ─────────────────────────────────────────
const SectionTitle = ({ children, right }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
    <h3 style={{ fontSize:16, fontWeight:800, color:'var(--text-primary)' }}>{children}</h3>
    {right}
  </div>
);

// ══════════════════════════════════════════════════════════
export default function Dashboard() {
  const [loading,      setLoading]      = useState(true);
  const [kpi,          setKpi]          = useState({ students:0, classes:0, courses:0, sessions:0, monthlyRevenue:0, overdueCount:0, pendingCount:0 });
  const [tuitionPie,   setTuitionPie]   = useState([]);
  const [studentStatus,setStudentStatus]= useState([]);
  const [classStatus,  setClassStatus]  = useState([]);
  const [recentClasses,setRecentClasses]= useState([]);
  const [overdueList,  setOverdueList]  = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [stuRes, tuiRes, attRes, clsRes, crsRes, ovdRes, clsAllRes] = await Promise.allSettled([
          studentService.getStats(),
          tuitionService.getStats(),
          attendanceService.getStats(),
          classService.getAll({ limit: 3, status: 'ongoing' }),
          courseService.getAll({ limit: 1 }),
          tuitionService.getAll({ limit: 5, status: 'overdue' }),
          classService.getAll({ limit: 100 }),
        ]);

        // KPI
        const stuTotal = stuRes.status === 'fulfilled' ? stuRes.value.data.data.total : 0;
        const mRev     = tuiRes.status === 'fulfilled' ? tuiRes.value.data.data.monthlyRevenue : 0;
        const todaySess= attRes.status === 'fulfilled' ? attRes.value.data.data.todaySessions : 0;
        const crsTotal = crsRes.status === 'fulfilled' ? crsRes.value.data.total : 0;

        // tuition stats
        let overdueCount = 0, pendingCount = 0;
        if (tuiRes.status === 'fulfilled') {
          const ts = tuiRes.value.data.data.stats || [];
          overdueCount = ts.find(x => x._id === 'overdue')?.count || 0;
          pendingCount = ts.find(x => x._id === 'pending')?.count || 0;
          setTuitionPie(ts.map(x => ({
            name: { paid:'Đã đóng', pending:'Chưa đóng', overdue:'Quá hạn', partial:'1 phần', waived:'Miễn' }[x._id] || x._id,
            value: x.count,
            color: PIE_COLORS[x._id] || PURPLE,
            amount: x.totalAmount,
          })));
        }

        // Class count
        let ongoingCount = 0;
        if (clsAllRes.status === 'fulfilled') {
          const all = clsAllRes.value.data.data;
          ongoingCount = all.filter(c => c.status === 'ongoing').length;
          // class status distribution
          const dist = all.reduce((acc, c) => { acc[c.status] = (acc[c.status]||0)+1; return acc; }, {});
          setClassStatus(Object.entries(dist).map(([k,v]) => ({ name: STATUS_CLASS[k]?.label || k, value: v })));
        }

        setKpi({ students:stuTotal, classes:ongoingCount, courses:crsTotal, sessions:todaySess, monthlyRevenue:mRev, overdueCount, pendingCount });

        // Student status
        if (stuRes.status === 'fulfilled') {
          const LABEL = { active:'Đang học', inactive:'Ngừng học', graduated:'Tốt nghiệp', suspended:'Tạm dừng' };
          const COLOR = { active:GREEN, inactive:'var(--gray-400)', graduated:GOLD, suspended:RED };
          setStudentStatus(stuRes.value.data.data.stats.map(x => ({
            name: LABEL[x._id] || x._id, value: x.count, color: COLOR[x._id] || BLUE
          })));
        }

        // Recent ongoing classes
        if (clsRes.status === 'fulfilled') setRecentClasses(clsRes.value.data.data);

        // Overdue tuitions
        if (ovdRes.status === 'fulfilled') setOverdueList(ovdRes.value.data.data);

      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Mock monthly data (replace with real API if you add aggregate endpoint)
  const monthlyData = [
    { month:'T1', revenue:28000000, students:12 },
    { month:'T2', revenue:32000000, students:15 },
    { month:'T3', revenue:27000000, students:11 },
    { month:'T4', revenue:38000000, students:18 },
    { month:'T5', revenue:42000000, students:20 },
    { month:'T6', revenue:35000000, students:16 },
  ];

  return (
    <>
      <Topbar title="Tổng quan" subtitle={`Cập nhật lúc ${formatDate(new Date(), 'HH:mm dd/MM/yyyy')}`} />

      <div className="page-body">

        {/* ══════════════════════════════
            ROW 1 — KPI Cards
            ══════════════════════════════ */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
          <KpiCard loading={loading}
            icon={<Users size={22} color={GOLD} />} bg="var(--gold-100)"
            value={kpi.students.toLocaleString('vi-VN')} label="Tổng học viên"
            sub="↑ Đang hoạt động" subColor={GREEN}
          />
          <KpiCard loading={loading}
            icon={<CalendarDays size={22} color={GREEN} />} bg="#ecfdf5"
            value={kpi.classes} label="Lớp đang học"
            sub={kpi.sessions > 0 ? `${kpi.sessions} buổi hôm nay` : 'Không có buổi hôm nay'}
            subColor={kpi.sessions > 0 ? GREEN : 'var(--text-muted)'}
          />
          <KpiCard loading={loading}
            icon={<CreditCard size={22} color={PURPLE} />} bg="#f5f3ff"
            value={formatCurrency(kpi.monthlyRevenue)} label="Doanh thu tháng này"
            sub={kpi.overdueCount > 0 ? `⚠ ${kpi.overdueCount} phiếu quá hạn` : 'Không có phiếu quá hạn'}
            subColor={kpi.overdueCount > 0 ? RED : GREEN}
          />
          <KpiCard loading={loading}
            icon={<BookOpen size={22} color={BLUE} />} bg="#eff6ff"
            value={kpi.courses} label="Khóa học"
            sub={kpi.pendingCount > 0 ? `${kpi.pendingCount} chưa đóng HP` : 'HP cập nhật đầy đủ'}
            subColor={kpi.pendingCount > 0 ? GOLD : GREEN}
          />
        </div>

        {/* ══════════════════════════════
            ROW 2 — Revenue chart + Tuition Pie
            ══════════════════════════════ */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20, marginBottom:20 }}>

          {/* Area chart: doanh thu 6 tháng */}
          <div className="card">
            <div className="card-header" style={{ paddingBottom:0 }}>
              <SectionTitle right={
                <span style={{ fontSize:12, color:'var(--text-muted)', background:'var(--gold-50)', border:'1px solid var(--gold-200)', borderRadius:20, padding:'3px 12px' }}>
                  Dữ liệu mẫu 6 tháng
                </span>
              }>
                Biểu đồ doanh thu
              </SectionTitle>
            </div>
            <div style={{ padding:'0 24px 20px' }}>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={GOLD} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={GOLD} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize:12, fill:'var(--text-secondary)' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1e6}tr`}/>
                  <Tooltip content={<TipRevenue/>}/>
                  <Area type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2.5} fill="url(#revGrad)"
                    dot={{ fill:GOLD, r:4, strokeWidth:0 }} activeDot={{ r:6, fill:GOLD }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie: tuition status */}
          <div className="card">
            <div className="card-header" style={{ paddingBottom:0 }}>
              <SectionTitle>Tình trạng học phí</SectionTitle>
            </div>
            <div style={{ padding:'0 12px 16px' }}>
              {loading ? (
                <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Skeleton w={160} h={160} r="50%" />
                </div>
              ) : tuitionPie.length === 0 ? (
                <div style={{ height:180, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:13 }}>Chưa có dữ liệu</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={tuitionPie} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value">
                      {tuitionPie.map((e,i) => <Cell key={i} fill={e.color}/>)}
                    </Pie>
                    <Tooltip formatter={(v,n,p) => [v+' phiếu', p.payload.name]}/>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
              {/* Amount breakdown */}
              {!loading && tuitionPie.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:4 }}>
                  {tuitionPie.map((e,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 10px', borderRadius:8, background:`${e.color}10`, border:`1px solid ${e.color}25` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:e.color, flexShrink:0 }}/>
                        <span style={{ fontSize:12, fontWeight:600 }}>{e.name}</span>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <span style={{ fontSize:12, fontWeight:700, color:e.color }}>{e.value}</span>
                        {e.amount > 0 && <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:6 }}>{formatCurrency(e.amount)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════
            ROW 3 — Bar chart + Student pie
            ══════════════════════════════ */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, marginBottom:20 }}>

          {/* Bar: monthly students */}
          <div className="card">
            <div className="card-header" style={{ paddingBottom:0 }}>
              <SectionTitle>Học viên mới theo tháng</SectionTitle>
            </div>
            <div style={{ padding:'0 24px 20px' }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyData} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize:12, fill:'var(--text-secondary)' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<TipStudents/>} cursor={{ fill:'var(--gold-50)' }}/>
                  <Bar dataKey="students" name="Học viên" fill={GOLD} radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut: student status */}
          <div className="card">
            <div className="card-header" style={{ paddingBottom:0 }}>
              <SectionTitle>Trạng thái học viên</SectionTitle>
            </div>
            <div style={{ padding:'0 16px 16px' }}>
              {loading ? (
                <div style={{ height:140, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Skeleton w={120} h={120} r="50%"/>
                </div>
              ) : studentStatus.length === 0 ? (
                <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:13 }}>Chưa có dữ liệu</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie data={studentStatus} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                        {studentStatus.map((e,i) => <Cell key={i} fill={e.color}/>)}
                      </Pie>
                      <Tooltip formatter={(v,_,p) => [v+' học viên', p.payload.name]}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:6 }}>
                    {studentStatus.map((e,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 8px', borderRadius:8, background:`${e.color}10` }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:e.color, flexShrink:0 }}/>
                        <div>
                          <div style={{ fontSize:13, fontWeight:800, color:e.color }}>{e.value}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{e.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════
            ROW 4 — Recent classes + Overdue alerts
            ══════════════════════════════ */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

          {/* Recent ongoing classes */}
          <div className="card">
            <div className="card-header" style={{ paddingBottom:12 }}>
              <SectionTitle>Lớp đang học</SectionTitle>
            </div>
            <div style={{ padding:'0 0 8px' }}>
              {loading ? (
                <div style={{ padding:'0 24px' }}>{[...Array(3)].map((_,i) => <Skeleton key={i} h={52} r={10} style={{ marginBottom:8 }}/>)}</div>
              ) : recentClasses.length === 0 ? (
                <div style={{ padding:'30px 24px', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Không có lớp nào đang học</div>
              ) : recentClasses.map((c) => (
                <div key={c._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 24px', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:'var(--gold-50)', border:'1.5px solid var(--gold-200)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <GraduationCap size={18} color={GOLD}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.className}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:1 }}>
                      {c.classCode} · {c.students?.length ?? 0}/{c.maxStudents} học viên
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:GREEN, background:'#ecfdf5', padding:'2px 8px', borderRadius:10 }}>Đang học</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{formatDate(c.startDate)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue tuition alerts */}
          <div className="card">
            <div className="card-header" style={{ paddingBottom:12 }}>
              <SectionTitle right={
                kpi.overdueCount > 0 && (
                  <span style={{ background:'#fef2f2', color:RED, border:'1px solid #fecaca', fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20 }}>
                    {kpi.overdueCount} quá hạn
                  </span>
                )
              }>
                Cảnh báo học phí
              </SectionTitle>
            </div>
            <div style={{ padding:'0 0 8px' }}>
              {loading ? (
                <div style={{ padding:'0 24px' }}>{[...Array(3)].map((_,i) => <Skeleton key={i} h={52} r={10} style={{ marginBottom:8 }}/>)}</div>
              ) : overdueList.length === 0 ? (
                <div style={{ padding:'30px 24px', textAlign:'center' }}>
                  <CheckCircle2 size={32} color={GREEN} style={{ margin:'0 auto 8px' }}/>
                  <p style={{ fontSize:13, color:'var(--text-secondary)', fontWeight:600 }}>Tất cả học phí đã được đóng!</p>
                </div>
              ) : overdueList.map((t) => (
                <div key={t._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 24px', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:'#fef2f2', border:'1.5px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <AlertCircle size={18} color={RED}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {t.student?.fullName}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:1 }}>
                      {t.student?.studentCode} · {t.class?.className}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:RED }}>{formatCurrency(t.finalAmount)}</div>
                    <div style={{ fontSize:11, color:RED, marginTop:2 }}>Hạn: {formatDate(t.dueDate)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
