import { AppTheme } from "entities/AppTheming";
import { AppThemingMode } from "selectors/appThemingSelectors";
import { createImmerReducer } from "utils/ReducerUtils";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";

export type AppThemingState = {
  isSaving: boolean;
  isChanging: boolean;
  stack: AppThemingMode[];
  selectedTheme: AppTheme;
  themes: AppTheme[];
  themesLoading: boolean;
  selectedThemeLoading: boolean;
  isBetaCardShown: boolean;
};

const initialState: AppThemingState = {
  stack: [],
  themes: [],
  isSaving: false,
  isChanging: false,
  themesLoading: false,
  isBetaCardShown: true,
  selectedThemeLoading: false,
  selectedTheme: {
    id: "",
    name: "",
    displayName: "",
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
    state.stack = [];
  },
  [ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS]: (
    state: AppThemingState,
    action: ReduxAction<AppTheme>,
  ) => {
    state.themesLoading = false;
    state.selectedTheme = action.payload;
  },
  [ReduxActionTypes.UPDATE_SELECTED_APP_THEME_INIT]: (
    state: AppThemingState,
  ) => {
    state.isSaving = true;
  },
  [ReduxActionTypes.UPDATE_SELECTED_APP_THEME_SUCCESS]: (
    state: AppThemingState,
    action: ReduxAction<AppTheme>,
  ) => {
    state.isSaving = false;
    state.selectedTheme = action.payload;
  },
  [ReduxActionTypes.CHANGE_SELECTED_APP_THEME_INIT]: (
    state: AppThemingState,
  ) => {
    state.isChanging = true;
  },
  [ReduxActionTypes.CHANGE_SELECTED_APP_THEME_SUCCESS]: (
    state: AppThemingState,
    action: ReduxAction<AppTheme>,
  ) => {
    state.isChanging = false;
    state.selectedTheme = action.payload;
  },
  [ReduxActionTypes.DELETE_APP_THEME_SUCCESS]: (
    state: AppThemingState,
    action: ReduxAction<{ themeId: string }>,
  ) => {
    state.themes = state.themes.filter(
      (theme) => theme.id !== action.payload.themeId,
    );
  },
  [ReduxActionTypes.SAVE_APP_THEME_SUCCESS]: (
    state: AppThemingState,
    action: ReduxAction<AppTheme>,
  ) => {
    state.themes.push(action.payload);
  },
  [ReduxActionTypes.UPDATE_BETA_CARD_SHOWN]: (
    state: AppThemingState,
    action: ReduxAction<boolean>,
  ) => {
    state.isBetaCardShown = action.payload;
  },
  [ReduxActionTypes.CLOSE_BETA_CARD_SHOWN]: (state: AppThemingState) => {
    state.isBetaCardShown = true;
  },
  [ReduxActionTypes.SELECT_WIDGET_INIT]: (state: AppThemingState) => {
    state.stack = [];
  },
  [ReduxActionTypes.START_CANVAS_SELECTION]: (state: AppThemingState) => {
    state.stack = [];
  },
});

export default themeReducer;
