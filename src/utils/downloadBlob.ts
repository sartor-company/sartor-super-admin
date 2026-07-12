export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function filenameFromDisposition(header?: string, fallback = 'download') {
  if (!header) return fallback;
  const match = /filename\*?=(?:UTF-8''|")?([^\";]+)"?/i.exec(header);
  if (!match?.[1]) return fallback;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** Parse API error message when axios responseType is blob. */
export async function messageFromBlobError(err: unknown): Promise<string> {
  const response = (err as { response?: { data?: unknown } })?.response;
  const data = response?.data;
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed?.message) return parsed.message;
    } catch {
      /* ignore */
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Download failed.';
}
