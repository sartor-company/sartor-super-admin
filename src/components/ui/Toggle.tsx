import { useState } from 'react';
import { useToast } from '../../context/ToastContext';

export function Toggle({
  defaultOn = false,
  onToggle,
  messageOn,
  messageOff,
}: {
  defaultOn?: boolean;
  onToggle?: (on: boolean) => void;
  messageOn?: string;
  messageOff?: string;
}) {
  const { showToast } = useToast();
  const [on, setOn] = useState(defaultOn);

  return (
    <div
      className={`toggle ${on ? 'on' : ''}`}
      role="switch"
      aria-checked={on}
      tabIndex={0}
      onClick={() => {
        const next = !on;
        setOn(next);
        onToggle?.(next);
        if (messageOn || messageOff) {
          showToast(next ? messageOn ?? 'Enabled.' : messageOff ?? 'Disabled.');
        }
      }}
    />
  );
}
