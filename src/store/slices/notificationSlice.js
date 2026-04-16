import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    isOpen: false,
  },
  reducers: {
    addNotification: (state, { payload }) => {
      const note = {
        id: Date.now() + Math.random(),
        read: false,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      state.items.unshift(note);
      if (state.items.length > 50) state.items = state.items.slice(0, 50);
      state.unreadCount += 1;
    },
    markRead: (state, { payload }) => {
      const item = state.items.find(n => n.id === payload);
      if (item && !item.read) {
        item.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.items.forEach(n => { n.read = true; });
      state.unreadCount = 0;
    },
    removeNotification: (state, { payload }) => {
      const idx = state.items.findIndex(n => n.id === payload);
      if (idx !== -1) {
        if (!state.items[idx].read) state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.items.splice(idx, 1);
      }
    },
    clearAll: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
    togglePanel: (state) => {
      state.isOpen = !state.isOpen;
    },
    closePanel: (state) => {
      state.isOpen = false;
    },
  },
});

export const {
  addNotification, markRead, markAllRead,
  removeNotification, clearAll, togglePanel, closePanel,
} = notificationSlice.actions;

export default notificationSlice.reducer;
