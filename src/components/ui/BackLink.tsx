export function BackLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="back" onClick={onClick}>
      {children}
    </button>
  );
}
