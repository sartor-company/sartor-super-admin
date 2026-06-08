import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Client } from '../data/clients';
import { CLIENTS } from '../data/clients';
import { useAuthStore } from '../store/authStore';
import type { InvestigationDetail, RoleId } from '../types';

interface AppContextValue {
  role: RoleId;
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  selectedClient: Client | null;
  setSelectedClientCode: (code: string) => void;
  followUp: { client: string; clientId?: string; message: string; subject: string } | null;
  openFollowUp: (client: string, message?: string, clientId?: string) => void;
  investigation: InvestigationDetail | null;
  openInvestigation: (detail: InvestigationDetail) => void;
  notifOpen: boolean;
  setNotifOpen: (open: boolean) => void;
  notifDot: boolean;
  clearNotifDot: () => void;
  staffEditId: string | null;
  teamMemberEditName: string | null;
  openStaffModal: (id: string | null) => void;
  openTeamMemberModal: (name: string | null) => void;
  registerNoteHandler: (handler: ((text: string) => void) | null) => void;
  submitClientNote: (text: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const authRole = useAuthStore((s) => s.user?.platformRole);
  const [role, setRoleState] = useState<RoleId>(authRole || 'super');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClientCode, setSelectedClientCode] = useState('SHC');
  const [followUp, setFollowUp] = useState<{
    client: string;
    clientId?: string;
    message: string;
    subject: string;
  } | null>(null);
  const [investigation, setInvestigation] = useState<InvestigationDetail | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifDot, setNotifDot] = useState(true);
  const [staffEditId, setStaffEditId] = useState<string | null>(null);
  const [teamMemberEditName, setTeamMemberEditName] = useState<string | null>(null);
  const noteHandlerRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    if (authRole) setRoleState(authRole);
  }, [authRole]);

  const selectedClient = useMemo(
    () => CLIENTS.find((c) => c.code === selectedClientCode) ?? null,
    [selectedClientCode],
  );

  const openFollowUp = useCallback((client: string, message = '', clientId?: string) => {
    setFollowUp({
      client,
      clientId,
      message,
      subject: `Follow-up: ${client}`,
    });
  }, []);

  const openInvestigation = useCallback((detail: InvestigationDetail) => {
    setInvestigation(detail);
  }, []);

  const clearNotifDot = useCallback(() => setNotifDot(false), []);

  const openStaffModal = useCallback((id: string | null) => {
    setStaffEditId(id);
  }, []);

  const openTeamMemberModal = useCallback((name: string | null) => {
    setTeamMemberEditName(name);
  }, []);

  const registerNoteHandler = useCallback((handler: ((text: string) => void) | null) => {
    noteHandlerRef.current = handler;
  }, []);

  const submitClientNote = useCallback((text: string) => {
    noteHandlerRef.current?.(text);
  }, []);

  const value = useMemo(
    () => ({
      role,
      sidebarOpen,
      openSidebar: () => setSidebarOpen(true),
      closeSidebar: () => setSidebarOpen(false),
      selectedClient,
      setSelectedClientCode,
      followUp,
      openFollowUp,
      investigation,
      openInvestigation,
      notifOpen,
      setNotifOpen,
      notifDot,
      clearNotifDot,
      staffEditId,
      teamMemberEditName,
      openStaffModal,
      openTeamMemberModal,
      registerNoteHandler,
      submitClientNote,
    }),
    [
      role,
      sidebarOpen,
      selectedClient,
      followUp,
      openFollowUp,
      investigation,
      openInvestigation,
      notifOpen,
      notifDot,
      clearNotifDot,
      staffEditId,
      teamMemberEditName,
      openStaffModal,
      openTeamMemberModal,
      registerNoteHandler,
      submitClientNote,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
