import { useCallback, useEffect, useMemo, useState } from 'react';
import { platformApi } from '../api/platform';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { KCard } from '../components/ui/KCard';
import { PageHeader } from '../components/patterns';
import { InfoBanner } from '../components/patterns/Banner';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import { useFollowUp } from '../hooks/useFollowUp';
import { useRoleGates } from '../hooks/useRoleGates';
import {
  STICKER_PROCESS_STEPS,
  STICKER_STAGE_OPTIONS,
  type StickerOrderRow,
} from '../data/stickerOrders';

function DispatchBadge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`dispatch-badge ${className}`}>{children}</span>;
}

function toTarget(row: StickerOrderRow) {
  return {
    _id: row._id,
    orderId: row.orderId,
    clientName: row.clientName,
    batchRef: row.batchRef,
    qtyOrdered: row.qtyOrdered,
    qtyWithOverage: row.qtyWithOverage,
    assignedPinName: row.assignedPinName,
    sku: row.sku,
    adminId: row.adminId,
  };
}

export function StickerOrdersPage() {
  const { openModal } = useModal();
  const { showToast } = useToast();
  const followUp = useFollowUp();
  const { can, role } = useRoleGates();
  const { openTriggerPinTarget, openDispatchTarget, openDownloadPackageTarget } = useApp();
  const { stickerOrders, stickerSummary, loading, refreshStickerOrders } = usePlatform();

  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('All Clients');
  const [stageFilter, setStageFilter] = useState('All Stages');
  const [acting, setActing] = useState<string | null>(null);

  const readOnly = role === 'am';
  const canCreate = can('newOrder');
  const canOps = can('download') && can('dispatch');
  const canTrigger = can('triggerPin');

  const clientNames = useMemo(() => {
    const names = new Set(stickerOrders.map((o) => o.clientName));
    return ['All Clients', ...Array.from(names).sort()];
  }, [stickerOrders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stickerOrders.filter((o) => {
      if (clientFilter !== 'All Clients' && o.clientName !== clientFilter) return false;
      if (stageFilter !== 'All Stages' && o.stageLabel !== stageFilter) return false;
      if (!q) return true;
      return (
        o.orderId.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        o.sku.toLowerCase().includes(q) ||
        o.batchRef.toLowerCase().includes(q)
      );
    });
  }, [stickerOrders, search, clientFilter, stageFilter]);

  const reload = useCallback(async () => {
    try {
      await refreshStickerOrders();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not load sticker orders.', 'error');
    }
  }, [refreshStickerOrders, showToast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const onDownload = async (row: StickerOrderRow) => {
    setActing(row._id);
    try {
      await platformApi.patchStickerOrder(row._id, { action: 'downloadPackage' });
      await refreshStickerOrders();
      openDownloadPackageTarget(toTarget(row));
      openModal('download-package');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Download failed.', 'error');
    } finally {
      setActing(null);
    }
  };

  const onMarkDelivered = async (row: StickerOrderRow) => {
    setActing(row._id);
    try {
      await platformApi.patchStickerOrder(row._id, { action: 'markDelivered' });
      await refreshStickerOrders();
      showToast(`${row.orderId} marked as delivered.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not update delivery.', 'error');
    } finally {
      setActing(null);
    }
  };

  const summary = stickerSummary ?? {
    pendingPin: 0,
    pendingQr: 0,
    readyDispatch: 0,
    inTransit: 0,
    total: 0,
  };

  return (
    <>
      <PageHeader
        title="🏷 Sticker Orders & Dispatch"
        subtitle="PIN generation · QR code requests · Print dispatch · Delivery tracking"
        actions={
          canCreate ? (
            <Button className="bacc" size="sm" onClick={() => openModal('sticker-order')}>
              + New Sticker Order
            </Button>
          ) : undefined
        }
      />

      {readOnly && (
        <div style={{ marginBottom: 12 }}>
          <InfoBanner>
            👁 <strong>Your accounts&apos; PIN pipeline.</strong> You can track sticker orders for your assigned
            clients and send follow-up nudges. PIN generation, downloads, and dispatch are actioned by Operations
            and the AI/ML Lead.
          </InfoBanner>
        </div>
      )}

      {role === 'aiml' && (
        <div
          style={{
            padding: '10px 14px',
            background: 'var(--ab)',
            border: '1px solid var(--amber)',
            borderRadius: 9,
            fontSize: 12,
            color: 'var(--at)',
            marginBottom: 12,
          }}
        >
          🤖 <strong>AI/ML generation queue.</strong> You execute PIN and QR code generation. Final print-package
          downloads are collected and dispatched by the CEO / Operations.
        </div>
      )}

      <div className="kgrid" style={{ marginBottom: 14 }}>
        <KCard
          label="Pending PIN Generation"
          value={String(summary.pendingPin)}
          trend="Awaiting Sartor action"
          trendType="dn"
          valueStyle={{ color: 'var(--at)' }}
        />
        <KCard
          label="Pending QR Generation"
          value={String(summary.pendingQr)}
          trend="AI/ML to action"
          trendType="dn"
          valueStyle={{ color: 'var(--at)' }}
        />
        <KCard
          label="Ready to Dispatch"
          value={String(summary.readyDispatch)}
          trend="Awaiting courier booking"
          trendType="up"
          valueStyle={{ color: 'var(--gt)' }}
        />
        <KCard label="In Transit" value={String(summary.inTransit)} trend="Tracking active" trendType="neu" />
      </div>

      <Card>
        <div className="ch">
          <div className="ct">Sticker Order Pipeline</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <input
              className="inp"
              style={{ width: 180, fontSize: 12 }}
              placeholder="Search order, SKU, client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="inp"
              style={{ width: 140, fontSize: 12 }}
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              {clientNames.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="inp"
              style={{ width: 150, fontSize: 12 }}
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              {STICKER_STAGE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="tw">
          <table style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Client</th>
                <th>SKU / Batch</th>
                <th>Qty Ordered</th>
                <th>Qty + 10%</th>
                <th>Stage</th>
                <th>PIN Status</th>
                <th>QR Status</th>
                <th>Download</th>
                <th>Dispatch</th>
                <th>Delivery</th>
                <th>Follow Up</th>
              </tr>
            </thead>
            <tbody>
              {loading && !stickerOrders.length ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: 24, color: 'var(--text3)' }}>
                    Loading sticker orders…
                  </td>
                </tr>
              ) : !filtered.length ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: 24, color: 'var(--text3)' }}>
                    No sticker orders match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row._id}>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{row.orderId}</td>
                    <td>
                      <strong>{row.clientName}</strong>
                    </td>
                    <td>
                      {row.sku}
                      {row.batchRef ? (
                        <>
                          <br />
                          <span style={{ color: 'var(--text3)', fontSize: 11 }}>{row.batchRef}</span>
                        </>
                      ) : null}
                    </td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{row.qtyOrdered.toLocaleString()}</td>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--gt)' }}>
                      {row.qtyWithOverage.toLocaleString()}
                    </td>
                    <td>
                      <DispatchBadge className={row.stageBadge}>{row.stageLabel}</DispatchBadge>
                    </td>
                    <td>
                      <div style={{ fontSize: 11 }}>
                        <div
                          style={{
                            color:
                              row.pinStatus === 'complete'
                                ? 'var(--gt)'
                                : row.pinStatus === 'generating'
                                  ? 'var(--bt)'
                                  : 'var(--at)',
                          }}
                        >
                          {row.pinStatus === 'complete' ? '✓' : '●'} {row.pinStatusLabel}
                          {row.pinStatus === 'generating' && row.pinJob?.target
                            ? ` (${(row.pinJob.generated || 0).toLocaleString()}/${row.pinJob.target.toLocaleString()})`
                            : ''}
                        </div>
                        {row.assignedPinName ? (
                          <div style={{ color: 'var(--text3)', marginTop: 2 }}>
                            Assigned: {row.assignedPinName}
                          </div>
                        ) : null}
                        {canTrigger && row.canTriggerPin && !readOnly && (
                          <Button
                            className="bacc"
                            size="sm"
                            style={{ marginTop: 4 }}
                            disabled={acting === row._id}
                            onClick={() => {
                              openTriggerPinTarget(toTarget(row));
                              openModal('trigger-pin');
                            }}
                          >
                            ⚙ Trigger Generation
                          </Button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 11 }}>
                        <div style={{ color: row.qrStatus === 'complete' ? 'var(--gt)' : 'var(--at)' }}>
                          {row.qrStatus === 'complete' ? '✓' : '●'} {row.qrStatusLabel}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!row.canDownload || !canOps || readOnly || acting === row._id}
                        style={!row.canDownload ? { opacity: 0.4 } : undefined}
                        title={row.canDownload ? 'Download sticker package' : 'Available after PIN+QR complete'}
                        onClick={() => onDownload(row)}
                      >
                        ⬇ Package
                      </Button>
                    </td>
                    <td>
                      {row.stage === 'in_transit' || row.stage === 'delivered' ? (
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {row.courier}
                          {row.trackingNumber ? ` · ${row.trackingNumber}` : ''}
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={!row.canDispatch || !canOps || readOnly}
                          style={!row.canDispatch ? { opacity: 0.4 } : undefined}
                          onClick={() => {
                            openDispatchTarget(toTarget(row));
                            openModal('dispatch-order');
                          }}
                        >
                          ✉ Dispatch
                        </Button>
                      )}
                    </td>
                    <td>
                      {row.stage === 'in_transit' && canOps && !readOnly ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={acting === row._id}
                          onClick={() => onMarkDelivered(row)}
                        >
                          Mark Delivered
                        </Button>
                      ) : (
                        <DispatchBadge
                          className={
                            row.deliveryStatus === 'delivered'
                              ? 'db-delivered'
                              : row.deliveryStatus === 'in_transit'
                                ? 'db-dispatched'
                                : 'db-pending'
                          }
                        >
                          {row.deliveryLabel}
                        </DispatchBadge>
                      )}
                    </td>
                    <td>
                        {can('followUp') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              followUp(
                                row.clientName,
                                `Follow-up on sticker order ${row.orderId} (${row.stageLabel}). Assigned: ${row.assignedPinName || 'unassigned'}.`,
                                row.adminId,
                              )
                            }
                          >
                            💬 Follow Up
                          </Button>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <div className="ch">
          <div className="ct">How Sticker Orders Work</div>
        </div>
        <div
          className="process-steps"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, fontSize: 11 }}
        >
          {STICKER_PROCESS_STEPS.map((s, i) => (
            <div
              key={s.title}
              style={{
                textAlign: 'center',
                padding: '12px 8px',
                borderRight: i < STICKER_PROCESS_STEPS.length - 1 ? '1px solid var(--border)' : undefined,
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{s.title}</div>
              <div style={{ color: 'var(--text3)' }}>{s.detail}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
