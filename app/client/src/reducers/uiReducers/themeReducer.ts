import { createImmerReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { dark, light, theme } from "constants/DefaultTheme";
import { ThemeMode } from "../../selectors/themeSelectors";

const initialState: ThemeState = {
  mode: ThemeMode.LIGHT,
  theme: {
    ...theme,
    colors: {
      ...theme.colors,
      ...light,
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
