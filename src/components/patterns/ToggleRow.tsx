import type { ReactNode } from 'react';
import { Toggle } from '../ui/Toggle';

export function ToggleRow({
  label,
  description,
  defaultOn = false,
  messageOn,
  messageOff,
  onToggle,
}: {
  label: string;
  description?: string;
  defaultOn?: boolean;
  messageOn?: string;
  messageOff?: string;
  onToggle?: (on: boolean) => void;
}) {
  return (
    <div className="twrap">
      <div>
        <div className="tlbl">{label}</div>
        {description != null && <div className="tdesc">{description}</div>}
      </div>
      <Toggle
        defaultOn={defaultOn}
        messageOn={messageOn}
        messageOff={messageOff}
        onToggle={onToggle}
      />
    </div>
  );
}

export function ToggleRowCustom({ label, description, control }: { label: string; description?: string; control: ReactNode }) {
  return (
    <div className="twrap">
      <div>
        <div className="tlbl">{label}</div>
        {description != null && <div className="tdesc">{description}</div>}
      </div>
      {control}
    </div>
  );
}
