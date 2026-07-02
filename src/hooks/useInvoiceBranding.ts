import { useMemo } from 'react';
import { usePlatform } from '../context/PlatformContext';
import type { PlatformSettings } from '../types';
import type { InvoiceBranding } from '../utils/invoiceDownload';

export function useInvoiceBranding(): InvoiceBranding {
  const { settings } = usePlatform() as { settings: PlatformSettings | null };

  return useMemo(
    () => ({
      companyName: settings?.companyName || 'Sartor Limited',
      companyAddress: settings?.companyAddress || 'Lagos, Nigeria',
      companyEmail: settings?.companyEmail || 'billing@sartor.ng',
      companyPhone: settings?.companyPhone || '',
      bankAccounts: settings?.bankAccounts || [],
      exchangeRates: settings?.exchangeRates || { usd: 1580, gbp: 2010 },
      logoUrl: '/sartor-logo.jpg',
    }),
    [settings],
  );
}
