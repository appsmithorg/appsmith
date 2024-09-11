import type { AppState } from "ee/reducers";

export const getIsImportingCurl = (state: AppState) =>
  state.ui.imports.isImportingCurl;

export const getIsCurlModalOpen = (state: AppState) =>
  state.ui.imports.isCurlModalOpen;
