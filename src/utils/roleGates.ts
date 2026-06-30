import type { RoleId } from '../types';

export type PlatformAction =
  | 'triggerPin'
  | 'generate'
  | 'download'
  | 'dispatch'
  | 'newOrder'
  | 'followUp'
  | 'activate'
  | 'invoice'
  | 'topup'
  | 'onboard'
  | 'convert'
  | 'staff';

const BASE_ACCESS: Record<PlatformAction, RoleId[]> = {
  triggerPin: ['super', 'ops'],
  generate: ['super', 'aiml'],
  download: ['super', 'ops'],
  dispatch: ['super', 'ops'],
  newOrder: ['super', 'ops'],
  followUp: ['super', 'ops', 'am', 'aiml'],
  activate: ['super'],
  invoice: ['super', 'finance'],
  topup: ['super', 'finance'],
  onboard: ['super', 'ops'],
  convert: ['super'],
  staff: ['super'],
};

export function canPerformAction(
  role: RoleId | undefined,
  action: PlatformAction,
  opts?: { aimlCanTriggerPin?: boolean },
): boolean {
  const r = role || 'super';
  let roles = [...(BASE_ACCESS[action] || [])];
  if (action === 'triggerPin' && opts?.aimlCanTriggerPin && !roles.includes('aiml')) {
    roles = [...roles, 'aiml'];
  }
  return roles.includes(r);
}

/** Path-level access beyond nav config */
export function isPathAllowed(role: RoleId, pathname: string): boolean {
  if (pathname === '/settings' || pathname.startsWith('/settings/')) {
    return role === 'super';
  }
  if (pathname === '/finance' || pathname.startsWith('/finance')) {
    return role === 'super' || role === 'finance';
  }
  if (pathname === '/investigations' || pathname.startsWith('/investigations')) {
    return ['super', 'ops', 'support'].includes(role);
  }
  return true;
}
