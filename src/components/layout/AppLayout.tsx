import { Outlet } from 'react-router-dom';
import { RoleBar } from './RoleBar';
import { Sidebar } from './Sidebar';
import { TopToolbar } from './TopToolbar';

export function AppLayout() {
  return (
    <>
      <RoleBar />
      <div id="app">
        <Sidebar />
        <main id="main">
          <TopToolbar />
          <div className="cnt">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
