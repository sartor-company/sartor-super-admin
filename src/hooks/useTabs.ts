import { useCallback, useState } from 'react';

export function useTabs<T extends string>(initial: T) {
  const [active, setActive] = useState<T>(initial);
  const isActive = useCallback((id: T) => active === id, [active]);
  return { active, setActive, isActive };
}
