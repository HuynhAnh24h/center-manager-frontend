import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tuitionService } from '../../services/index.js';
import { addNotification } from './notificationSlice.js';

export const fetchTuitions = createAsyncThunk(
  'tuition/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await tuitionService.getAll(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi tải học phí');
    }
  }
);

export const fetchTuitionStats = createAsyncThunk(
  'tuition/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await tuitionService.getStats();
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const updateTuitionStatus = createAsyncThunk(
  'tuition/updateStatus',
  async ({ id, data: updateData, studentName, amount }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await tuitionService.updateStatus(id, updateData);
      if (updateData.status === 'paid') {
        dispatch(addNotification({
          type: 'success',
          title: 'Thu học phí',
          message: `${studentName} đã đóng học phí thành công`,
          icon: 'credit-card',
        }));
      }
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Cập nhật thất bại');
    }
  }
);

export const createTuition = createAsyncThunk(
  'tuition/create',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await tuitionService.create(formData);
      dispatch(addNotification({
        type: 'success',
        title: 'Tạo phiếu học phí',
        message: 'Đã tạo phiếu học phí mới thành công',
        icon: 'file-plus',
      }));
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Tạo phiếu thất bại');
    }
  }
);

const tuitionSlice = createSlice({
  name: 'tuition',
  initialState: {
    list: [],
    total: 0,
    totalPages: 1,
    page: 1,
    search: '',
    statusFilter: '',
    stats: null,
    loading: false,
    statsLoading: false,
    updating: null,
    error: null,
  },
  reducers: {
    setPage: (state, { payload }) => { state.page = payload; },
    setSearch: (state, { payload }) => { state.search = payload; state.page = 1; },
    setStatusFilter: (state, { payload }) => { state.statusFilter = payload; state.page = 1; },
    setUpdating: (state, { payload }) => { state.updating = payload; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTuitions.pending, (state) => { state.loading = true; })
      .addCase(fetchTuitions.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload.data;
        state.total = payload.total;
        state.totalPages = payload.totalPages;
      })
      .addCase(fetchTuitions.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      .addCase(fetchTuitionStats.pending, (state) => { state.statsLoading = true; })
      .addCase(fetchTuitionStats.fulfilled, (state, { payload }) => {
        state.statsLoading = false;
        state.stats = payload;
      })
      .addCase(fetchTuitionStats.rejected, (state) => { state.statsLoading = false; })
      .addCase(updateTuitionStatus.pending, (state, { meta }) => { state.updating = meta.arg.id; })
      .addCase(updateTuitionStatus.fulfilled, (state, { payload }) => {
        state.updating = null;
        const idx = state.list.findIndex(t => t._id === payload._id);
        if (idx !== -1) state.list[idx] = payload;
      })
      .addCase(updateTuitionStatus.rejected, (state) => { state.updating = null; })
      .addCase(createTuition.fulfilled, (state, { payload }) => {
        state.list.unshift(payload);
        state.total += 1;
      });
  },
});

export const { setPage, setSearch, setStatusFilter, setUpdating, clearError } = tuitionSlice.actions;
export default tuitionSlice.reducer;
