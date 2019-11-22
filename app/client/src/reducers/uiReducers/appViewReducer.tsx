import { createReducer } from "../../utils/AppsmithUtils";
import { WidgetProps } from "../../widgets/BaseWidget";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";
import {
  ReduxAction,
  ReduxActionTypes,
  PageListPayload,
} from "../../constants/ReduxActionConstants";

const initialState: AppViewReduxState = {
  isFetchingPage: false,
  loading: false,
  pages: [],
  pageWidgetId: "0",
};

const appViewReducer = createReducer(initialState, {
  [ReduxActionTypes.INITIALIZE_PAGE_VIEWER]: (state: AppViewReduxState) => {
    return { ...state, loading: true };
  },
  [ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT]: (state: AppViewReduxState) => {
    return { ...state, dsl: undefined, isFetchingPage: true };
  },
  [ReduxActionTypes.FETCH_PUBLISHED_PAGE_ERROR]: (state: AppViewReduxState) => {
    return { ...state, isFetchingPage: false };
  },
  [ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS]: (
    state: AppViewReduxState,
    action: ReduxAction<{
      pageId: string;
      dsl: ContainerWidgetProps<WidgetProps>;
      pageWidgetId: string;
    }>,
  ) => {
    return {
      dsl: action.payload.dsl,
      currentPageId: action.payload.pageId,
      isFetchingPage: false,
      pageWidgetId: action.payload.pageWidgetId,
    };
  },
});

export interface AppViewReduxState {
  dsl?: ContainerWidgetProps<WidgetProps>;
  isFetchingPage: boolean;
  currentPageId?: string;
  loading: boolean;
  currentLayoutId?: string;
  pages: PageListPayload;
  pageWidgetId: string;
}

export default appViewReducer;
