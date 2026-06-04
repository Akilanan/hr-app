import { lazy, Suspense, type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { Spinner } from './components/ui';
import Login from './pages/Login';
import type { Role } from './api/types';

const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const Employees = lazy(() => import('./pages/Employees'));
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile'));
const Departments = lazy(() => import('./pages/Departments'));

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
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
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
