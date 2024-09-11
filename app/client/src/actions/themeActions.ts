import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { ThemeMode } from "selectors/themeSelectors";

export const setThemeMode = (mode: ThemeMode) => ({
  type: ReduxActionTypes.SET_THEME,
  payload: mode,
});

export const setHeaderMeta = (
  hideHeaderShadow: boolean,
  showHeaderSeparator: boolean,
) => ({
  type: ReduxActionTypes.SET_HEADER_META,
  payload: { hideHeaderShadow, showHeaderSeparator },
});
