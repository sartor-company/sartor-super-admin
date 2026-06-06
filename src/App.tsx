import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ModalProvider } from './context/ModalContext';
import { PlatformProvider } from './context/PlatformContext';
import { ToastProvider } from './context/ToastContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ModalProvider>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </ModalProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
