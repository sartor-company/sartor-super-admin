import type { KeyboardEvent, ReactNode } from 'react';

/** Matches HTML `<span class="ca">` — link-style action without button chrome. */
export function CardLinkAction({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <span className="ca" role="button" tabIndex={0} onClick={onClick} onKeyDown={onKeyDown}>
      {children}
    </span>
  );
}
