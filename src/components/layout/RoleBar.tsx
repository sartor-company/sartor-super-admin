import { ROLES } from '../../constants/roles';
import { useApp } from '../../context/AppContext';
import type { RoleId } from '../../types';

const ROLE_ORDER: RoleId[] = ['super', 'ops', 'am', 'finance', 'aiml', 'support'];

export function RoleBar() {
  const { role, setRole } = useApp();

  return (
    <div id="rbar">
      <span>Internal role:</span>
      {ROLE_ORDER.map((id) => (
        <button
          key={id}
          type="button"
          className={`rbtn ${role === id ? 'on' : ''}`}
          onClick={() => setRole(id)}
        >
          {ROLES[id].label.toUpperCase()}
        </button>
      ))}
      <span className="internal-tag">SARTOR LTD INTERNAL — CONFIDENTIAL</span>
    </div>
  );
}
