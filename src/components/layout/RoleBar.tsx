import { ROLES } from '../../constants/roles';
import { useApp } from '../../context/AppContext';
import type { RoleId } from '../../types';

const ROLE_ORDER: RoleId[] = ['super', 'ops', 'am', 'finance', 'aiml', 'support'];

export function RoleBar() {
  const { role, setRole } = useApp();

  const isDev = import.meta.env.DEV;

  return (
    <div id="rbar">
      <span>Internal role{isDev ? ' (demo)' : ''}:</span>
      {isDev &&
        ROLE_ORDER.map((id) => (
        <button
          key={id}
          type="button"
          className={`rbtn ${role === id ? 'on' : ''}`}
          onClick={() => setRole(id)}
        >
          {ROLES[id].label.toUpperCase()}
        </button>
        ))}
      {!isDev && <span style={{ fontWeight: 600 }}>{ROLES[role].label}</span>}
      <span className="internal-tag">SARTOR LTD INTERNAL — CONFIDENTIAL</span>
    </div>
  );
}
