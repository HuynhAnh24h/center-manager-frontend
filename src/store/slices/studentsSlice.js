import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { studentService } from '../../services/index.js';
import { addNotification } from './notificationSlice.js';

// ── Thunks ──────────────────────────────────────────────────────────────────
export const fetchStudents = createAsyncThunk(
  'students/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await studentService.getAll(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi tải học viên');
    }
  }
);

export const fetchStudentStats = createAsyncThunk(
  'students/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await studentService.getStats();
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi tải thống kê');
    }
  }
);

export const createStudent = createAsyncThunk(
  'students/create',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await studentService.create(formData);
      dispatch(addNotification({
        type: 'success',
        title: 'Thêm học viên',
        message: `Đã thêm học viên ${formData.fullName} thành công`,
        icon: 'user-plus',
      }));
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Thêm học viên thất bại');
    }
  }
);

export const updateStudent = createAsyncThunk(
  'students/update',
  async ({ id, data: formData }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await studentService.update(id, formData);
      dispatch(addNotification({
        type: 'info',
        title: 'Cập nhật học viên',
        message: `Đã cập nhật thông tin ${formData.fullName}`,
        icon: 'pencil',
      }));
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Cập nhật thất bại');
    }
  }
);

export const deleteStudent = createAsyncThunk(
  'students/delete',
  async ({ id, name }, { dispatch, rejectWithValue }) => {
    try {
      await studentService.delete(id);
      dispatch(addNotification({
        type: 'warning',
        title: 'Xóa học viên',
        message: `Đã xóa học viên ${name} khỏi hệ thống`,
        icon: 'trash',
      }));
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Xóa thất bại');
    }
  }
);

// ── Slice ───────────────────────────────────────────────────────────────────
const studentsSlice = createSlice({
  name: 'students',
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
    error: null,
  },
  reducers: {
    setPage: (state, { payload }) => { state.page = payload; },
    setSearch: (state, { payload }) => { state.search = payload; state.page = 1; },
    setStatusFilter: (state, { payload }) => { state.statusFilter = payload; state.page = 1; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchStudents
      .addCase(fetchStudents.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchStudents.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload.data;
        state.total = payload.total;
        state.totalPages = payload.totalPages;
      })
      .addCase(fetchStudents.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      // fetchStats
      .addCase(fetchStudentStats.pending, (state) => { state.statsLoading = true; })
      .addCase(fetchStudentStats.fulfilled, (state, { payload }) => {
        state.statsLoading = false;
        state.stats = payload;
      })
      .addCase(fetchStudentStats.rejected, (state) => { state.statsLoading = false; })
      // create
      .addCase(createStudent.fulfilled, (state, { payload }) => {
        state.list.unshift(payload);
        state.total += 1;
      })
      // update
      .addCase(updateStudent.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex(s => s._id === payload._id);
        if (idx !== -1) state.list[idx] = payload;
      })
      // delete
      .addCase(deleteStudent.fulfilled, (state, { payload }) => {
        state.list = state.list.filter(s => s._id !== payload);
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export const { setPage, setSearch, setStatusFilter, clearError } = studentsSlice.actions;
export default studentsSlice.reducer;
