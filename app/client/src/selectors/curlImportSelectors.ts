import type { DefaultRootState } from "react-redux";

export const getIsImportingCurl = (state: DefaultRootState) =>
  state.ui.imports.isImportingCurl;

export const getIsCurlModalOpen = (state: DefaultRootState) =>
  state.ui.imports.isCurlModalOpen;
