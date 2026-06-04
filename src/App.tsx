import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ModalProvider } from './context/ModalContext';
import { ToastProvider } from './context/ToastContext';
import { ModalsRoot } from './modals/ModalsRoot';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ModalProvider>
          <AppProvider>
            <AppRoutes />
            <ModalsRoot />
          </AppProvider>
        </ModalProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
