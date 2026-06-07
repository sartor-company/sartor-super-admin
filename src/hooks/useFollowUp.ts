import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';

export function useFollowUp() {
  const { openFollowUp } = useApp();
  const { openModal } = useModal();

  return useCallback(
    (client: string, message = '') => {
      openFollowUp(client, message);
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
    (name: string | null) => {
      openTeamMemberModal(name);
      openModal('teammember');
    },
    [openTeamMemberModal, openModal],
  );
}
