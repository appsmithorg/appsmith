import { createReducer } from "utils/AppsmithUtils";
import { WidgetProps } from "widgets/BaseWidget";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import {
  ReduxAction,
  ReduxActionTypes,
  PageListPayload,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { FetchPublishedPageSuccessPayload } from "actions/pageActions";
import { ExecuteErrorPayload, PageAction } from "constants/ActionConstants";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";

const initialState: AppViewReduxState = {
  isFetchingPage: false,
  initialized: false,
  pages: [],
  pageWidgetId: "0",
  actionsExecuting: 0,
};

const appViewReducer = createReducer(initialState, {
  [ReduxActionTypes.INITIALIZE_PAGE_VIEWER]: (state: AppViewReduxState) => {
    return { ...state, initialized: false };
  },
  [ReduxActionTypes.INITIALIZE_PAGE_VIEWER_SUCCESS]: (
    state: AppViewReduxState,
  ) => {
    return { ...state, initialized: true };
  },
  [ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT]: (state: AppViewReduxState) => {
    return { ...state, dsl: undefined, isFetchingPage: true };
  },
  [ReduxActionTypes.FETCH_PUBLISHED_PAGE_ERROR]: (state: AppViewReduxState) => {
    return { ...state, isFetchingPage: false };
  },
  [ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS]: (
    state: AppViewReduxState,
    action: ReduxAction<FetchPublishedPageSuccessPayload>,
  ) => {
    return {
      ...state,
      dsl: action.payload.dsl,
      isFetchingPage: false,
      pageWidgetId: action.payload.pageWidgetId,
    };
  },
  [ReduxActionTypes.EXECUTE_API_ACTION_SUCCESS]: (
    state: AppViewReduxState,
    action: ReduxAction<{ id: string; isPageLoad: boolean }>,
  ) => {
    if (action.payload.isPageLoad) {
      let actionsExecuting = state.actionsExecuting - 1;
      if (actionsExecuting <= 0) {
        actionsExecuting = 0;
        PerformanceTracker.stopTracking(
          PerformanceTransactionName.EXECUTE_PAGE_LOAD_ACTIONS,
          { isAppViewer: true },
        );
      }
      return {
        ...state,
        actionsExecuting: actionsExecuting,
      };
    } else {
      return state;
    }
  },
  [ReduxActionErrorTypes.EXECUTE_ACTION_ERROR]: (
    state: AppViewReduxState,
    action: ReduxAction<ExecuteErrorPayload>,
  ) => {
    if (action.payload.isPageLoad) {
      let actionsExecuting = state.actionsExecuting - 1;
      if (actionsExecuting <= 0) {
        actionsExecuting = 0;
        PerformanceTracker.stopTracking(
          PerformanceTransactionName.EXECUTE_PAGE_LOAD_ACTIONS,
          { isAppViewer: true },
        );
      }
      return {
        ...state,
        actionsExecuting: actionsExecuting,
      };
    } else {
      return state;
    }
  },
  [ReduxActionTypes.EXECUTE_PAGE_LOAD_ACTIONS]: (
    state: AppViewReduxState,
    action: ReduxAction<PageAction[][]>,
  ) => {
    let actionsExecuting = 0;
    action.payload.forEach(actions => {
      actionsExecuting += actions.length;
    });
    return {
      ...state,
      actionsExecuting: actionsExecuting,
    };
  },
});

export interface AppViewReduxState {
  initialized: boolean;
  dsl?: ContainerWidgetProps<WidgetProps>;
  isFetchingPage: boolean;
  currentLayoutId?: string;
  pages: PageListPayload;
  pageWidgetId: string;
  actionsExecuting: number;
}

export default appViewReducer;
