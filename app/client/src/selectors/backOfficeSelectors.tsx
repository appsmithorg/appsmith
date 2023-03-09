import { AppState } from "@appsmith/reducers";

export const getIsBackOfficeModalOpen = (state: AppState) =>
  state.ui.backOffice.isBackOfficeModalOpen;

export const getIsBackOfficeConnected = (state: AppState) =>
  state.ui.backOffice.isBackOfficeConnected;
