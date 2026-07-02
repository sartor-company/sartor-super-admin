type LoaderProps = {
  /** Fill the viewport and center (e.g. session check, route load). */
  fullscreen?: boolean;
  /** Optional text under the logo. */
  label?: string;
  /** Logo size in px. */
  size?: number;
};

export function Loader({ fullscreen = false, label, size = 56 }: LoaderProps) {
  return (
    <div className={fullscreen ? 'loader loader-full' : 'loader'}>
      <img
        className="loader-mark"
        src="/sartor-logo.jpg"
        alt="Loading"
        width={size}
        height={size}
        style={{ width: size, height: size }}
      />
      {label ? <div className="loader-label">{label}</div> : null}
    </div>
  );
}
