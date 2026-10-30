import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { dark, light, theme } from "constants/DefaultTheme";
import { getResolvedThemeMode, ThemeMode } from "selectors/themeSelectors";
import localStorage from "utils/localStorage";

const savedThemeMode = localStorage.getItem("THEME");
const isThemeMode = (mode: string | null): mode is ThemeMode =>
  Object.values(ThemeMode).some((themeMode) => themeMode === mode);
const initialThemeMode = isThemeMode(savedThemeMode)
  ? savedThemeMode
  : ThemeMode.LIGHT;
const initialColors =
  getResolvedThemeMode(initialThemeMode) === ThemeMode.DARK ? dark : light;
const initialState: ThemeState = {
  mode: initialThemeMode,
  theme: {
    ...theme,
    colors: {
      ...theme.colors,
      ...initialColors,
    },
  },
  hideHeaderShadow: false,
  showHeaderSeparator: false,
};

export type ThemeState = HeaderMetaState & {
  mode: ThemeMode;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  theme: any;
};

export interface HeaderMetaState {
  hideHeaderShadow: boolean;
  showHeaderSeparator: boolean;
}

const themeReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_THEME]: (
    draftState: ThemeState,
    action: ReduxAction<ThemeMode>,
  ) => {
    draftState.mode = action.payload;
    const completeTheme = {
      ...theme,
    };

    const colors =
      getResolvedThemeMode(action.payload) === ThemeMode.DARK ? dark : light;

    completeTheme.colors = {
      ...completeTheme.colors,
      ...colors,
    };
    draftState.theme = completeTheme;
  },
  [ReduxActionTypes.SET_HEADER_META]: (
    draftState: ThemeState,
    action: ReduxAction<HeaderMetaState>,
  ) => {
    draftState.hideHeaderShadow = action.payload.hideHeaderShadow;
    draftState.showHeaderSeparator = action.payload.showHeaderSeparator;
  },
});

export default themeReducer;
