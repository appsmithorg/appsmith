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
  pages: [],
};

const appViewReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS]: (
    state: AppViewReduxState,
    action: ReduxAction<PageListPayload>,
  ) => {
    return { ...state, pages: action.payload };
  },
  [ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT]: (state: AppViewReduxState) => {
    return { ...state, isFetchingPage: true };
  },
  [ReduxActionTypes.FETCH_PUBLISHED_PAGE_ERROR]: (state: AppViewReduxState) => {
    return { ...state, isFetchingPage: false };
  },
  [ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS]: (
    state: AppViewReduxState,
    action: ReduxAction<{
      pageId: string;
      layoutId: string;
      dsl: ContainerWidgetProps<WidgetProps>;
    }>,
  ) => {
    return {
      ...state,
      dsl: action.payload.dsl,
      currentPageId: action.payload.pageId,
      currentLayoutId: action.payload.layoutId,
      isFetchingPage: false,
    };
  },
});

export interface AppViewReduxState {
  dsl?: ContainerWidgetProps<WidgetProps>;
  isFetchingPage: boolean;
  currentPageId?: string;
  currentLayoutId?: string;
  pages: PageListPayload;
}

export default appViewReducer;
