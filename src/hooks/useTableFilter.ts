import { useMemo, useState } from 'react';

export function useTableFilter<T extends Record<string, string>>(
  rows: T[],
  filters: { key: keyof T; value: string }[],
  textSearch?: (row: T, q: string) => boolean,
) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const q = query.trim().toLowerCase();
      if (q && textSearch && !textSearch(row, q)) return false;
      if (q && !textSearch) {
        const hay = Object.values(row).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return filters.every((f) => {
        if (!f.value) return true;
        return String(row[f.key]).toLowerCase().includes(f.value.toLowerCase());
      });
    });
  }, [rows, filters, query, textSearch]);

  return { query, setQuery, filtered };
}
