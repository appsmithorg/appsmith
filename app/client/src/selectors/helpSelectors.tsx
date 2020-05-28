import { AppState } from "reducers";

export const getHelpUrl = (state: AppState): string => state.ui.help.url;
export const getHelpModalOpen = (state: AppState): boolean =>
  state.ui.help.modalOpen;

export const getHelpModalDimensions = (
  state: AppState,
): { height: number; width: number } => {
  return {
    height: state.ui.help.height,
    width: state.ui.help.width,
  };
};

export const getDefaultRefinement = (state: AppState): string => {
  return state.ui.help.defaultRefinement || "";
};
