import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import type { TeamMemberEdit } from '../types';

export function useFollowUp() {
  const { openFollowUp } = useApp();
  const { openModal } = useModal();

  return useCallback(
    (client: string, message = '', clientId?: string) => {
      openFollowUp(client, message, clientId);
      openModal('followup');
    },
    [openFollowUp, openModal],
  );
}

export function useOpenStaff() {
  const { openStaffModal } = useApp();
  const { openModal } = useModal();

  return useCallback(
    (id: string | null) => {
      openStaffModal(id);
      openModal('staff');
    },
    [openStaffModal, openModal],
  );
}

export function useOpenTeamMember() {
  const { openTeamMemberModal } = useApp();
  const { openModal } = useModal();

  return useCallback(
    (clientId: string, member: TeamMemberEdit | null = null) => {
      openTeamMemberModal(clientId, member);
      openModal('teammember');
    },
    [openTeamMemberModal, openModal],
  );
}
