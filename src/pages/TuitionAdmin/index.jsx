import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, Clock, AlertCircle, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../../components/layout/Topbar.jsx';
import {
  Badge, Pagination, SearchInput, EmptyState, LoadingRows, PageHeader,
} from '../../components/common/index.jsx';
import { tuitionService } from '../../services/index.js';
import { formatDate, formatCurrency, STATUS_TUITION, debounce } from '../../utils/helpers.js';

const TABS = [
  { key: 'unpaid', label: 'Chưa đóng', icon: <Clock size={14} />, statuses: ['pending', 'overdue', 'partial'] },
  { key: 'paid',   label: 'Đã đóng',   icon: <CheckCircle size={14} />, statuses: ['paid'] },
  { key: 'all',    label: 'Tất cả',    icon: <Filter size={14} />, statuses: [] },
];

export default function TuitionAdminPage() {
  const [tab,        setTab]        = useState('unpaid');
  const [tuitions,   setTuitions]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [stats,      setStats]      = useState(null);
  const [updating,   setUpdating]   = useState(null);

  const fetchStats = async () => {
    try {
      const { data } = await tuitionService.getStats();
      setStats(data.data);
    } catch {}
  };

  const fetchTuitions = useCallback(async (p = 1, s = '', currentTab = 'unpaid') => {
    setLoading(true);
    try {
      const tabConfig = TABS.find(t => t.key === currentTab);
      const statusParam = tabConfig?.statuses?.length === 1 ? tabConfig.statuses[0] : undefined;
      const { data } = await tuitionService.getAll({
        page: p, limit: 15, search: s,
        status: statusParam,
      });

      // For 'unpaid' tab filter client-side among pending/overdue/partial
      let filtered = data.data;
      if (currentTab === 'unpaid') {
        filtered = data.data.filter(t => ['pending', 'overdue', 'partial'].includes(t.status));
      }
      setTuitions(filtered);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Lỗi tải dữ liệu học phí');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchTuitions(1, search, tab);
  }, [tab]);

  useEffect(() => {
    fetchTuitions(page, search, tab);
  }, [page]);

  const debouncedSearch = useCallback(
    debounce((v) => { setPage(1); fetchTuitions(1, v, tab); }, 400), [tab]
  );
  const handleSearch = (v) => { setSearch(v); debouncedSearch(v); };

  const handleMarkPaid = async (tuition) => {
    if (!window.confirm(`Xác nhận học viên "${tuition.student?.fullName}" đã đóng học phí ${formatCurrency(tuition.finalAmount)}?`)) return;
    setUpdating(tuition._id);
    try {
      await tuitionService.updateStatus(tuition._id, { status: 'paid', paymentMethod: 'cash', paidDate: new Date().toISOString() });
      toast.success('Đã cập nhật trạng thái thanh toán!');
      fetchTuitions(page, search, tab);
      fetchStats();
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setUpdating(null);
    }
  };

  // Compute summary from stats
  const statMap = {};
  (stats?.stats || []).forEach(s => { statMap[s._id] = s; });
  const totalPaid   = statMap['paid']?.totalAmount || 0;
  const totalPending = (statMap['pending']?.totalAmount || 0) + (statMap['overdue']?.totalAmount || 0) + (statMap['partial']?.totalAmount || 0);
  const countPaid   = statMap['paid']?.count || 0;
  const countUnpaid = (statMap['pending']?.count || 0) + (statMap['overdue']?.count || 0) + (statMap['partial']?.count || 0);

  return (
    <>
      <Topbar title="Quản trị học phí" subtitle="Theo dõi tình trạng đóng học phí" />
      <div className="page-body">
        <PageHeader title="Tình trạng học phí học viên" />

        {/* Stats overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          <div style={{ padding: '16px 18px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={16} color="#fff" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Đã đóng học phí</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>{formatCurrency(totalPaid)}</div>
            <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>{countPaid} phiếu</div>
          </div>

          <div style={{ padding: '16px 18px', borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={16} color="#fff" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#9a3412', textTransform: 'uppercase' }}>Chưa đóng học phí</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#ea580c' }}>{formatCurrency(totalPending)}</div>
            <div style={{ fontSize: 12, color: '#9a3412', marginTop: 4 }}>{countUnpaid} phiếu</div>
          </div>

          <div style={{ padding: '16px 18px', borderRadius: 12, background: 'var(--gold-50)', border: '1px solid var(--gold-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gold-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Filter size={16} color="#fff" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-800)', textTransform: 'uppercase' }}>Tỷ lệ thu</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold-800)' }}>
              {(totalPaid + totalPending) > 0 ? Math.round(totalPaid / (totalPaid + totalPending) * 100) : 0}%
            </div>
            <div style={{ marginTop: 6, height: 6, background: 'var(--gold-100)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(totalPaid + totalPending) > 0 ? Math.round(totalPaid / (totalPaid + totalPending) * 100) : 0}%`, background: 'var(--gold-500)', borderRadius: 6 }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--gray-100)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: tab === t.key ? 'var(--white)' : 'transparent',
                color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {t.icon} {t.label}
              {t.key === 'unpaid' && countUnpaid > 0 && (
                <span style={{ background: '#ea580c', color: '#fff', borderRadius: 20, padding: '0px 7px', fontSize: 11, fontWeight: 700 }}>{countUnpaid}</span>
              )}
              {t.key === 'paid' && countPaid > 0 && (
                <span style={{ background: '#16a34a', color: '#fff', borderRadius: 20, padding: '0px 7px', fontSize: 11, fontWeight: 700 }}>{countPaid}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <SearchInput value={search} onChange={handleSearch} placeholder="Tìm theo tên học viên, mã lớp..." />
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Lớp học</th>
                  <th>Khóa học</th>
                  <th>Học phí</th>
                  <th>Hạn đóng</th>
                  <th>Trạng thái</th>
                  {tab !== 'paid' && <th style={{ textAlign: 'right' }}>Thao tác</th>}
                  {tab === 'paid' && <th>Ngày đóng</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <LoadingRows cols={tab === 'paid' ? 7 : 7} rows={8} />
                ) : tuitions.length === 0 ? (
                  <tr><td colSpan={7}>
                    <EmptyState message={tab === 'paid' ? 'Chưa có học phí nào đã đóng' : 'Tất cả học phí đã được đóng!'} />
                  </td></tr>
                ) : tuitions.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gold-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--gold-700)', flexShrink: 0 }}>
                          {t.student?.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{t.student?.fullName || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.student?.studentCode} · {t.student?.phone || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.class?.className || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t.class?.classCode}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{t.course?.courseName || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{formatCurrency(t.finalAmount)}</div>
                      {t.discount > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatCurrency(t.amount)}</div>}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      <span style={{ color: t.status === 'overdue' ? '#dc2626' : 'inherit', fontWeight: t.status === 'overdue' ? 700 : 400 }}>
                        {formatDate(t.dueDate)}
                      </span>
                    </td>
                    <td><Badge {...(STATUS_TUITION[t.status] || { label: t.status, cls: 'badge-gray' })} /></td>
                    {tab !== 'paid' && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ gap: 4 }}
                          onClick={() => handleMarkPaid(t)}
                          disabled={updating === t._id}
                        >
                          {updating === t._id ? '...' : <><CheckCircle size={12} /> Đánh dấu đã đóng</>}
                        </button>
                      </td>
                    )}
                    {tab === 'paid' && (
                      <td style={{ fontSize: 13 }}>{formatDate(t.paidDate)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </>
  );
}
