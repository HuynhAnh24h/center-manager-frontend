import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, BookOpen, CalendarDays, CreditCard, CheckCircle2, GraduationCap, AlertCircle } from 'lucide-react';
import Topbar from '../../components/layout/Topbar.jsx';
import { fetchDashboardData } from '../../store/slices/dashboardSlice.js';
import { formatCurrency, formatDate } from '../../utils/helpers.js';

const GOLD = '#f59e0b', GREEN = '#10b981', BLUE = '#3b82f6', RED = '#ef4444', PURPLE = '#8b5cf6';

const TipRevenue = ({ active, payload, label }) => !active || !payload?.length ? null : (
  <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', boxShadow:'var(--shadow-md)', fontSize:13 }}>
    <p style={{ fontWeight:700, marginBottom:4 }}>{label}</p>
    <p style={{ color:GOLD }}>Doanh thu: {formatCurrency(payload[0]?.value)}</p>
  </div>
);
const TipStudents = ({ active, payload, label }) => !active || !payload?.length ? null : (
  <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', boxShadow:'var(--shadow-md)', fontSize:13 }}>
    <p style={{ fontWeight:700, marginBottom:4 }}>{label}</p>
    <p style={{ color:BLUE }}>Học viên: {payload[0]?.value}</p>
  </div>
);
const Sk = ({ w='100%', h=16, r=6, style={} }) => <div className="skeleton" style={{ width:w, height:h, borderRadius:r, ...style }} />;

