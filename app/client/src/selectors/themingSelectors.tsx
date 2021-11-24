import { AppState } from "reducers";

export enum ThemingMode {
  THEME_EDIT = "THEME_EDIT",
  THEME_SELECTION = "THEME_SELECTION",
}

/**
 * returns the theming mode ( edit, selection, variant editor )
 *
 * @param state
 * @returns
 */
export const getThemingMode = (state: AppState) => {
  return state.ui.theming.mode;
};
