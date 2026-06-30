import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { RoleGuard, RoleHomeRedirect } from '../components/RoleGuard';
import { AppLayout } from '../components/layout/AppLayout';
import { PlatformProvider } from '../context/PlatformContext';
import { LoginPage } from '../pages/LoginPage';
import {
  AimlDashboardPage,
  AimlQueuePage,
  AmDashboardPage,
  ClientDetailPage,
  ClientsPage,
  FinancePage,
  InvestigationsPage,
  OnboardingPage,
  OpsDashboardPage,
  OverviewPage,
  ReportsPage,
  SettingsPage,
  SupportPage,
  StickerOrdersPage,
} from '../pages';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <PlatformProvider>
              <AppLayout />
            </PlatformProvider>
          }
        >
          <Route element={<RoleGuard />}>
            <Route index element={<OverviewPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/:code" element={<ClientDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="investigations" element={<InvestigationsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="ops" element={<OpsDashboardPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="sticker-orders" element={<StickerOrdersPage />} />
            <Route path="am" element={<AmDashboardPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="aiml" element={<AimlDashboardPage />} />
            <Route path="aiml/queue" element={<AimlQueuePage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="*" element={<RoleHomeRedirect />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
