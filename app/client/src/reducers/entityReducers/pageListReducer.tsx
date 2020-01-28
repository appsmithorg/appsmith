import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  PageListPayload,
} from "constants/ReduxActionConstants";

const initialState: PageListReduxState = {
  pages: [],
};

const pageListReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS]: (
    state: PageListReduxState,
    action: ReduxAction<{ pages: PageListPayload; applicationId: string }>,
  ) => {
    return {
      ...state,
      ...action.payload,
      defaultPageId:
        action.payload.pages.find(page => page.isDefault)?.pageId ||
        action.payload.pages[0].pageId,
    };
  },
  [ReduxActionTypes.CREATE_PAGE_SUCCESS]: (
    state: PageListReduxState,
    action: ReduxAction<{
      pageName: string;
      pageId: string;
      layoutId: string;
      isDefault: boolean;
    }>,
  ) => {
    const _state = state;
    _state.pages = state.pages.map(page => ({ ...page, latest: false }));
    _state.pages.push({ ...action.payload, latest: true });
    return { ..._state };
  },
  [ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_SUCCESS]: (
    state: PageListReduxState,
    action: ReduxAction<{ pageId: string; applicationId: string }>,
  ) => {
    if (
      state.applicationId === action.payload.applicationId &&
      state.defaultPageId !== action.payload.pageId
    ) {
      return { ...state, defaultPageId: action.payload.pageId };
    }
    return state;
  },
});

export interface PageListReduxState {
  pages: PageListPayload;
  applicationId?: string;
  defaultPageId?: string;
}

export default pageListReducer;
