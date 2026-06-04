import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { KCard, KCardGrid } from '../components/ui/KCard';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { exportReport } from './shared';

export function AimlDashboardPage() {
  const { openModal } = useModal();
  const { showToast } = useToast();

  return (
    <>
      <div className="pghead">
        <div>
          <div className="pgtitle">DORA AI Dashboard</div>
          <div className="pgsub">Samuel Okon · Model training & performance · Internal only</div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'DORA Performance')}>
          ↓ Export
        </Button>
      </div>

      <KCardGrid columns={4}>
        <KCard label="Training Queue" value="7" trend="Awaiting images" trendType="dn" accent />
        <KCard label="Models In Training" value="3" trend="1–3 day SLA" trendType="neu" />
        <KCard label="Active Models" value="142" trend="↑ 6 this month" trendType="up" />
        <KCard label="Platform Avg F-Score" value="84.7" trend="↑ 2.1 pts" trendType="up" />
      </KCardGrid>

      <Card>
        <div className="ch">
          <div className="ct">Model performance by client</div>
          <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Model Performance')}>
            ↓ Export
          </Button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
          🔒 Feature labels and score thresholds are proprietary — internal use only.
        </div>
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Models</th>
              <th>Avg F1</th>
              <th>Avg F2</th>
              <th>Avg F3</th>
              <th>Avg F4</th>
              <th>Avg F5</th>
              <th>F-Score</th>
              <th>Drift</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Sartor Health', 24, 87, 82, 91, 88, 86, '86.8', 'None', 'bg', false],
              ['DankePharma', 18, 84, 79, 88, 85, 83, '83.8', 'None', 'bg', false],
              ['NaturalKing', 8, 71, 68, 74, 65, 70, '69.6', 'F4 drift', 'ba', true],
              ['Bright Home', 11, 80, 76, 83, 79, 81, '79.8', 'None', 'bg', false],
            ].map((r) => (
              <tr key={String(r[0])}>
                <td>
                  <strong>{r[0]}</strong>
                </td>
                <td>{r[1]}</td>
                <td style={{ fontFamily: "'DM Mono', monospace" }}>{r[2]}</td>
                <td style={{ fontFamily: "'DM Mono', monospace" }}>{r[3]}</td>
                <td style={{ fontFamily: "'DM Mono', monospace" }}>{r[4]}</td>
                <td style={{ fontFamily: "'DM Mono', monospace" }}>{r[5]}</td>
                <td style={{ fontFamily: "'DM Mono', monospace" }}>{r[6]}</td>
                <td style={{ color: r[9] === 'ba' ? 'var(--at)' : 'var(--gt)', fontWeight: 600 }}>{r[7]}</td>
                <td>
                  <Badge variant={r[9] as 'bg' | 'ba'}>{r[8]}</Badge>
                </td>
                <td>
                  {r[10] ? (
                    <Button variant="danger" size="sm" onClick={() => openModal('model-review')}>
                      Investigate
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => showToast('Full model report viewed.')}>
                      Detail
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
