import { Outlet } from 'react-router-dom';
import { ModalsRoot } from '../../modals/ModalsRoot';
import { useSessionGuard } from '../../hooks/useSessionGuard';
import { Sidebar } from './Sidebar';
import { TopToolbar } from './TopToolbar';

export function AppLayout() {
  useSessionGuard();

  return (
    <div id="app">
      <Sidebar />
      <main id="main">
        <TopToolbar />
        <div className="cnt">
          <Outlet />
        </div>
      </main>
      <ModalsRoot />
    </div>
  );
}
