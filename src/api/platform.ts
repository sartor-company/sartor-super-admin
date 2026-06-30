import { apiClient, unwrap } from './client';
import type { Client } from '../data/clients';
import type { InvestigationRow } from '../data/investigations';
import type { OnboardingRow } from '../data/onboarding';
import type { StickerOrderRow, StickerOrderSummary } from '../data/stickerOrders';
import type { PlatformNotification } from '../types';

export const platformApi = {
  login: (email: string, password: string) =>
    apiClient
      .post('/auth/login', { email, password })
      .then((r) =>
        unwrap<{
          accountType: string;
          platformRole?: string;
          _id: string;
          fullName: string;
          email: string;
          token: string;
        }>(r),
      ),

  overview: () => apiClient.get('/sartor/overview').then((r) => unwrap(r)),

  notifications: () =>
    apiClient.get('/sartor/notifications').then((r) => unwrap<{ data: PlatformNotification[] }>(r)),

  dashboard: () => apiClient.get('/sartor/dashboard').then((r) => unwrap(r)),

  clients: (params?: {
    search?: string;
    status?: string;
    product?: string;
    accountStatus?: string;
  }) =>
    apiClient.get('/sartor/clients', { params }).then((r) => unwrap<{ data: Client[] }>(r)),

  client: (code: string) =>
    apiClient.get(`/sartor/clients/${code}`).then((r) => unwrap(r)),

  toggleClient: (id: string) =>
    apiClient.patch(`/sartor/company/status/${id}`).then((r) => unwrap(r)),

  patchClient: (id: string, body: Record<string, unknown>) =>
    apiClient.patch(`/sartor/clients/${id}`, body).then((r) => unwrap(r)),

  addNote: (id: string, text: string, warn?: boolean) =>
    apiClient.post(`/sartor/clients/${id}/notes`, { text, warn }).then((r) => unwrap(r)),

  createClientUser: (clientId: string, body: Record<string, unknown>) =>
    apiClient.post(`/sartor/clients/${clientId}/users`, body).then((r) => unwrap(r)),

  patchClientUser: (clientId: string, userId: string, body: Record<string, unknown>) =>
    apiClient.patch(`/sartor/clients/${clientId}/users/${userId}`, body).then((r) => unwrap(r)),

  convertPilot: (clientId: string, body: Record<string, unknown>) =>
    apiClient.post(`/sartor/clients/${clientId}/convert-pilot`, body).then((r) => unwrap(r)),

  onboarding: () =>
    apiClient.get('/sartor/onboarding').then((r) => unwrap<{ data: OnboardingRow[] }>(r)),

  onboard: (body: Record<string, unknown>) =>
    apiClient.post('/sartor/onboard', body).then((r) => unwrap(r)),

  activateClient: (id: string, body?: { mode?: 'paid' | 'credit'; reason?: string }) =>
    apiClient.post(`/sartor/clients/${id}/activate`, body ?? {}).then((r) => unwrap(r)),

  patchOnboarding: (id: string, body: Record<string, unknown>) =>
    apiClient.patch(`/sartor/onboarding/${id}`, body).then((r) => unwrap(r)),

  onboardingStickerDesign: (adminId: string) =>
    apiClient.get(`/sartor/onboarding/${adminId}/sticker-design`).then((r) => unwrap(r)),

  createOnboardingProduct: (adminId: string, body: Record<string, unknown>) =>
    apiClient.post(`/sartor/onboarding/${adminId}/products`, body).then((r) => unwrap(r)),

  followUp: (id: string, message: string, subject?: string) =>
    apiClient.post(`/sartor/clients/${id}/follow-up`, { message, subject }).then((r) => unwrap(r)),

  financeSummary: () => apiClient.get('/sartor/finance/summary').then((r) => unwrap(r)),

  invoices: (params?: { status?: string; client?: string }) =>
    apiClient.get('/sartor/invoices', { params }).then((r) => unwrap(r)),

  createInvoice: (body: Record<string, unknown>) =>
    apiClient.post('/sartor/invoices', body).then((r) => unwrap(r)),

  updateInvoice: (id: string, body: Record<string, unknown>) =>
    apiClient.patch(`/sartor/invoices/${id}`, body).then((r) => unwrap(r)),

  payInvoice: (id: string, email?: string) =>
    apiClient.post(`/sartor/invoices/${id}/pay`, { email }).then((r) => unwrap(r)),

  doraQueue: () => apiClient.get('/sartor/dora/queue').then((r) => unwrap(r)),

  doraStats: () => apiClient.get('/sartor/dora/stats').then((r) => unwrap(r)),

  patchDoraLabel: (id: string, body: Record<string, unknown>) =>
    apiClient.patch(`/sartor/dora/labels/${id}`, body).then((r) => unwrap(r)),

  doraResubmit: (id: string, body: Record<string, unknown>) =>
    apiClient.post(`/sartor/dora/labels/${id}/resubmit`, body).then((r) => unwrap(r)),

  uploadDoraLabel: (id: string, form: FormData) =>
    apiClient
      .post(`/sartor/dora/labels/${id}/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => unwrap(r)),

  investigations: () =>
    apiClient.get('/sartor/investigations').then((r) => unwrap<{ data: InvestigationRow[] }>(r)),

  createInvestigation: (body: Record<string, unknown>) =>
    apiClient.post('/sartor/investigations', body).then((r) => unwrap(r)),

  patchInvestigation: (id: string, body: Record<string, unknown>) =>
    apiClient.patch(`/sartor/investigations/${id}`, body).then((r) => unwrap(r)),

  tickets: () => apiClient.get('/sartor/tickets').then((r) => unwrap(r)),

  createTicket: (body: Record<string, unknown>) =>
    apiClient.post('/sartor/tickets', body).then((r) => unwrap(r)),

  patchTicket: (id: string, body: Record<string, unknown>) =>
    apiClient.patch(`/sartor/tickets/${id}`, body).then((r) => unwrap(r)),

  staff: () => apiClient.get('/sartor/staff').then((r) => unwrap(r)),

  createStaff: (body: Record<string, unknown>) =>
    apiClient.post('/sartor/staff', body).then((r) => unwrap(r)),

  patchStaff: (id: string, body: Record<string, unknown>) =>
    apiClient.patch(`/sartor/staff/${id}`, body).then((r) => unwrap(r)),

  settings: () => apiClient.get('/sartor/settings').then((r) => unwrap(r)),

  patchSettings: (body: Record<string, unknown>) =>
    apiClient.patch('/sartor/settings', body).then((r) => unwrap(r)),

  reports: () => apiClient.get('/sartor/reports/summary').then((r) => unwrap(r)),

  charts: () => apiClient.get('/sartor/charts').then((r) => unwrap(r)),

  stickerOrders: (params?: { search?: string; client?: string; stage?: string }) =>
    apiClient
      .get('/sartor/sticker-orders', { params })
      .then((r) =>
        unwrap<{ data: StickerOrderRow[]; summary: StickerOrderSummary }>(r),
      ),

  createStickerOrder: (body: Record<string, unknown>) =>
    apiClient.post('/sartor/sticker-orders', body).then((r) => unwrap(r)),

  patchStickerOrder: (id: string, body: Record<string, unknown>) =>
    apiClient.patch(`/sartor/sticker-orders/${id}`, body).then((r) => unwrap(r)),
};
