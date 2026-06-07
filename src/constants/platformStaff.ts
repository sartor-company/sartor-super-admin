import { ROLES } from './roles';
import type { BadgeVariant, RoleId } from '../types';

export const PLATFORM_ROLE_OPTIONS: { value: RoleId; label: string }[] = [
  { value: 'super', label: 'CEO / Super Admin' },
  { value: 'ops', label: 'Operations Manager' },
  { value: 'am', label: 'Account Manager' },
  { value: 'finance', label: 'Finance Admin' },
  { value: 'aiml', label: 'AI/ML Lead' },
  { value: 'support', label: 'Platform Support' },
];

const ROLE_BADGE: Record<RoleId, BadgeVariant> = {
  super: 'bx',
  ops: 'bg',
  am: 'bb',
  finance: 'bgold',
  aiml: 'bp',
  support: 'ba',
};

export function platformRoleLabel(role: RoleId): string {
  return ROLES[role]?.label ?? role;
}

export function platformRoleBadgeVariant(role: RoleId): BadgeVariant {
  return ROLE_BADGE[role] ?? 'bx';
}

export function isSuperRole(role: RoleId | undefined): boolean {
  return role === 'super';
}

function tempPassword(): string {
  return `Sartor@${Math.random().toString(36).slice(2, 10)}`;
}

export { tempPassword };
