import { Button } from '../components/ui/Button';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';

export function DownloadPackageModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const open = isOpen('download-package');

  return (
    <Modal open={open} onClose={() => closeModal('download-package')} title="⬇ Download Sticker Package" width={520}>
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
      <div style={{ display: 'grid', gap: 8 }}>
        {[
          {
            title: 'PIN Manifest',
            desc: 'DORMANT PINs · order_token mapping · activation status',
            actions: ['CSV', 'XLSX'],
          },
          {
            title: 'QR Code Files',
            desc: 'Unique QR codes · verify.dorascan.ai/{client_code}/{order_token}',
            actions: ['PNG ZIP', 'SVG ZIP'],
          },
          {
            title: 'Batch Summary Report',
            desc: 'Full order report · batch details · PIN activation instructions',
            actions: ['PDF'],
          },
        ].map((file) => (
          <div
            key={file.title}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 13px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{file.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{file.desc}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {file.actions.map((a) => (
                <Button
                  key={a}
                  variant="secondary"
                  size="sm"
                  onClick={() => showToast(`Downloading ${file.title} ${a}…`, 'success')}
                >
                  {a}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ModalFooter style={{ flexWrap: 'wrap', gap: 8 }}>
        <Button variant="secondary" onClick={() => closeModal('download-package')}>
          Close
        </Button>
        <Button
          className="bacc"
          onClick={() => {
            closeModal('download-package');
            showToast('Complete package ZIP downloaded. Ready for print vendor.', 'success');
          }}
        >
          ⬇ Download Complete ZIP
        </Button>
      </ModalFooter>
    </Modal>
  );
}
