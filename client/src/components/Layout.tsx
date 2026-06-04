import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from './ui';
import { Icon } from './Icon';
import { AccountModal } from './AccountModal';
import { titleCase } from '../lib/format';
import { getTheme, toggleTheme, type Theme } from '../lib/theme';
import type { Role } from '../api/types';

interface NavDef {
  to: string;
  label: string;
  icon: string;
  roles?: Role[];
  end?: boolean;
}

const NAV: NavDef[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'grid', roles: ['ADMIN', 'HR', 'MANAGER'] },
  { to: '/employees', label: 'Directory', icon: 'users', end: true },
  { to: '/monitoring', label: 'Performance', icon: 'trending-up', roles: ['ADMIN', 'HR', 'MANAGER'] },
  { to: '/departments', label: 'Departments', icon: 'building', roles: ['ADMIN', 'HR'] },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<Theme>(getTheme());
  const [showAccount, setShowAccount] = useState(false);
  const items = NAV.filter((n) => !n.roles || (user && n.roles.includes(user.role)));
  const emp = user?.employee;

  return (
    <>
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">P</div>
          PeopleHub
        </div>

        <nav className="nav">
          {user?.employeeId && (
            <NavLink
              to={`/employees/${user.employeeId}`}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">
                <Icon name="user" />
              </span>
              My Profile
            </NavLink>
          )}
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">
                <Icon name={n.icon} />
              </span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <Avatar first={emp?.firstName} last={emp?.lastName} size="sm" />
            <div className="user-meta">
              <div className="name">{emp ? `${emp.firstName} ${emp.lastName}` : user?.email}</div>
              <div className="role">{titleCase(user?.role)}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={() => setShowAccount(true)}>
            <Icon name="user" size={16} />
            Account
          </button>
          <button className="logout-btn" onClick={() => setTheme(toggleTheme())}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button className="logout-btn" onClick={logout}>
            <Icon name="log-out" size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="page">{children}</div>
      </main>
    </div>
    {showAccount && <AccountModal onClose={() => setShowAccount(false)} />}
    </>
  );
}
