import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { courseService } from '../../services/index.js';
import { addNotification } from './notificationSlice.js';

export const fetchCourses = createAsyncThunk(
  'courses/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await courseService.getAll(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi tải khóa học');
    }
  }
);

export const createCourse = createAsyncThunk(
  'courses/create',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await courseService.create(formData);
      dispatch(addNotification({ type: 'success', title: 'Thêm khóa học', message: `Đã thêm khóa học "${formData.courseName}"`, icon: 'book-plus' }));
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Thêm khóa học thất bại');
    }
  }
);

export const updateCourse = createAsyncThunk(
  'courses/update',
  async ({ id, data: formData }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await courseService.update(id, formData);
      dispatch(addNotification({ type: 'info', title: 'Cập nhật khóa học', message: `Đã cập nhật "${formData.courseName}"`, icon: 'pencil' }));
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Cập nhật thất bại');
    }
  }
);

export const deleteCourse = createAsyncThunk(
  'courses/delete',
  async ({ id, name }, { dispatch, rejectWithValue }) => {
    try {
      await courseService.delete(id);
      dispatch(addNotification({ type: 'warning', title: 'Xóa khóa học', message: `Đã xóa khóa học "${name}"`, icon: 'trash' }));
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Xóa thất bại');
    }
  }
);

const coursesSlice = createSlice({
  name: 'courses',
  initialState: {
    list: [], total: 0, totalPages: 1, page: 1, search: '',
    loading: false, error: null,
  },
  reducers: {
    setPage: (state, { payload }) => { state.page = payload; },
    setSearch: (state, { payload }) => { state.search = payload; state.page = 1; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => { state.loading = true; })
      .addCase(fetchCourses.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload.data; state.total = payload.total; state.totalPages = payload.totalPages;
      })
      .addCase(fetchCourses.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
      .addCase(createCourse.fulfilled, (state, { payload }) => { state.list.unshift(payload); state.total += 1; })
      .addCase(updateCourse.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex(c => c._id === payload._id);
        if (idx !== -1) state.list[idx] = payload;
      })
      .addCase(deleteCourse.fulfilled, (state, { payload }) => {
        state.list = state.list.filter(c => c._id !== payload);
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export const { setPage, setSearch } = coursesSlice.actions;
export default coursesSlice.reducer;
