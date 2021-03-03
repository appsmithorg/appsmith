import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  UpdateCanvasPayload,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import moment from "moment";

const initialState: EditorReduxState = {
  initialized: false,
  loadingStates: {
    publishing: false,
    publishingError: false,
    saving: false,
    savingError: false,
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
  [ReduxActionTypes.INIT_CANVAS_LAYOUT]: (
    state: EditorReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    const {
      currentPageName,
      currentLayoutId,
      pageWidgetId,
      currentApplicationId,
      currentPageId,
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
    };
  },
  [ReduxActionTypes.CLONE_PAGE_INIT]: (state: EditorReduxState) => {
    state.loadingStates.cloningPage = true;
    state.loadingStates.cloningPageError = false;
    return { ...state };
  },
  [ReduxActionTypes.CLONE_PAGE_ERROR]: (state: EditorReduxState) => {
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
});

export interface EditorReduxState {
  initialized: boolean;
  pageWidgetId?: string;
  currentLayoutId?: string;
  currentPageName?: string;
  currentPageId?: string;
  loadingStates: {
    saving: boolean;
    savingError: boolean;
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
