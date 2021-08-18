import { AppState } from "reducers";

export const getCrudInfoModalOpen = (state: AppState): boolean =>
  state.ui.crudInfoModal.crudInfoModalOpen;
