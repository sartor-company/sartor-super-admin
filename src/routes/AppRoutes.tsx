import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
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
} from '../pages';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:code" element={<ClientDetailPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="investigations" element={<InvestigationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="ops" element={<OpsDashboardPage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="am" element={<AmDashboardPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="aiml" element={<AimlDashboardPage />} />
        <Route path="aiml/queue" element={<AimlQueuePage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
