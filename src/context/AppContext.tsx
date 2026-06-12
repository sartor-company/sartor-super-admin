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
import { useAuthStore } from '../store/authStore';
import type {
  DoraLabelContext,
  InvestigationDetail,
  RoleId,
  TeamMemberEdit,
  TicketDetail,
} from '../types';

interface AppContextValue {
  role: RoleId;
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  selectedClient: Client | null;
  setSelectedClientCode: (code: string) => void;
  setSelectedClientDetail: (client: Client | null) => void;
  followUp: { client: string; clientId?: string; message: string; subject: string } | null;
  openFollowUp: (client: string, message?: string, clientId?: string) => void;
  investigation: InvestigationDetail | null;
  openInvestigation: (detail: InvestigationDetail) => void;
  notifOpen: boolean;
  setNotifOpen: (open: boolean) => void;
  notifDot: boolean;
  clearNotifDot: () => void;
  staffEditId: string | null;
  onboardingAssignId: string | null;
  investigationAssignId: string | null;
  ticketAssignId: string | null;
  ticketEscalateId: string | null;
  activeTicket: TicketDetail | null;
  doraLabel: DoraLabelContext | null;
  teamMemberClientId: string | null;
  teamMemberEdit: TeamMemberEdit | null;
  openStaffModal: (id: string | null) => void;
  openOnboardingAssign: (adminId: string | null) => void;
  openInvestigationAssign: (investigationId: string | null) => void;
  openTicketAssign: (ticketId: string | null) => void;
  openTicketEscalate: (ticketId: string | null) => void;
  openTicketView: (ticket: TicketDetail | null) => void;
  openDoraLabel: (label: DoraLabelContext | null) => void;
  openTeamMemberModal: (clientId: string, member?: TeamMemberEdit | null) => void;
  registerNoteHandler: (handler: ((text: string) => void) | null) => void;
  submitClientNote: (text: string) => void;
  registerTeamReload: (handler: (() => void) | null) => void;
  notifyTeamReload: () => void;
  registerClientReload: (handler: (() => void) | null) => void;
  notifyClientReload: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const authRole = useAuthStore((s) => s.user?.platformRole);
  const [role, setRoleState] = useState<RoleId>(authRole || 'super');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClientCode, setSelectedClientCode] = useState('SHC');
  const [selectedClientDetail, setSelectedClientDetail] = useState<Client | null>(null);
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
  const [onboardingAssignId, setOnboardingAssignId] = useState<string | null>(null);
  const [investigationAssignId, setInvestigationAssignId] = useState<string | null>(null);
  const [ticketAssignId, setTicketAssignId] = useState<string | null>(null);
  const [ticketEscalateId, setTicketEscalateId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<TicketDetail | null>(null);
  const [doraLabel, setDoraLabel] = useState<DoraLabelContext | null>(null);
  const [teamMemberClientId, setTeamMemberClientId] = useState<string | null>(null);
  const [teamMemberEdit, setTeamMemberEdit] = useState<TeamMemberEdit | null>(null);
  const noteHandlerRef = useRef<((text: string) => void) | null>(null);
  const teamReloadRef = useRef<(() => void) | null>(null);
  const clientReloadRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (authRole) setRoleState(authRole);
  }, [authRole]);

  const selectedClient = selectedClientDetail;

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

  const openTeamMemberModal = useCallback((clientId: string, member: TeamMemberEdit | null = null) => {
    setTeamMemberClientId(clientId);
    setTeamMemberEdit(member);
  }, []);

  const registerNoteHandler = useCallback((handler: ((text: string) => void) | null) => {
    noteHandlerRef.current = handler;
  }, []);

  const submitClientNote = useCallback((text: string) => {
    noteHandlerRef.current?.(text);
  }, []);

  const openOnboardingAssign = useCallback((adminId: string | null) => {
    setOnboardingAssignId(adminId);
  }, []);

  const openInvestigationAssign = useCallback((investigationId: string | null) => {
    setInvestigationAssignId(investigationId);
  }, []);

  const openTicketAssign = useCallback((ticketId: string | null) => {
    setTicketAssignId(ticketId);
  }, []);

  const openTicketEscalate = useCallback((ticketId: string | null) => {
    setTicketEscalateId(ticketId);
  }, []);

  const openTicketView = useCallback((ticket: TicketDetail | null) => {
    setActiveTicket(ticket);
  }, []);

  const openDoraLabel = useCallback((label: DoraLabelContext | null) => {
    setDoraLabel(label);
  }, []);

  const registerTeamReload = useCallback((handler: (() => void) | null) => {
    teamReloadRef.current = handler;
  }, []);

  const notifyTeamReload = useCallback(() => {
    teamReloadRef.current?.();
  }, []);

  const registerClientReload = useCallback((handler: (() => void) | null) => {
    clientReloadRef.current = handler;
  }, []);

  const notifyClientReload = useCallback(() => {
    clientReloadRef.current?.();
  }, []);

  const value = useMemo(
    () => ({
      role,
      sidebarOpen,
      openSidebar: () => setSidebarOpen(true),
      closeSidebar: () => setSidebarOpen(false),
      selectedClient,
      setSelectedClientCode,
      setSelectedClientDetail,
      followUp,
      openFollowUp,
      investigation,
      openInvestigation,
      notifOpen,
      setNotifOpen,
      notifDot,
      clearNotifDot,
      staffEditId,
      onboardingAssignId,
      investigationAssignId,
      ticketAssignId,
      ticketEscalateId,
      activeTicket,
      doraLabel,
      teamMemberClientId,
      teamMemberEdit,
      openStaffModal,
      openOnboardingAssign,
      openInvestigationAssign,
      openTicketAssign,
      openTicketEscalate,
      openTicketView,
      openDoraLabel,
      openTeamMemberModal,
      registerNoteHandler,
      submitClientNote,
      registerTeamReload,
      notifyTeamReload,
      registerClientReload,
      notifyClientReload,
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
      onboardingAssignId,
      investigationAssignId,
      ticketAssignId,
      ticketEscalateId,
      activeTicket,
      doraLabel,
      teamMemberClientId,
      teamMemberEdit,
      openStaffModal,
      openOnboardingAssign,
      openInvestigationAssign,
      openTicketAssign,
      openTicketEscalate,
      openTicketView,
      openDoraLabel,
      openTeamMemberModal,
      registerNoteHandler,
      submitClientNote,
      registerTeamReload,
      notifyTeamReload,
      registerClientReload,
      notifyClientReload,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
