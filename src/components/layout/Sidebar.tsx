import { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ROLES } from '../../constants/roles';
import { useApp } from '../../context/AppContext';
import { usePlatform } from '../../context/PlatformContext';
import { useAuthStore } from '../../store/authStore';
import { computeNavBadges } from '../../utils/navBadges';
import { initialsFromName } from '../../utils/roleAccess';
import { NavIcon } from '../icons/NavIcon';

function navIsActive(path: string, finTab: string | undefined, pathname: string, search: string) {
  const [basePath, query] = path.split('?');
  const pathMatch = pathname === basePath || (basePath === '/' && pathname === '/');
  if (!pathMatch) return false;
  if (!finTab && !query) return true;
  const want = finTab ?? new URLSearchParams(query).get('finTab');
  const current = new URLSearchParams(search).get('finTab') ?? 'dash';
  return want === current;
}

export function Sidebar() {
  const { role, sidebarOpen, closeSidebar } = useApp();
  const user = useAuthStore((s) => s.user);
  const { clients, onboarding, doraQueue, investigations, tickets } = usePlatform();
  const config = ROLES[role];
  const { pathname, search } = useLocation();
  const navBadges = useMemo(
    () => computeNavBadges({ clients, onboarding, investigations, doraQueue, tickets }),
    [clients, onboarding, investigations, doraQueue, tickets],
  );
  const displayName = user?.fullName || config.user;
  const initials = user?.fullName ? initialsFromName(user.fullName) : config.initials;

  return (
    <>
      <div
        className={`mob-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
        role="presentation"
      />
      <nav id="sidebar" className={sidebarOpen ? 'mob-open' : ''}>
        <div className="slogo">
          <div className="smark">
            <svg viewBox="0 0 24 24">
              <path d="M12 2L3 7v5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" fill="#fff" />
            </svg>
          </div>
          <div>
            <div className="sname">Sartor Ecosystem</div>
            <div className="stag">Internal Console v9</div>
          </div>
        </div>
        <div id="nav-links">
          {config.nav.map((section) => (
            <div className="nsec" key={section.title}>
              <div className="nlbl">{section.title}</div>
              {section.items.map((item) => {
                const active = navIsActive(item.path, item.finTab, pathname, search);
                return (
                  <NavLink
                    key={`${item.path}-${item.label}`}
                    to={item.path}
                    className={`ni ${active ? 'on' : ''}`}
                    onClick={closeSidebar}
                  >
                    <NavIcon name={item.icon} />
                    {item.label}
                    {item.badgeKey && navBadges[item.badgeKey] != null && (
                      <span className="nbadge">{navBadges[item.badgeKey]}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>
        <div className="sfooter">
          <div className="suser">
            <div className="sav" style={{ background: config.avatarBg }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sun">{displayName}</div>
              <div className="srt">{config.roleTitle}</div>
            </div>
            <span className={`spill ${config.pillClass}`}>{config.pill}</span>
          </div>
        </div>
      </nav>
    </>
  );
}
