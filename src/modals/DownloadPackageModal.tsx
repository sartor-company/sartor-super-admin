import { useState } from 'react';
import { platformApi } from '../api/platform';
import { Button } from '../components/ui/Button';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import {
  downloadPackageArtifact,
  fetchAllPackageData,
  type PackagePayload,
} from '../utils/stickerPackageClient';

const FILES: Array<{
  id: string;
  title: string;
  desc: string;
  actions: Array<{ label: string; kind: 'csv' | 'xlsx' | 'qr-pdf' | 'summary-pdf' }>;
}> = [
  {
    id: 'pin-manifest',
    title: 'PIN Manifest',
    desc: 'Generated in your browser from order PIN data',
    actions: [
      { label: 'CSV', kind: 'csv' },
      { label: 'Excel', kind: 'xlsx' },
    ],
  },
  {
    id: 'qr-codes',
    title: 'QR Code Files',
    desc: 'PDF stickers · scan verify link · enter PIN on the page',
    actions: [{ label: 'PDF', kind: 'qr-pdf' }],
  },
  {
    id: 'batch-summary',
    title: 'Batch Summary Report',
    desc: 'Order report · activation instructions',
    actions: [{ label: 'PDF', kind: 'summary-pdf' }],
  },
];

export function DownloadPackageModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const { downloadPackageTarget, clearDownloadPackageTarget } = useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [payload, setPayload] = useState<PackagePayload | null>(null);
  const open = isOpen('download-package');
  const order = downloadPackageTarget;

  const close = () => {
    closeModal('download-package');
    clearDownloadPackageTarget();
    setBusy(null);
    setProgress('');
    setPayload(null);
  };

  const ensurePayload = async () => {
    if (payload) return payload;
    if (!order?._id) throw new Error('No sticker order selected');
    setProgress('Loading PIN data…');
    const data = await fetchAllPackageData((page, limit) =>
      platformApi.getStickerPackageData(order._id, { page, limit }),
    );
    setPayload(data);
    return data;
  };

  const download = async (
    key: string,
    kind: 'csv' | 'xlsx' | 'qr-pdf' | 'summary-pdf' | 'zip',
    title: string,
  ) => {
    if (!order?._id) {
      showToast('No sticker order selected for download.', 'error');
      return;
    }
    setBusy(key);
    try {
      const data = await ensurePayload();
      await downloadPackageArtifact(kind, data, setProgress);
      showToast(`${title} ready.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Download failed.', 'error');
    } finally {
      setBusy(null);
      setProgress('');
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
        Files are built in your browser from live PIN data (server stays light). Large orders may take a
        minute — progress shows below.
      </div>
      {progress && (
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>{progress}</div>
      )}
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
                  onClick={() => download(`${file.id}:${a.kind}`, a.kind, file.title)}
                >
                  {busy === `${file.id}:${a.kind}` ? '…' : a.label}
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
          onClick={() => download('zip:ZIP', 'zip', 'Complete package')}
        >
          {busy === 'zip:ZIP' ? 'Building…' : '⬇ Download Complete ZIP'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
