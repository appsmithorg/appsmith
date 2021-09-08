import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const setIsGitSyncModalOpen = (isOpen: boolean) => ({
  type: ReduxActionTypes.SET_IS_GIT_SYNC_MODAL_OPEN,
  payload: isOpen,
});
