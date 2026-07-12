import { useState } from 'react';
import { platformApi } from '../api/platform';
import { Button } from '../components/ui/Button';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';

const FILES: Array<{
  id: string;
  title: string;
  desc: string;
  actions: Array<{ label: string; format: string }>;
}> = [
  {
    id: 'pin-manifest',
    title: 'PIN Manifest',
    desc: 'DORMANT PINs · order_token mapping · activation status',
    actions: [
      { label: 'CSV', format: 'CSV' },
      { label: 'XLSX', format: 'XLSX' },
    ],
  },
  {
    id: 'qr-codes',
    title: 'QR Code Files',
    desc: 'PDF stickers · scan verify link · enter PIN on the page',
    actions: [{ label: 'PDF', format: 'PDF' }],
  },
  {
    id: 'batch-summary',
    title: 'Batch Summary Report',
    desc: 'Full order report · batch details · PIN activation instructions',
    actions: [{ label: 'PDF', format: 'PDF' }],
  },
];

export function DownloadPackageModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const { downloadPackageTarget, clearDownloadPackageTarget } = useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const open = isOpen('download-package');
  const order = downloadPackageTarget;

  const close = () => {
    closeModal('download-package');
    clearDownloadPackageTarget();
    setBusy(null);
  };

  const download = async (fileId: string, format: string, title: string) => {
    if (!order?._id) {
      showToast('No sticker order selected for download.', 'error');
      return;
    }
    const key = `${fileId}:${format}`;
    setBusy(key);
    try {
      await platformApi.downloadStickerFile(order._id, fileId, format);
      showToast(`${title} (${format}) downloaded.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Download failed.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="⬇ Download Sticker Package"
      width={520}
      subtitle={
        order
          ? `${order.orderId} · ${order.clientName} · ${order.qtyWithOverage.toLocaleString()} PINs`
          : undefined
      }
    >
      <div
        style={{
          padding: '9px 12px',
          background: 'var(--gb)',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--gt)',
          marginBottom: 14,
        }}
      >
        ✓ All files ready. Download individual files or the complete ZIP package for dispatch to print vendor.
      </div>
      {!order && (
        <div style={{ padding: 12, color: 'var(--rt)', fontSize: 13, marginBottom: 12 }}>
          No order selected. Close and click ⬇ Package on a sticker order row.
        </div>
      )}
      <div style={{ display: 'grid', gap: 8 }}>
        {FILES.map((file) => (
          <div
            key={file.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 13px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{file.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{file.desc}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {file.actions.map((a) => (
                <Button
                  key={a.label}
                  variant="secondary"
                  size="sm"
                  disabled={!order || busy !== null}
                  onClick={() => download(file.id, a.format, file.title)}
                >
                  {busy === `${file.id}:${a.format}` ? '…' : a.label}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ModalFooter style={{ flexWrap: 'wrap', gap: 8 }}>
        <Button variant="secondary" onClick={close} disabled={busy !== null}>
          Close
        </Button>
        <Button
          className="bacc"
          disabled={!order || busy !== null}
          onClick={() => download('zip', 'ZIP', 'Complete package')}
        >
          {busy === 'zip:ZIP' ? 'Downloading…' : '⬇ Download Complete ZIP'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
