import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { Spinner } from './components/ui';
import Login from './pages/Login';
import ForcePasswordChange from './pages/ForcePasswordChange';
import type { Role } from './api/types';

// Keep the import thunks so we can both lazy-render and warm the chunks.
const importDashboard = () => import('./pages/Dashboard');
const importMonitoring = () => import('./pages/Monitoring');
const importEmployees = () => import('./pages/Employees');
const importProfile = () => import('./pages/EmployeeProfile');
const importDepartments = () => import('./pages/Departments');

const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(importDashboard);
const Monitoring = lazy(importMonitoring);
const Employees = lazy(importEmployees);
const EmployeeProfile = lazy(importProfile);
const Departments = lazy(importDepartments);

function RoleGate({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'EMPLOYEE') {
    return <Navigate to={user.employeeId ? `/employees/${user.employeeId}` : '/employees'} replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { user, loading } = useAuth();

  // Warm the route chunks in the background once signed in, so navigating (e.g.
  // Dashboard → Profile) never stalls on a lazy-load Suspense flash mid-transition.
  useEffect(() => {
    if (!user) return;
    const preload = () => {
      importProfile();
      importEmployees();
      importMonitoring();
      importDepartments();
      importDashboard();
    };
    const ric = window.requestIdleCallback;
    if (ric) {
      const id = ric(preload);
      return () => window.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(preload, 1200);
    return () => window.clearTimeout(t);
  }, [user]);

  if (loading) {
    return (
      <div className="login-wrap">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<div className="login-wrap"><Spinner /></div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/welcome" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // First-login gate: admin-created accounts must set their own password before
  // anything else is reachable. Takes precedence over all app routes.
  if (user.mustChangePassword) {
    return <ForcePasswordChange />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route
        path="/welcome"
        element={
          <Suspense fallback={<div className="login-wrap"><Spinner /></div>}>
            <Landing />
          </Suspense>
        }
      />
      <Route
        path="*"
        element={
          <Layout>
            <Suspense fallback={<Spinner />}>
              <Routes>
                <Route path="/" element={<HomeRedirect />} />
              <Route
                path="/dashboard"
                element={
                  <RoleGate roles={['ADMIN', 'HR', 'MANAGER']}>
                    <Dashboard />
                  </RoleGate>
                }
              />
              <Route
                path="/monitoring"
                element={
                  <RoleGate roles={['ADMIN', 'HR', 'MANAGER']}>
                    <Monitoring />
                  </RoleGate>
                }
              />
              <Route path="/employees" element={<Employees />} />
              <Route path="/employees/:id" element={<EmployeeProfile />} />
              <Route
                path="/departments"
                element={
                  <RoleGate roles={['ADMIN', 'HR']}>
                    <Departments />
                  </RoleGate>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Layout>
        }
      />
    </Routes>
  );
}
