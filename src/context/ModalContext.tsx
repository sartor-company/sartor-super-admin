import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ModalId } from '../types';

interface ModalContextValue {
  openModal: (id: ModalId) => void;
  closeModal: (id: ModalId) => void;
  isOpen: (id: ModalId) => boolean;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Set<ModalId>>(new Set());

  const openModal = useCallback((id: ModalId) => {
    setOpen((prev) => new Set(prev).add(id));
  }, []);

  const closeModal = useCallback((id: ModalId) => {
    setOpen((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isOpen = useCallback((id: ModalId) => open.has(id), [open]);

  const value = useMemo(
    () => ({ openModal, closeModal, isOpen }),
    [openModal, closeModal, isOpen],
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}
