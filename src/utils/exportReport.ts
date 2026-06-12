export function exportCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (cell: string) => `"${String(cell).replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join(
    '\n',
  );
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type ExportOptions = {
  headers?: string[];
  rows?: string[][];
  fmt?: 'csv' | 'pdf';
};

export function exportReport(
  showToast: (msg: string, type?: 'success' | 'error' | 'warn') => void,
  name: string,
  options?: string | ExportOptions,
) {
  const opts: ExportOptions =
    typeof options === 'string' ? { fmt: options as ExportOptions['fmt'] } : options || {};

  if (opts.headers && opts.rows) {
    exportCsv(name, opts.headers, opts.rows);
    showToast(`${name} downloaded.`, 'success');
    return;
  }

  showToast(`Generating ${name} report… Download will start shortly.`);
  setTimeout(() => {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(
        `<html><head><title>${name}</title><style>body{font-family:sans-serif;padding:24px}h1{font-size:18px}p{color:#666;font-size:13px}</style></head><body><h1>${name}</h1><p>Sartor Ecosystem Internal Console — Generated ${new Date().toLocaleString()}</p><p>Format: ${(opts.fmt || 'PDF').toUpperCase()}</p><br><p><em>Use Ctrl+P / Cmd+P to print or save as PDF.</em></p></body></html>`,
      );
      w.document.close();
      setTimeout(() => w.print(), 400);
    }
  }, 600);
}
