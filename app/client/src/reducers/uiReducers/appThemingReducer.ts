import { AppTheme } from "entities/AppTheming";
import { AppThemingMode } from "selectors/appThemingSelectors";
import { createImmerReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

export type AppThemingState = {
  mode: AppThemingMode;
  selectedTheme: AppTheme;
  themes: AppTheme[];
  isLoading: boolean;
};

const initialState: AppThemingState = {
  mode: AppThemingMode.APP_THEME_EDIT,
  themes: [],
  isLoading: true,
  selectedTheme: {
    config: {
      colors: {},
      borderRadius: {},
      boxShadow: {},
      boxShadowColor: {},
      fontFamily: {},
    },
    variants: {},
    properties: {
      colors: {},
      borderRadius: {},
      boxShadow: {},
      boxShadowColor: {},
      fontFamily: {},
    },
    stylesheet: {},
  },
};

const themeReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_APP_THEMING_MODE]: (
    state: AppThemingState,
    action: ReduxAction<AppThemingMode>,
  ) => {
    state.mode = action.payload;
  },
  [ReduxActionTypes.FETCH_APP_THEMES_INIT]: (state: AppThemingState) => {
    state.isLoading = true;
  },
  [ReduxActionTypes.FETCH_APP_THEMES_SUCCESS]: (
    state: AppThemingState,
    action: ReduxAction<AppTheme[]>,
  ) => {
    state.isLoading = false;
    state.themes = action.payload;
  },
  [ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS]: (
    state: AppThemingState,
    action: ReduxAction<AppTheme>,
  ) => {
    state.isLoading = false;
    state.selectedTheme = action.payload;
  },
});

export default themeReducer;
