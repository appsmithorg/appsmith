import { createReducer } from "utils/ReducerUtils";
import type { BookmarksMap } from "api/BookmarksAPI";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export interface BookmarksDataState {
  bookmarks: BookmarksMap | any;
}

const initialState: BookmarksDataState = {
  bookmarks: {},
};

const bookmarkReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_BOOKMARK_SUCCESS]: (
    state: BookmarksDataState,
    action: ReduxAction<BookmarksMap>,
  ) => {
    return {
      ...state,
      bookmarks: action.payload,
    };
  },
  [ReduxActionTypes.CREATE_BOOKMARK_SUCCESS]: (
    state: BookmarksDataState,
    action: ReduxAction<BookmarksMap>,
  ) => {
    return {
      ...state,
      bookmarks: action.payload,
    };
  },
});

export default bookmarkReducer;
