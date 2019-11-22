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
    };
  },
  [ReduxActionTypes.CREATE_PAGE_SUCCESS]: (
    state: PageListReduxState,
    action: ReduxAction<{ pageName: string; pageId: string; layoutId: string }>,
  ) => {
    state.pages.push(action.payload);
    return { ...state };
  },
});

export interface PageListReduxState {
  pages: PageListPayload;
  applicationId?: string;
}

export default pageListReducer;
