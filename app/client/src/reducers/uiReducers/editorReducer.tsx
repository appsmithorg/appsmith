import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  UpdateCanvasPayload,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import moment from "moment";
import { PageAction } from "constants/AppsmithActionConstants/ActionConstants";

const initialState: EditorReduxState = {
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
  },
  isSnipingMode: false,
  isPreviewMode: false,
  zoomLevel: 1,
};

const editorReducer = createReducer(initialState, {
  [ReduxActionTypes.RESET_EDITOR_SUCCESS]: (state: EditorReduxState) => {
    return { ...state, initialized: false };
  },
  [ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS]: (state: EditorReduxState) => {
    return { ...state, initialized: true };
  },
  [ReduxActionTypes.UPDATE_PAGE_SUCCESS]: (
    state: EditorReduxState,
    action: ReduxAction<{ id: string; name: string }>,
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
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      isSnipingMode: action.payload,
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
});

export interface EditorReduxState {
  initialized: boolean;
  pageWidgetId?: string;
  currentLayoutId?: string;
  currentPageName?: string;
  currentPageId?: string;
  lastUpdatedTime?: number;
  pageActions?: PageAction[][];
  isSnipingMode: boolean;
  isPreviewMode: boolean;
  zoomLevel: number;
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
  };
}

export default editorReducer;
