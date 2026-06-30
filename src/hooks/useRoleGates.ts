import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePlatform } from '../context/PlatformContext';
import type { RoleId } from '../types';
import { canPerformAction, type PlatformAction } from '../utils/roleGates';

export function useRoleGates() {
  const role = (useAuthStore((s) => s.user?.platformRole) || 'super') as RoleId;
  const { settings } = usePlatform();
  const aimlCanTriggerPin = settings?.aimlCanTriggerPin !== false;

  const can = useCallback(
    (action: PlatformAction) => canPerformAction(role, action, { aimlCanTriggerPin }),
    [role, aimlCanTriggerPin],
  );

  return { role, can, aimlCanTriggerPin };
}
