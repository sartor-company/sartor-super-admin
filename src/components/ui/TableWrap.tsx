import type { ReactNode } from 'react';

interface TableWrapProps {
  children: ReactNode;
  minWidth?: number;
}

/** Horizontal scroll container for wide data tables on small screens. */
export function TableWrap({ children, minWidth = 560 }: TableWrapProps) {
  return (
    <div
      className="table-responsive"
      style={{ ['--table-min-width' as string]: `${minWidth}px` }}
    >
      {children}
    </div>
  );
}
