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
import { useNavigate } from 'react-router-dom';
import { ROLES } from '../constants/roles';
import type { Client } from '../data/clients';
import { CLIENTS } from '../data/clients';
import { useAuthStore } from '../store/authStore';
import type { InvestigationDetail, RoleId } from '../types';

interface AppContextValue {
  role: RoleId;
  setRole: (role: RoleId) => void;
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  selectedClient: Client | null;
  setSelectedClientCode: (code: string) => void;
  followUp: { client: string; message: string; subject: string } | null;
  openFollowUp: (client: string, message?: string) => void;
  investigation: InvestigationDetail | null;
  openInvestigation: (detail: InvestigationDetail) => void;
  notifOpen: boolean;
  setNotifOpen: (open: boolean) => void;
  notifDot: boolean;
  clearNotifDot: () => void;
  staffEditName: string | null;
  teamMemberEditName: string | null;
  openStaffModal: (name: string | null) => void;
  openTeamMemberModal: (name: string | null) => void;
  registerNoteHandler: (handler: ((text: string) => void) | null) => void;
  submitClientNote: (text: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const authRole = useAuthStore((s) => s.user?.platformRole);
  const [role, setRoleState] = useState<RoleId>(authRole || 'super');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClientCode, setSelectedClientCode] = useState('SHC');
  const [followUp, setFollowUp] = useState<{
    client: string;
    message: string;
    subject: string;
  } | null>(null);
  const [investigation, setInvestigation] = useState<InvestigationDetail | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifDot, setNotifDot] = useState(true);
  const [staffEditName, setStaffEditName] = useState<string | null>(null);
  const [teamMemberEditName, setTeamMemberEditName] = useState<string | null>(null);
  const noteHandlerRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    if (authRole) setRoleState(authRole);
  }, [authRole]);

  const selectedClient = useMemo(
    () => CLIENTS.find((c) => c.code === selectedClientCode) ?? null,
    [selectedClientCode],
  );

  const setRole = useCallback(
    (next: RoleId) => {
      setRoleState(next);
      navigate(ROLES[next].defaultPath);
      setSidebarOpen(false);
    },
    [navigate],
  );

  const openFollowUp = useCallback((client: string, message = '') => {
    setFollowUp({
      client,
      message,
      subject: `Follow-up: ${client}`,
    });
  }, []);

  const openInvestigation = useCallback((detail: InvestigationDetail) => {
    setInvestigation(detail);
  }, []);

  const clearNotifDot = useCallback(() => setNotifDot(false), []);

  const openStaffModal = useCallback((name: string | null) => {
    setStaffEditName(name);
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
      setRole,
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
      staffEditName,
      teamMemberEditName,
      openStaffModal,
      openTeamMemberModal,
      registerNoteHandler,
      submitClientNote,
    }),
    [
      role,
      setRole,
      sidebarOpen,
      selectedClient,
      followUp,
      openFollowUp,
      investigation,
      openInvestigation,
      notifOpen,
      notifDot,
      clearNotifDot,
      staffEditName,
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
