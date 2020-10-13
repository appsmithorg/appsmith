import { AppState } from "reducers";

export const getThemeDetails = (state: AppState) => {
  return {
    theme: state.ui.theme.theme,
    mode: state.ui.theme.mode,
  };
};

export const getAppCardColorPallete = (state: AppState) => {
  return state.ui.theme.theme.colors.appCardColors;
};
