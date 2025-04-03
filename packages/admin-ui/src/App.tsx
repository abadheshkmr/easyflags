import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store';
import { getCurrentUser } from './store/slices/authSlice';
import { fetchTenants } from './store/slices/tenantsSlice';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import FlagList from './pages/flags/FlagList';
import FlagDetail from './pages/flags/FlagDetail';
import CreateFlag from './pages/flags/CreateFlag';
import SegmentList from './pages/segments/SegmentList';
import SegmentDetail from './pages/segments/SegmentDetail';
import CreateSegment from './pages/segments/CreateSegment';
import AuditLog from './pages/AuditLog';
import Analytics from './pages/Analytics';
import TenantList from './pages/tenants/TenantList';
import TenantDetail from './pages/tenants/TenantDetail';
import CreateTenant from './pages/tenants/CreateTenant';
import Settings from './pages/Settings';
import Login from './pages/auth/Login';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.auth);
  
  useEffect(() => {
    // Try to load user data if token exists
    if (token) {
      dispatch(getCurrentUser());
      dispatch(fetchTenants());
    }
  }, [dispatch, token]);

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>
      
      {/* Main app routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        
        {/* Feature Flags */}
        <Route path="/flags" element={<FlagList />} />
        <Route path="/flags/create" element={<CreateFlag />} />
        <Route path="/flags/:flagKey" element={<FlagDetail />} />
        
        {/* User Segments */}
        <Route path="/segments" element={<SegmentList />} />
        <Route path="/segments/create" element={<CreateSegment />} />
        <Route path="/segments/:segmentId" element={<SegmentDetail />} />
        
        {/* Audit & Analytics */}
        <Route path="/audit-log" element={<AuditLog />} />
        <Route path="/analytics" element={<Analytics />} />
        
        {/* Tenants */}
        <Route path="/tenants" element={<TenantList />} />
        <Route path="/tenants/create" element={<CreateTenant />} />
        <Route path="/tenants/:tenantId" element={<TenantDetail />} />
        
        {/* Settings & Profile */}
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      
      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App; 