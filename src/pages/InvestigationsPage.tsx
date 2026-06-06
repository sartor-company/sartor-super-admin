import { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { FilterBar, FilterSelect, PageHeader, SearchInput } from '../components/patterns';
import { InvestigationsTable } from '../components/tables/InvestigationsTable';
import { usePlatform } from '../context/PlatformContext';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { exportReport } from '../utils/exportReport';

export function InvestigationsPage() {
  const { openModal } = useModal();
  const { showToast } = useToast();
  const { investigations } = usePlatform();
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return investigations.filter((row) => {
      const okQ =
        !q ||
        row.id.toLowerCase().includes(q) ||
        row.client.toLowerCase().includes(q) ||
        row.batch.toLowerCase().includes(q);
      const okSev = !severity || row.severity === severity;
      const okSt = !status || row.status === status;
      return okQ && okSev && okSt;
    });
  }, [query, severity, status, investigations]);

  return (
    <>
      <PageHeader
        title="Investigations"
        subtitle="Counterfeit & batch mismatch cases · P1/P2/P3 severity"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Investigations Report')}>
              ↓ Export
            </Button>
            <Button variant="danger" size="sm" onClick={() => openModal('new-investigation')}>
              + Log Investigation
            </Button>
          </div>
        }
      />
      <FilterBar>
        <SearchInput value={query} onChange={setQuery} placeholder="Search by ID, client, batch..." />
        <FilterSelect
          value={severity}
          onChange={setSeverity}
          width={140}
          options={[
            { value: '', label: 'All Severities' },
            { value: 'P1', label: 'P1 Critical' },
            { value: 'P2', label: 'P2 High' },
            { value: 'P3', label: 'P3 Medium' },
          ]}
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          width={130}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'Open', label: 'Open' },
            { value: 'In Progress', label: 'In Progress' },
            { value: 'Resolved', label: 'Resolved' },
          ]}
        />
      </FilterBar>
      <InvestigationsTable rows={filtered} />
    </>
  );
}