function KpiCard({ icon, bg, value, label, sub, subColor='var(--text-secondary)', loading }) {
  return (
    <div className="stat-card">
      <div style={{ display:'flex', marginBottom:14 }}>
        <div style={{ width:46, height:46, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</div>
      </div>
      {loading ? (<><Sk h={28} w="60%" r={4} style={{ marginBottom:6 }} /><Sk h={14} w="80%" r={4} /></>) : (
        <>
          <div style={{ fontSize:28, fontWeight:800, color:'var(--text-primary)', lineHeight:1, marginBottom:4 }}>{value}</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', fontWeight:500 }}>{label}</div>
          {sub && <div style={{ fontSize:12, marginTop:6, fontWeight:600, color:subColor }}>{sub}</div>}
        </>
      )}
    </div>
  );
}

const SectionTitle = ({ children, right }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
    <h3 style={{ fontSize:16, fontWeight:800, color:'var(--text-primary)' }}>{children}</h3>
    {right}
  </div>
);

const MONTHLY_DATA = [
  { month:'T1', revenue:28000000, students:12 }, { month:'T2', revenue:32000000, students:15 },
  { month:'T3', revenue:27000000, students:11 }, { month:'T4', revenue:38000000, students:18 },
  { month:'T5', revenue:42000000, students:20 }, { month:'T6', revenue:35000000, students:16 },
];

export default function Dashboard() {
  const dispatch = useDispatch();
  const { loading, kpi, tuitionPie, studentStatus, recentClasses, overdueList } = useSelector(s => s.dashboard);
  useEffect(() => { dispatch(fetchDashboardData()); }, [dispatch]);

  return (
    <>
      <Topbar title="Tổng quan" subtitle={`Cập nhật lúc ${formatDate(new Date(), 'HH:mm dd/MM/yyyy')}`} />
      <div className="page-body">

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
          <KpiCard loading={loading} icon={<Users size={22} color={GOLD} />} bg="var(--gold-100)" value={kpi.students.toLocaleString('vi-VN')} label="Tổng học viên" sub="↑ Đang hoạt động" subColor={GREEN} />
          <KpiCard loading={loading} icon={<CalendarDays size={22} color={GREEN} />} bg="#ecfdf5" value={kpi.classes} label="Lớp đang học" sub={kpi.todaySessions > 0 ? `${kpi.todaySessions} buổi hôm nay` : 'Không có buổi hôm nay'} subColor={kpi.todaySessions > 0 ? GREEN : 'var(--text-muted)'} />
          <KpiCard loading={loading} icon={<CreditCard size={22} color={PURPLE} />} bg="#f5f3ff" value={formatCurrency(kpi.monthlyRevenue)} label="Doanh thu tháng này" sub={kpi.overdueCount > 0 ? `⚠ ${kpi.overdueCount} phiếu quá hạn` : 'Không có phiếu quá hạn'} subColor={kpi.overdueCount > 0 ? RED : GREEN} />
          <KpiCard loading={loading} icon={<BookOpen size={22} color={BLUE} />} bg="#eff6ff" value={kpi.pendingCount} label="HP chưa đóng" sub={kpi.pendingCount > 0 ? 'Cần xử lý sớm' : 'Học phí cập nhật đầy đủ'} subColor={kpi.pendingCount > 0 ? GOLD : GREEN} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20, marginBottom:20 }}>
          <div className="card">
            <div className="card-header" style={{ paddingBottom:0 }}>
              <SectionTitle right={<span style={{ fontSize:12, color:'var(--text-muted)', background:'var(--gold-50)', border:'1px solid var(--gold-200)', borderRadius:20, padding:'3px 12px' }}>Dữ liệu mẫu 6 tháng</span>}>Biểu đồ doanh thu</SectionTitle>
            </div>
            <div style={{ padding:'0 24px 20px' }}>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={MONTHLY_DATA}>
                  <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={GOLD} stopOpacity={0.2}/><stop offset="95%" stopColor={GOLD} stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize:12, fill:'var(--text-secondary)' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1e6}tr`}/>
                  <Tooltip content={<TipRevenue/>}/>
                  <Area type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill:GOLD, r:4, strokeWidth:0 }} activeDot={{ r:6, fill:GOLD }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header" style={{ paddingBottom:0 }}><SectionTitle>Tình trạng học phí</SectionTitle></div>
            <div style={{ padding:'0 12px 16px' }}>
              {loading ? <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center' }}><Sk w={160} h={160} r="50%" /></div>
               : tuitionPie.length === 0 ? <div style={{ height:180, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:13 }}>Chưa có dữ liệu</div>
               : <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={tuitionPie} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value">{tuitionPie.map((e,i) => <Cell key={i} fill={e.color}/>)}</Pie><Tooltip formatter={(v,n,p) => [v+' phiếu', p.payload.name]}/><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }}/></PieChart></ResponsiveContainer>}
              {!loading && tuitionPie.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:4 }}>
                  {tuitionPie.map((e,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 10px', borderRadius:8, background:`${e.color}10`, border:`1px solid ${e.color}25` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}><div style={{ width:8, height:8, borderRadius:'50%', background:e.color }}/><span style={{ fontSize:12, fontWeight:600 }}>{e.name}</span></div>
                      <div><span style={{ fontSize:12, fontWeight:700, color:e.color }}>{e.value}</span>{e.amount>0&&<span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:6 }}>{formatCurrency(e.amount)}</span>}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, marginBottom:20 }}>
          <div className="card">
            <div className="card-header" style={{ paddingBottom:0 }}><SectionTitle>Học viên mới theo tháng</SectionTitle></div>
            <div style={{ padding:'0 24px 20px' }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={MONTHLY_DATA} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize:12, fill:'var(--text-secondary)' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<TipStudents/>} cursor={{ fill:'var(--gold-50)' }}/>
                  <Bar dataKey="students" name="Học viên" fill={GOLD} radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header" style={{ paddingBottom:0 }}><SectionTitle>Trạng thái học viên</SectionTitle></div>
            <div style={{ padding:'0 16px 16px' }}>
              {loading ? <div style={{ height:140, display:'flex', alignItems:'center', justifyContent:'center' }}><Sk w={120} h={120} r="50%"/></div>
               : studentStatus.length === 0 ? <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:13 }}>Chưa có dữ liệu</div>
               : <><ResponsiveContainer width="100%" height={130}><PieChart><Pie data={studentStatus} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">{studentStatus.map((e,i) => <Cell key={i} fill={e.color}/>)}</Pie><Tooltip formatter={(v,_,p) => [v+' học viên', p.payload.name]}/></PieChart></ResponsiveContainer>
               <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:6 }}>{studentStatus.map((e,i) => (<div key={i} style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 8px', borderRadius:8, background:`${e.color}10` }}><div style={{ width:8, height:8, borderRadius:'50%', background:e.color }}/><div><div style={{ fontSize:13, fontWeight:800, color:e.color }}>{e.value}</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>{e.name}</div></div></div>))}</div></>}
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div className="card">
            <div className="card-header" style={{ paddingBottom:12 }}><SectionTitle>Lớp đang học</SectionTitle></div>
            <div style={{ padding:'0 0 8px' }}>
              {loading ? <div style={{ padding:'0 24px' }}>{[...Array(3)].map((_,i) => <Sk key={i} h={52} r={10} style={{ marginBottom:8 }}/>)}</div>
               : recentClasses.length === 0 ? <div style={{ padding:'30px 24px', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Không có lớp nào đang học</div>
               : recentClasses.map(c => (
                <div key={c._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 24px', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:'var(--gold-50)', border:'1.5px solid var(--gold-200)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><GraduationCap size={18} color={GOLD}/></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.className}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:1 }}>{c.classCode} · {c.students?.length ?? 0}/{c.maxStudents} học viên</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:GREEN, background:'#ecfdf5', padding:'2px 8px', borderRadius:10 }}>Đang học</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{formatDate(c.startDate)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header" style={{ paddingBottom:12 }}>
              <SectionTitle right={kpi.overdueCount > 0 && <span style={{ background:'#fef2f2', color:RED, border:'1px solid #fecaca', fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20 }}>{kpi.overdueCount} quá hạn</span>}>Cảnh báo học phí</SectionTitle>
            </div>
            <div style={{ padding:'0 0 8px' }}>
              {loading ? <div style={{ padding:'0 24px' }}>{[...Array(3)].map((_,i) => <Sk key={i} h={52} r={10} style={{ marginBottom:8 }}/>)}</div>
               : overdueList.length === 0 ? <div style={{ padding:'30px 24px', textAlign:'center' }}><CheckCircle2 size={32} color={GREEN} style={{ margin:'0 auto 8px' }}/><p style={{ fontSize:13, color:'var(--text-secondary)', fontWeight:600 }}>Tất cả học phí đã được đóng!</p></div>
               : overdueList.map(t => (
                <div key={t._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 24px', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:'#fef2f2', border:'1.5px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><AlertCircle size={18} color={RED}/></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.student?.fullName}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:1 }}>{t.student?.studentCode} · {t.class?.className}</div>
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
