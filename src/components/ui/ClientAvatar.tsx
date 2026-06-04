interface ClientAvatarProps {
  initials: string;
  color: string;
  size?: 'sm' | 'md' | 'lg' | number;
}

const sizes = {
  sm: { w: 26, h: 26, fs: 10, br: 6 },
  md: { w: 32, h: 32, fs: 12, br: 8 },
  lg: { w: 44, h: 44, fs: 16, br: 10 },
};

export function ClientAvatar({ initials, color, size = 'md' }: ClientAvatarProps) {
  const s =
    typeof size === 'number'
      ? { w: size, h: size, fs: Math.round(size * 0.36), br: Math.round(size * 0.22) }
      : sizes[size];
  const cls = size === 'lg' ? 'cav' : 'cav';
  return (
    <div
      className={cls}
      style={{
        width: s.w,
        height: s.h,
        background: color,
        fontSize: s.fs,
        borderRadius: s.br,
      }}
    >
      {initials}
    </div>
  );
}
