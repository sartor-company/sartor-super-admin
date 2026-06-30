import { useEffect, useState } from 'react';
import { platformApi } from '../api/platform';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';

type StickerSku = {
  _id: string;
  sku: string;
  product: string;
  status: string;
  statusLabel: string;
};

export function StickerDesignModal() {
  const { isOpen, closeModal } = useModal();
  const { stickerDesignTarget, clearStickerDesign } = useApp();
  const { refresh } = usePlatform();
  const { showToast } = useToast();
  const open = isOpen('sticker-design');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skus, setSkus] = useState<StickerSku[]>([]);
  const [complete, setComplete] = useState(false);

  const load = async () => {
    if (!stickerDesignTarget?.adminId) return;
    setLoading(true);
    try {
      const data = (await platformApi.onboardingStickerDesign(stickerDesignTarget.adminId)) as {
        skus: StickerSku[];
        stickerDesignComplete?: boolean;
      };
      setSkus(data.skus || []);
      setComplete(!!data.stickerDesignComplete);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not load sticker design.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && stickerDesignTarget) load();
  }, [open, stickerDesignTarget?.adminId]);

  const handleClose = () => {
    closeModal('sticker-design');
    clearStickerDesign();
    setSkus([]);
  };

  const approveSku = async (productId: string) => {
    if (!stickerDesignTarget?.adminId) return;
    setSaving(true);
    try {
      await platformApi.patchOnboarding(stickerDesignTarget.adminId, {
        approveStickerProductId: productId,
      });
      await load();
      await refresh();
      showToast('SKU design approved.', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not approve SKU.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const markComplete = async () => {
    if (!stickerDesignTarget?.adminId) return;
    setSaving(true);
    try {
      await platformApi.patchOnboarding(stickerDesignTarget.adminId, {
        completeStickerDesign: true,
      });
      await refresh();
      handleClose();
      showToast('Sticker design step marked complete.', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not complete sticker design.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!stickerDesignTarget) return null;

  const allApproved = skus.length > 0 && skus.every((s) => s.status === 'approved');

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="🏷 Finalize Sticker Design"
      subtitle={`${stickerDesignTarget.clientName}${stickerDesignTarget.clientCode ? ` · ${stickerDesignTarget.clientCode}` : ''} · design sign-off per SKU`}
      width={560}
    >
      <div
        style={{
          padding: '9px 11px',
          background: 'var(--bb)',
          borderRadius: 7,
          fontSize: 12,
          color: 'var(--bt)',
          marginBottom: 14,
        }}
      >
        ℹ Sticker design must be agreed and signed off with the client for each SKU before sticker orders
        can be placed. Applies to Sartor-Chain & DORA AI and CRM 360 clients.
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>Loading SKUs…</p>
      ) : skus.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>
          No SKUs registered yet. Register products in client onboarding (SKU setup step) first.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Design Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {skus.map((s) => (
                <tr key={s._id}>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{s.sku}</td>
                  <td>{s.product}</td>
                  <td>
                    <Badge
                      variant={
                        s.status === 'approved' ? 'bg' : s.status === 'awaiting_client' ? 'ba' : 'bx'
                      }
                    >
                      {s.statusLabel}
                    </Badge>
                  </td>
                  <td>
                    {s.status === 'approved' ? (
                      <span style={{ color: 'var(--gt)', fontSize: 11 }}>✓ Signed off</span>
                    ) : (
                      <Button
                        className="bacc"
                        size="sm"
                        disabled={saving}
                        onClick={() => approveSku(s._id)}
                      >
                        Mark Approved
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={saving}>
          Close
        </Button>
        <Button
          className="bacc"
          onClick={markComplete}
          disabled={saving || complete || !allApproved}
        >
          {saving ? 'Saving…' : complete ? 'Step Complete' : 'Mark Design Step Complete'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
