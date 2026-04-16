import { configureStore } from '@reduxjs/toolkit';
import notificationsReducer from './slices/notificationSlice.js';
import studentsReducer from './slices/studentsSlice.js';
import tuitionReducer from './slices/tuitionSlice.js';
import coursesReducer from './slices/coursesSlice.js';
import classesReducer from './slices/classesSlice.js';
import dashboardReducer from './slices/dashboardSlice.js';

export const store = configureStore({
  reducer: {
    notifications: notificationsReducer,
    students: studentsReducer,
    tuition: tuitionReducer,
    courses: coursesReducer,
    classes: classesReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
