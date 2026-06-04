import type { ReactNode } from 'react';
import { FormGroup } from '../ui/FormGroup';

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>{children}</div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  flex = true,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  flex?: boolean;
}) {
  return (
    <input
      className="inp"
      style={flex ? { flex: 1, minWidth: 160 } : undefined}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  width,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  width?: number;
}) {
  return (
    <select
      className="inp"
      style={width != null ? { width } : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value || '__all'} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ReportToolbar({
  reportValue,
  onReportChange,
  clientValue,
  onClientChange,
  reportOptions,
  clientOptions,
}: {
  reportValue: string;
  onReportChange: (v: string) => void;
  clientValue: string;
  onClientChange: (v: string) => void;
  reportOptions: { value: string; label: string }[];
  clientOptions: string[];
}) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <FormGroup label="Select Report">
          <select className="inp" value={reportValue} onChange={(e) => onReportChange(e.target.value)}>
            {reportOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FormGroup>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <FormGroup label="Filter by Client">
          <select className="inp" value={clientValue} onChange={(e) => onClientChange(e.target.value)}>
            {clientOptions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </FormGroup>
      </div>
    </div>
  );
}
