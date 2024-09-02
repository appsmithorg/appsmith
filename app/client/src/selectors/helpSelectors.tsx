import type { AppState } from "ee/reducers";

export const getHelpModalOpen = (state: AppState): boolean =>
  state.ui.help.modalOpen;

export const getDefaultRefinement = (state: AppState): string => {
  return state.ui.help.defaultRefinement || "";
};
