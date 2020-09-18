import { createImmerReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { theme, light, dark } from "constants/DefaultTheme";

export enum ThemeMode {
  LIGHT = "LIGHT",
  DARK = "DARK",
}
const initialState: ThemeState = {
  mode: ThemeMode.DARK,
  theme: {
    ...theme,
    colors: {
      ...theme.colors,
      ...dark,
    },
  },
};

export interface ThemeState {
  mode: ThemeMode;
  theme: any;
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
    switch (action.payload) {
      case ThemeMode.DARK:
        completeTheme.colors = {
          ...completeTheme.colors,
          ...dark,
        };
        break;
      default:
        completeTheme.colors = {
          ...completeTheme.colors,
          ...light,
        };
        break;
    }
    draftState.theme = completeTheme;
  },
});

export default themeReducer;
