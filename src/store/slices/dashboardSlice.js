import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { studentService, tuitionService, attendanceService, classService, courseService } from '../../services/index.js';
import { addNotification } from './notificationSlice.js';

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchAll',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const [stuRes, tuiRes, attRes, clsRes, ovdRes, clsAllRes] = await Promise.allSettled([
        studentService.getStats(),
        tuitionService.getStats(),
        attendanceService.getStats(),
        classService.getAll({ limit: 5, status: 'ongoing' }),
        tuitionService.getAll({ limit: 5, status: 'overdue' }),
        classService.getAll({ limit: 200 }),
      ]);

      const stuData   = stuRes.status   === 'fulfilled' ? stuRes.value.data.data   : null;
      const tuiData   = tuiRes.status   === 'fulfilled' ? tuiRes.value.data.data   : null;
      const attData   = attRes.status   === 'fulfilled' ? attRes.value.data.data   : null;
      const clsData   = clsRes.status   === 'fulfilled' ? clsRes.value.data.data   : [];
      const ovdData   = ovdRes.status   === 'fulfilled' ? ovdRes.value.data.data   : [];
      const clsAll    = clsAllRes.status === 'fulfilled' ? clsAllRes.value.data.data : [];

      // KPI
      const stuTotal      = stuData?.total ?? 0;
      const monthlyRevenue = tuiData?.monthlyRevenue ?? 0;
      const todaySessions  = attData?.todaySessions ?? 0;
      const tuiStats       = tuiData?.stats ?? [];
      const overdueCount   = tuiStats.find(x => x._id === 'overdue')?.count ?? 0;
      const pendingCount   = tuiStats.find(x => x._id === 'pending')?.count ?? 0;
      const ongoingClasses = clsAll.filter(c => c.status === 'ongoing').length;

      // Tuition pie
      const PIE_COLORS = { paid: '#10b981', pending: '#f59e0b', overdue: '#ef4444', partial: '#3b82f6', waived: '#8b5cf6' };
      const LABELS = { paid: 'Đã đóng', pending: 'Chưa đóng', overdue: 'Quá hạn', partial: '1 phần', waived: 'Miễn' };
      const tuitionPie = tuiStats.map(x => ({
        name: LABELS[x._id] || x._id, value: x.count,
        color: PIE_COLORS[x._id] || '#8b5cf6', amount: x.totalAmount ?? 0,
      }));

      // Student status donut
      const STU_LABEL = { active: 'Đang học', inactive: 'Ngừng học', graduated: 'Tốt nghiệp', suspended: 'Tạm dừng' };
      const STU_COLOR = { active: '#10b981', inactive: '#a1a1aa', graduated: '#f59e0b', suspended: '#ef4444' };
      const studentStatus = (stuData?.stats ?? []).map(x => ({
        name: STU_LABEL[x._id] || x._id, value: x.count, color: STU_COLOR[x._id] || '#3b82f6',
      }));

      // Class status dist
      const dist = clsAll.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});
      const STATUS_LABEL = { upcoming: 'Sắp khai giảng', ongoing: 'Đang học', completed: 'Đã kết thúc', cancelled: 'Đã hủy' };
      const classStatus = Object.entries(dist).map(([k, v]) => ({ name: STATUS_LABEL[k] || k, value: v }));

      // Alerts: overdue tuitions dispatch notification
      if (overdueCount > 0) {
        dispatch(addNotification({
          type: 'error', title: 'Học phí quá hạn',
          message: `Có ${overdueCount} phiếu học phí đã quá hạn cần xử lý`,
          icon: 'alert-circle',
        }));
      }

      return {
        kpi: { students: stuTotal, classes: ongoingClasses, monthlyRevenue, todaySessions, overdueCount, pendingCount },
        tuitionPie, studentStatus, classStatus,
        recentClasses: clsData, overdueList: ovdData,
      };
    } catch (err) {
      return rejectWithValue('Lỗi tải dữ liệu dashboard');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    kpi: { students: 0, classes: 0, monthlyRevenue: 0, todaySessions: 0, overdueCount: 0, pendingCount: 0 },
    tuitionPie: [], studentStatus: [], classStatus: [],
    recentClasses: [], overdueList: [],
    loading: false, lastFetched: null, error: null,
  },
  reducers: {
    invalidate: (state) => { state.lastFetched = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDashboardData.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.lastFetched = Date.now();
        Object.assign(state, payload);
      })
      .addCase(fetchDashboardData.rejected, (state, { payload }) => {
        state.loading = false; state.error = payload;
      });
  },
});

export const { invalidate } = dashboardSlice.actions;
export default dashboardSlice.reducer;
