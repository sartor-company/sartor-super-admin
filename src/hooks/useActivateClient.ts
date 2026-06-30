import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import type { ActivateClientTarget } from '../types';
import type { Client } from '../data/clients';

export function clientProductsLabel(c: Pick<Client, 'products' | 'subscription' | 'crm' | 'scband'>): string {
  if (c.products && c.products !== '—') return c.products;
  const parts: string[] = [];
  if (c.scband) parts.push(`SC·${c.scband}`);
  if (c.crm) parts.push(c.crm);
  return parts.join(' · ') || '—';
}

export function useActivateClient() {
  const { openActivateClient } = useApp();
  const { openModal } = useModal();

  return useCallback(
    (target: ActivateClientTarget) => {
      openActivateClient(target);
      openModal('activate-client');
    },
    [openActivateClient, openModal],
  );
}
