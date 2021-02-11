import { AppState } from "reducers";
import { dark, light, theme } from "constants/DefaultTheme";

export enum ThemeMode {
  LIGHT = "LIGHT",
  DARK = "DARK",
}
export const getThemeDetails = (state: AppState, variant?: ThemeMode) => {
  debugger;
  if (variant) {
    const colors = variant === ThemeMode.LIGHT ? light : dark;

    return {
      mode: variant,
      theme: { ...theme, colors: { ...theme.colors, ...colors } },
    };
  }

  return {
    theme: state.ui.theme.theme,
    mode: state.ui.theme.mode,
  };
};

export const getAppCardColorPalette = (state: AppState) => {
  return state.ui.theme.theme.colors.appCardColors;
};
