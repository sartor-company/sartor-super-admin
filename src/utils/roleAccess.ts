import { ROLES } from '../constants/roles';
import type { RoleId } from '../types';

export function roleAllowedPaths(role: RoleId): string[] {
  const paths = new Set<string>();
  for (const section of ROLES[role].nav) {
    for (const item of section.items) {
      paths.add(item.path.split('?')[0]);
    }
  }
  return [...paths];
}

export function canAccessPath(role: RoleId, pathname: string): boolean {
  for (const raw of roleAllowedPaths(role)) {
    const base = raw.split('?')[0];
    if (base === pathname) return true;
    if (base !== '/' && pathname.startsWith(`${base}/`)) return true;
    if (base === '/clients' && pathname.startsWith('/clients/')) return true;
  }
  return false;
}

export function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
