import { AppTheme } from "entities/AppTheming";
import { AppThemingMode } from "selectors/appThemingSelectors";
import { createImmerReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

export type AppThemingState = {
  stack: AppThemingMode[];
  selectedTheme: AppTheme;
  themes: AppTheme[];
  themesLoading: boolean;
  selectedThemeLoading: boolean;
  previewTheme?: AppTheme;
};

const initialState: AppThemingState = {
  stack: [],
  themes: [],
  themesLoading: false,
  selectedThemeLoading: false,
  previewTheme: undefined,
  selectedTheme: {
    id: "",
    name: "",
    created_by: "",
    created_at: "",
    config: {
      colors: {
        backgroundColor: "#f6f6f6",
        primaryColor: "",
        secondaryColor: "",
      },
      borderRadius: {},
      boxShadow: {},
      fontFamily: {},
    },
    properties: {
      colors: {
        backgroundColor: "#f6f6f6",
        primaryColor: "",
        secondaryColor: "",
      },
      borderRadius: {},
      boxShadow: {},
      fontFamily: {},
    },
    stylesheet: {},
  },
};

const themeReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_APP_THEMING_STACK]: (
    state: AppThemingState,
    action: ReduxAction<AppThemingMode[]>,
  ) => {
    state.stack = action.payload;
  },
  [ReduxActionTypes.FETCH_APP_THEMES_INIT]: (state: AppThemingState) => {
    state.themesLoading = true;
  },
  [ReduxActionTypes.FETCH_APP_THEMES_SUCCESS]: (
    state: AppThemingState,
    action: ReduxAction<AppTheme[]>,
  ) => {
    state.themesLoading = false;
    state.themes = action.payload;
  },
  [ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS]: (
    state: AppThemingState,
    action: ReduxAction<AppTheme>,
  ) => {
    state.themesLoading = false;
    state.selectedTheme = action.payload;
  },
  [ReduxActionTypes.UPDATE_SELECTED_APP_THEME_INIT]: () => {
    //
  },
  [ReduxActionTypes.SET_PREVIEW_APP_THEME]: (
    state: AppThemingState,
    action: ReduxAction<AppTheme | undefined>,
  ) => {
    state.previewTheme = action.payload;
  },
  [ReduxActionTypes.UPDATE_SELECTED_APP_THEME_SUCCESS]: (
    state: AppThemingState,
    action: ReduxAction<AppTheme>,
  ) => {
    state.previewTheme = undefined;
    state.selectedTheme = action.payload;
  },
  [ReduxActionTypes.CHANGE_SELECTED_APP_THEME_SUCCESS]: (
    state: AppThemingState,
    action: ReduxAction<AppTheme>,
  ) => {
    state.previewTheme = undefined;
    state.selectedTheme = action.payload;
  },
});

export default themeReducer;
