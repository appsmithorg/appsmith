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
  loadingStates: {
    publishing: false,
    publishingError: false,
    saving: false,
    savingError: false,
    loading: false,
    loadingError: false,
    pageSwitchingError: false,
    isPageSwitching: false,
  },
};

const editorReducer = createReducer(initialState, {
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
  [ReduxActionTypes.INIT_EDITOR]: (state: EditorReduxState) => {
    state.loadingStates.loading = true;
    state.loadingStates.loadingError = false;
    return { ...state };
  },
  [ReduxActionTypes.INIT_EDITOR_SUCCESS]: (state: EditorReduxState) => {
    state.loadingStates.loading = false;
    state.loadingStates.loadingError = false;
    return { ...state };
  },
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
  [ReduxActionTypes.PUBLISH_APPLICATION_ERROR]: (state: EditorReduxState) => {
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
  [ReduxActionTypes.UPDATE_CANVAS]: (
    state: EditorReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    const {
      currentPageId,
      currentPageName,
      currentLayoutId,
      pageWidgetId,
      currentApplicationId,
    } = action.payload;
    state.loadingStates.publishing = false;
    state.loadingStates.publishingError = false;
    return {
      ...state,
      currentPageId,
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
});

export interface EditorReduxState {
  dsl?: ContainerWidgetProps<WidgetProps>;
  pageWidgetId?: string;
  currentPageId?: string;
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
  };
}

export default editorReducer;
