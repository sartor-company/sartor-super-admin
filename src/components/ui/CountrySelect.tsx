import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCountries } from '../../hooks/useCountries';

const DROPDOWN_Z = 10100;
const PANEL_MAX_H = 280;

type PanelCoords = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
};

export function CountrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { countries, loading, getLabel } = useCountries();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState<PanelCoords | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [countries, query]);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(
      PANEL_MAX_H,
      openUp ? spaceAbove : spaceBelow,
    );

    setCoords({
      left: rect.left,
      width: rect.width,
      top: openUp ? rect.top - maxHeight - 4 : rect.bottom + 4,
      maxHeight: Math.max(160, maxHeight),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const select = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery('');
  };

  const toggle = () => {
    setOpen((was) => {
      if (!was) updatePosition();
      return !was;
    });
  };

  const panel =
    open && coords
      ? createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={{
              position: 'fixed',
              zIndex: DROPDOWN_Z,
              left: coords.left,
              top: coords.top,
              width: coords.width,
              maxHeight: coords.maxHeight,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              boxShadow: '0 12px 40px rgba(0,0,0,.18)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: 8,
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
              }}
            >
              <input
                className="inp"
                type="search"
                placeholder="Search country…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                style={{ margin: 0 }}
              />
            </div>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: '4px 0',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {filtered.length === 0 ? (
                <li
                  style={{
                    padding: '10px 12px',
                    fontSize: 12,
                    color: 'var(--text3)',
                  }}
                >
                  No matches
                </li>
              ) : (
                filtered.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={c.code === value}
                      onClick={() => select(c.code)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        border: 'none',
                        background:
                          c.code === value ? 'var(--bg)' : 'transparent',
                        padding: '8px 12px',
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span>{c.name}</span>
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--text3)',
                          fontFamily: 'var(--mono)',
                        }}
                      >
                        {c.code}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="inp"
        style={{
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Loading countries…' : getLabel(value)}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>
          ▼
        </span>
      </button>
      {panel}
    </>
  );
}
