import { Outlet } from 'react-router-dom';
import { ModalsRoot } from '../../modals/ModalsRoot';
import { Sidebar } from './Sidebar';
import { TopToolbar } from './TopToolbar';

export function AppLayout() {
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
