export function exportReport(
  showToast: (msg: string, type?: 'success' | 'error' | 'warn') => void,
  name: string,
  fmt?: string,
) {
  showToast(`Generating ${name} report… Download will start shortly.`);
  setTimeout(() => {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(
        `<html><head><title>${name}</title><style>body{font-family:sans-serif;padding:24px}h1{font-size:18px}p{color:#666;font-size:13px}</style></head><body><h1>${name}</h1><p>Sartor Ecosystem Internal Console — Generated ${new Date().toLocaleString()}</p><p>Format: ${(fmt || 'PDF').toUpperCase()}</p><br><p><em>Use Ctrl+P / Cmd+P to print or save as PDF.</em></p></body></html>`,
      );
      w.document.close();
      setTimeout(() => w.print(), 400);
    }
  }, 600);
}
