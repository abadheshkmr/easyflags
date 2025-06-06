import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import flagsReducer from './slices/flagsSlice';
import tenantsReducer from './slices/tenantsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    flags: flagsReducer,
    tenants: tenantsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 