export type NoteItemData = {
  author: string;
  date: string;
  text: string;
  warn?: boolean;
};

export function NoteItem({ note }: { note: NoteItemData }) {
  return (
    <div
      style={{
        padding: 9,
        background: note.warn ? 'var(--ab)' : 'var(--bg)',
        borderRadius: 6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <strong>{note.author}</strong>
        <span style={{ color: 'var(--text3)' }}>{note.date}</span>
      </div>
      <div style={{ color: note.warn ? 'var(--at)' : 'var(--text2)' }}>{note.text}</div>
    </div>
  );
}

export function NoteList({ notes }: { notes: NoteItemData[] }) {
  return (
    <div style={{ display: 'grid', gap: 7, fontSize: 12 }}>
      {notes.map((n) => (
        <NoteItem key={`${n.date}-${n.author}-${n.text.slice(0, 12)}`} note={n} />
      ))}
    </div>
  );
}
