import api from './api.js';

// ─── Auth ────────────────────────────────────────────────
export const authService = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
};

// ─── Students ────────────────────────────────────────────
export const studentService = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.patch(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  getStats: () => api.get('/students/stats'),
};

// ─── Courses ─────────────────────────────────────────────
export const courseService = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.patch(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

// ─── Classes ─────────────────────────────────────────────
export const classService = {
  getAll: (params) => api.get('/classes', { params }),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.patch(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
  enrollStudent: (classId, studentId) => api.post(`/classes/${classId}/enroll`, { studentId }),
  removeStudent: (classId, studentId) => api.delete(`/classes/${classId}/students/${studentId}`),
};

// ─── Attendance ──────────────────────────────────────────
export const attendanceService = {
  getByClass: (classId, params) => api.get(`/attendance/class/${classId}`, { params }),
  getByStudent: (studentId, params) => api.get(`/attendance/student/${studentId}`, { params }),
  create: (data) => api.post('/attendance', data),
  update: (id, data) => api.patch(`/attendance/${id}`, data),
  getStats: () => api.get('/attendance/stats'),
};

// ─── Tuition ─────────────────────────────────────────────
export const tuitionService = {
  getAll: (params) => api.get('/tuition', { params }),
  getById: (id) => api.get(`/tuition/${id}`),
  create: (data) => api.post('/tuition', data),
  updateStatus: (id, data) => api.patch(`/tuition/${id}/status`, data),
  getStats: () => api.get('/tuition/stats'),
};
