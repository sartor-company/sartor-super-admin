import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROLES } from '../constants/roles';
import { useAuthStore } from '../store/authStore';
import type { RoleId } from '../types';
import { canAccessPath } from '../utils/roleAccess';

export function RoleGuard() {
  const role = (useAuthStore((s) => s.user?.platformRole) || 'super') as RoleId;
  const { pathname } = useLocation();

  if (!canAccessPath(role, pathname)) {
    return <Navigate to={ROLES[role].defaultPath} replace />;
  }

  return <Outlet />;
}

export function RoleHomeRedirect() {
  const role = (useAuthStore((s) => s.user?.platformRole) || 'super') as RoleId;
  return <Navigate to={ROLES[role].defaultPath} replace />;
}
