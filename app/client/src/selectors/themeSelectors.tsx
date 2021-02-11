import { AppState } from "reducers";
import {
  AUTH_LOGIN_URL,
  SIGN_UP_URL,
  RESET_PASSWORD_URL,
  FORGOT_PASSWORD_URL,
  VIEWER_URL_REGEX,
} from "constants/routes";
import { theme, dark, light } from "constants/DefaultTheme";

const enforceDarkThemeRoutes = [
  AUTH_LOGIN_URL,
  SIGN_UP_URL,
  RESET_PASSWORD_URL,
  FORGOT_PASSWORD_URL,
];
const getShouldEnforceDarkTheme = () => {
  const currentPath = window.location.pathname;
  return enforceDarkThemeRoutes.some(
    (path: string) => currentPath.indexOf(path) !== -1,
  );
};

export const getThemeDetails = (
  state: AppState,
  variant?: "dark" | "light",
) => {
  if (variant) {
    const colors = variant === "light" ? light : dark;

    return {
      mode: state.ui.theme.mode,
      theme: { ...theme, colors: { ...theme.colors, ...colors } },
    };
  }

  return {
    theme: state.ui.theme.theme,
    mode: state.ui.theme.mode,
  };
};

export const getAppCardColorPallete = (state: AppState) => {
  return state.ui.theme.theme.colors.appCardColors;
};
