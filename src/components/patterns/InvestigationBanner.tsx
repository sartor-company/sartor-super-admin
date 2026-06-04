import type { InvestigationDetail } from '../../types';

export function investigationSeverityStyle(severity: InvestigationDetail['severity']) {
  if (severity === 'P1') return { bg: 'var(--rb)', col: 'var(--rt)', lbl: 'Critical' };
  if (severity === 'P2') return { bg: 'var(--ab)', col: 'var(--at)', lbl: 'High' };
  return { bg: 'var(--bb)', col: 'var(--bt)', lbl: 'Medium' };
}

export function InvestigationBanner({ investigation }: { investigation: InvestigationDetail }) {
  const bc = investigationSeverityStyle(investigation.severity);
  return (
    <div
      style={{
        padding: '10px 13px',
        borderRadius: 7,
        marginBottom: 14,
        fontSize: 12,
        background: bc.bg,
        color: bc.col,
      }}
    >
      <strong>
        {investigation.severity} — {bc.lbl} Priority
      </strong>
      <br />
      Client: {investigation.client} · Batch: {investigation.batch}
    </div>
  );
}
