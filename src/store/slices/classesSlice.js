import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { classService } from '../../services/index.js';
import { addNotification } from './notificationSlice.js';

export const fetchClasses = createAsyncThunk(
  'classes/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await classService.getAll(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi tải lớp học');
    }
  }
);

export const createClass = createAsyncThunk(
  'classes/create',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await classService.create(formData);
      dispatch(addNotification({ type: 'success', title: 'Tạo lớp học', message: `Lớp "${formData.className}" đã được tạo`, icon: 'calendar-plus' }));
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Tạo lớp thất bại');
    }
  }
);

export const updateClass = createAsyncThunk(
  'classes/update',
  async ({ id, data: formData }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await classService.update(id, formData);
      dispatch(addNotification({ type: 'info', title: 'Cập nhật lớp học', message: `Đã cập nhật lớp "${formData.className}"`, icon: 'pencil' }));
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Cập nhật thất bại');
    }
  }
);

export const deleteClass = createAsyncThunk(
  'classes/delete',
  async ({ id, name }, { dispatch, rejectWithValue }) => {
    try {
      await classService.delete(id);
      dispatch(addNotification({ type: 'warning', title: 'Xóa lớp học', message: `Đã xóa lớp "${name}"`, icon: 'trash' }));
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Xóa thất bại');
    }
  }
);

export const enrollStudent = createAsyncThunk(
  'classes/enroll',
  async ({ classId, studentId, studentName, className }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await classService.enrollStudent(classId, studentId);
      dispatch(addNotification({ type: 'success', title: 'Thêm học viên', message: `${studentName} đã vào lớp ${className}`, icon: 'user-plus' }));
      return { classId, updatedClass: data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Thêm thất bại');
    }
  }
);

export const removeStudent = createAsyncThunk(
  'classes/removeStudent',
  async ({ classId, studentId, studentName, className }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await classService.removeStudent(classId, studentId);
      dispatch(addNotification({ type: 'warning', title: 'Xóa học viên', message: `${studentName} đã rời lớp ${className}`, icon: 'user-minus' }));
      return { classId, updatedClass: data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Xóa thất bại');
    }
  }
);

const classesSlice = createSlice({
  name: 'classes',
  initialState: {
    list: [], total: 0, totalPages: 1, page: 1,
    search: '', statusFilter: '', shiftFilter: '', typeFilter: '',
    loading: false, error: null,
  },
  reducers: {
    setPage: (state, { payload }) => { state.page = payload; },
    setSearch: (state, { payload }) => { state.search = payload; state.page = 1; },
    setStatusFilter: (state, { payload }) => { state.statusFilter = payload; state.page = 1; },
    setShiftFilter: (state, { payload }) => { state.shiftFilter = payload; state.page = 1; },
    setTypeFilter: (state, { payload }) => { state.typeFilter = payload; state.page = 1; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClasses.pending, (state) => { state.loading = true; })
      .addCase(fetchClasses.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload.data; state.total = payload.total; state.totalPages = payload.totalPages;
      })
      .addCase(fetchClasses.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
      .addCase(createClass.fulfilled, (state, { payload }) => { if (payload) { state.list.unshift(payload); state.total += 1; } })
      .addCase(updateClass.fulfilled, (state, { payload }) => {
        if (payload) { const idx = state.list.findIndex(c => c._id === payload._id); if (idx !== -1) state.list[idx] = payload; }
      })
      .addCase(deleteClass.fulfilled, (state, { payload }) => {
        state.list = state.list.filter(c => c._id !== payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(enrollStudent.fulfilled, (state, { payload }) => {
        if (payload?.updatedClass) {
          const idx = state.list.findIndex(c => c._id === payload.classId);
          if (idx !== -1) state.list[idx] = payload.updatedClass;
        }
      })
      .addCase(removeStudent.fulfilled, (state, { payload }) => {
        if (payload?.updatedClass) {
          const idx = state.list.findIndex(c => c._id === payload.classId);
          if (idx !== -1) state.list[idx] = payload.updatedClass;
        }
      });
  },
});

export const { setPage, setSearch, setStatusFilter, setShiftFilter, setTypeFilter } = classesSlice.actions;
export default classesSlice.reducer;
