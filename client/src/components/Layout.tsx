import { useEffect, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from './ui';
import { Icon } from './Icon';
import { AccountModal } from './AccountModal';
import { titleCase } from '../lib/format';
import { getTheme, toggleTheme, type Theme } from '../lib/theme';
import { PageTransition } from './motion';
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
  const [navOpen, setNavOpen] = useState(false);
  const items = NAV.filter((n) => !n.roles || (user && n.roles.includes(user.role)));
  const emp = user?.employee;

  // Close the mobile drawer on Escape.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNavOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navOpen]);

  const closeNav = () => setNavOpen(false);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <div className="mobile-topbar">
        <button
          type="button"
          className="hamburger"
          aria-label="Open navigation menu"
          aria-expanded={navOpen}
          aria-controls="app-sidebar"
          onClick={() => setNavOpen(true)}
        >
          <Icon name="menu" size={18} />
        </button>
        <div className="mobile-brand">
          <div className="brand-logo">P</div> PeopleHub
        </div>
        <span style={{ width: 38 }} aria-hidden="true" />
      </div>

      <div className="app-shell">
        {navOpen && <div className="sidebar-overlay" onClick={closeNav} aria-hidden="true" />}
        <aside className={`sidebar${navOpen ? ' open' : ''}`} id="app-sidebar">
          <div className="brand">
            <div className="brand-logo">P</div>
            PeopleHub
          </div>

          <nav className="nav">
            {user?.employeeId && (
              <NavLink
                to={`/employees/${user.employeeId}`}
                onClick={closeNav}
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
                onClick={closeNav}
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
            <button
              className="logout-btn"
              onClick={() => {
                closeNav();
                setShowAccount(true);
              }}
            >
              <Icon name="user" size={16} />
              Account
            </button>
            <button type="button" className="logout-btn" onClick={() => setTheme(toggleTheme())} aria-pressed={theme === 'dark'}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <button type="button" className="logout-btn" onClick={logout}>
              <Icon name="log-out" size={16} />
              Sign out
            </button>
          </div>
        </aside>

        <main className="content" id="main">
          <div className="page">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
      {showAccount && <AccountModal onClose={() => setShowAccount(false)} />}
    </>
  );
}
