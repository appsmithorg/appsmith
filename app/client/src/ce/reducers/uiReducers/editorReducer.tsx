import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import moment from "moment";
import type {
  LayoutOnLoadActionErrors,
  PageAction,
} from "constants/AppsmithActionConstants/ActionConstants";
import type { UpdatePageResponse } from "api/PageApi";
import type { UpdateCanvasPayload } from "actions/pageActions";

export const initialState: EditorReduxState = {
  widgetConfigBuilt: false,
  initialized: false,
  loadingStates: {
    publishing: false,
    publishingError: false,
    saving: false,
    savingError: false,
    savingEntity: false,
    loading: false,
    loadingError: false,
    pageSwitchingError: false,
    isPageSwitching: false,
    creatingPage: false,
    creatingPageError: false,
    cloningPage: false,
    cloningPageError: false,
    updatingWidgetName: false,
    updateWidgetNameError: false,
    isSettingUpPage: false,
  },
  isSnipingMode: false,
  snipModeBindTo: undefined,
  isPreviewMode: false,
  isProtectedMode: true,
  zoomLevel: 1,
};

export const handlers = {
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: (state: EditorReduxState) => {
    return {
      ...state,
      currentPageId: undefined,
      currentPageName: undefined,
      currentLayoutId: undefined,
      currentApplicationId: undefined,
      pageWidgetId: undefined,
      pageActions: undefined,
      layoutOnLoadActionErrors: undefined,
      loadingStates: {
        ...state.loadingStates,
        saving: false,
        savingEntity: false,
      },
    };
  },
  [ReduxActionTypes.RESET_EDITOR_SUCCESS]: (state: EditorReduxState) => {
    return { ...state, initialized: false };
  },
  [ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS]: (state: EditorReduxState) => {
    return { ...state, initialized: true };
  },
  [ReduxActionTypes.UPDATE_PAGE_SUCCESS]: (
    state: EditorReduxState,
    action: ReduxAction<UpdatePageResponse>,
  ) => {
    if (action.payload.id === state.currentPageId) {
      return { ...state, currentPageName: action.payload.name };
    }

    return state;
  },
  [ReduxActionTypes.FETCH_PAGE_INIT]: (state: EditorReduxState) => ({
    ...state,
    loadingStates: {
      ...state.loadingStates,
      isPageSwitching: true,
    },
  }),
  [ReduxActionTypes.FETCH_PAGE_SUCCESS]: (state: EditorReduxState) => ({
    ...state,
    loadingStates: {
      ...state.loadingStates,
      isPageSwitching: false,
    },
  }),
  [ReduxActionErrorTypes.FETCH_PAGE_ERROR]: (state: EditorReduxState) => ({
    ...state,
    loadingStates: {
      ...state.loadingStates,
      isPageSwitching: false,
    },
  }),
  [ReduxActionTypes.PUBLISH_APPLICATION_INIT]: (state: EditorReduxState) => {
    state.loadingStates.publishing = true;
    state.loadingStates.publishingError = false;

    return { ...state };
  },
  [ReduxActionErrorTypes.PUBLISH_APPLICATION_ERROR]: (
    state: EditorReduxState,
  ) => {
    state.loadingStates.publishing = false;
    state.loadingStates.publishingError = true;

    return { ...state };
  },
  [ReduxActionTypes.PUBLISH_APPLICATION_SUCCESS]: (state: EditorReduxState) => {
    state.loadingStates.publishing = false;
    state.loadingStates.publishingError = false;
    state.loadingStates.published = moment().format();

    return { ...state };
  },
  [ReduxActionTypes.SAVE_PAGE_INIT]: (state: EditorReduxState) => {
    state.loadingStates.saving = true;
    state.loadingStates.savingError = false;

    return { ...state };
  },
  [ReduxActionTypes.SAVE_PAGE_SUCCESS]: (state: EditorReduxState) => {
    state.loadingStates.saving = false;

    return { ...state };
  },
  [ReduxActionErrorTypes.SAVE_PAGE_ERROR]: (state: EditorReduxState) => {
    state.loadingStates.saving = false;
    state.loadingStates.savingError = true;

    return { ...state };
  },
  [ReduxActionTypes.SET_LAST_UPDATED_TIME]: (
    state: EditorReduxState,
    actions: ReduxAction<number>,
  ) => {
    return { ...state, lastUpdatedTime: actions.payload };
  },
  [ReduxActionTypes.INIT_CANVAS_LAYOUT]: (
    state: EditorReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    const {
      currentApplicationId,
      currentLayoutId,
      currentPageId,
      currentPageName,
      layoutOnLoadActionErrors,
      pageActions,
      pageWidgetId,
    } = action.payload;

    state.loadingStates.publishing = false;
    state.loadingStates.publishingError = false;

    return {
      ...state,
      currentPageName,
      currentLayoutId,
      pageWidgetId,
      currentApplicationId,
      currentPageId,
      pageActions,
      layoutOnLoadActionErrors,
    };
  },
  [ReduxActionTypes.CLONE_PAGE_INIT]: (state: EditorReduxState) => {
    state.loadingStates.cloningPage = true;
    state.loadingStates.cloningPageError = false;

    return { ...state };
  },
  [ReduxActionErrorTypes.CLONE_PAGE_ERROR]: (state: EditorReduxState) => {
    state.loadingStates.cloningPageError = true;
    state.loadingStates.cloningPage = false;

    return { ...state };
  },
  [ReduxActionTypes.CLONE_PAGE_SUCCESS]: (state: EditorReduxState) => {
    state.loadingStates.cloningPage = false;

    return { ...state };
  },
  [ReduxActionTypes.CREATE_PAGE_INIT]: (state: EditorReduxState) => {
    state.loadingStates.creatingPage = true;
    state.loadingStates.creatingPageError = false;

    return { ...state };
  },
  [ReduxActionErrorTypes.CREATE_PAGE_ERROR]: (state: EditorReduxState) => {
    state.loadingStates.creatingPageError = true;
    state.loadingStates.creatingPage = false;

    return { ...state };
  },
  [ReduxActionTypes.CREATE_PAGE_SUCCESS]: (state: EditorReduxState) => {
    state.loadingStates.creatingPage = false;

    return { ...state };
  },
  [ReduxActionTypes.UPDATE_WIDGET_NAME_INIT]: (state: EditorReduxState) => {
    state.loadingStates.updatingWidgetName = true;
    state.loadingStates.updateWidgetNameError = false;

    return { ...state };
  },
  [ReduxActionTypes.UPDATE_WIDGET_NAME_SUCCESS]: (state: EditorReduxState) => {
    state.loadingStates.updatingWidgetName = false;
    state.loadingStates.updateWidgetNameError = false;

    return { ...state };
  },
  [ReduxActionErrorTypes.UPDATE_WIDGET_NAME_ERROR]: (
    state: EditorReduxState,
  ) => {
    state.loadingStates.updatingWidgetName = false;
    state.loadingStates.updateWidgetNameError = true;

    return { ...state };
  },
  [ReduxActionTypes.SET_SNIPING_MODE]: (
    state: EditorReduxState,
    action: ReduxAction<{ isActive: boolean; bindTo?: string }>,
  ) => {
    return {
      ...state,
      isSnipingMode: action.payload.isActive,
      snipModeBindTo: action.payload.bindTo,
    };
  },
  [ReduxActionTypes.SET_PREVIEW_MODE]: (
    state: EditorReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      isPreviewMode: action.payload,
    };
  },
  [ReduxActionTypes.SET_PROTECTED_MODE]: (
    state: EditorReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      isProtectedMode: action.payload,
    };
  },
  /* This action updates the status of the savingEntity for any entity of the application in the store */
  [ReduxActionTypes.ENTITY_UPDATE_STARTED]: (state: EditorReduxState) => ({
    ...state,
    loadingStates: {
      ...state.loadingStates,
      savingEntity: true,
    },
  }),
  [ReduxActionTypes.ENTITY_UPDATE_SUCCESS]: (state: EditorReduxState) => ({
    ...state,
    loadingStates: {
      ...state.loadingStates,
      savingEntity: false,
    },
  }),
  [ReduxActionTypes.WIDGET_INIT_SUCCESS]: (
    state: EditorReduxState,
  ): EditorReduxState => ({
    ...state,
    widgetConfigBuilt: true,
  }),

  [ReduxActionTypes.SETUP_PAGE_INIT]: (state: EditorReduxState) => {
    return {
      ...state,
      loadingStates: {
        ...state.loadingStates,
        isSettingUpPage: true,
      },
    };
  },
  [ReduxActionTypes.SETUP_PAGE_SUCCESS]: (state: EditorReduxState) => {
    return {
      ...state,
      loadingStates: {
        ...state.loadingStates,
        isSettingUpPage: false,
      },
    };
  },
  [ReduxActionErrorTypes.SETUP_PAGE_ERROR]: (state: EditorReduxState) => {
    return {
      ...state,
      loadingStates: { ...state.loadingStates, isSettingUpPage: false },
    };
  },
};

const editorReducer = createReducer(initialState, handlers);

export interface EditorReduxState {
  widgetConfigBuilt: boolean;
  initialized: boolean;
  pageWidgetId?: string;
  currentLayoutId?: string;
  currentPageName?: string;
  currentPageId?: string;
  lastUpdatedTime?: number;
  pageActions?: PageAction[][];
  isSnipingMode: boolean;
  snipModeBindTo?: string;
  isPreviewMode: boolean;
  isProtectedMode: boolean;
  zoomLevel: number;
  layoutOnLoadActionErrors?: LayoutOnLoadActionErrors[];
  loadingStates: {
    saving: boolean;
    savingError: boolean;
    savingEntity: boolean;
    publishing: boolean;
    published?: string;
    publishingError: boolean;
    loading: boolean;
    loadingError: boolean;
    isPageSwitching: boolean;
    pageSwitchingError: boolean;
    creatingPage: boolean;
    creatingPageError: boolean;
    cloningPage: boolean;
    cloningPageError: boolean;
    updatingWidgetName: boolean;
    updateWidgetNameError: boolean;
    isSettingUpPage: boolean;
  };
}

export default editorReducer;
