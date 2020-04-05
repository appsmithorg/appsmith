import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  UpdateCanvasPayload,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
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
    updatingWidgetName: false,
    updateWidgetNameError: false,
  },
};

const editorReducer = createReducer(initialState, {
  [ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS]: (state: EditorReduxState) => {
    return { ...state, initialized: true };
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
  [ReduxActionErrorTypes.INITIALIZE_EDITOR_ERROR]: (
    state: EditorReduxState,
  ) => {
    state.loadingStates.loading = false;
    state.loadingStates.loadingError = true;
    return { ...state };
  },
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
  [ReduxActionTypes.SAVE_PAGE_ERROR]: (state: EditorReduxState) => {
    state.loadingStates.saving = false;
    state.loadingStates.savingError = true;
    return { ...state };
  },
  [ReduxActionTypes.UPDATE_CANVAS]: (
    state: EditorReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    const {
      currentPageName,
      currentLayoutId,
      pageWidgetId,
      currentApplicationId,
    } = action.payload;
    state.loadingStates.publishing = false;
    state.loadingStates.publishingError = false;
    return {
      ...state,
      currentPageName,
      currentLayoutId,
      pageWidgetId,
      currentApplicationId,
    };
  },
  [ReduxActionTypes.SELECT_WIDGET]: (
    state: EditorReduxState,
    action: ReduxAction<{ widgetId?: string }>,
  ) => {
    return { ...state, selectedWidget: action.payload.widgetId };
  },
  [ReduxActionTypes.FOCUS_WIDGET]: (
    state: EditorReduxState,
    action: ReduxAction<{ widgetId?: string }>,
  ) => {
    return { ...state, focusedWidget: action.payload.widgetId };
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
  dsl?: ContainerWidgetProps<WidgetProps>;
  pageWidgetId?: string;
  currentLayoutId?: string;
  currentPageName?: string;
  selectedWidget?: string;
  focusedWidget?: string;
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
    updatingWidgetName: boolean;
    updateWidgetNameError: boolean;
  };
}

export default editorReducer;
