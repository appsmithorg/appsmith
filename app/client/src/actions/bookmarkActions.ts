import type { Bookmark } from "api/BookmarksAPI";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const fetchBookmarksAction = (applicationId: string) => {
  return {
    type: ReduxActionTypes.FETCH_BOOKMARKS,
    payload: {
      applicationId: applicationId,
    },
  };
};

export const createBookmarkAction = (bookmark: Bookmark) => {
  return {
    type: ReduxActionTypes.CREATE_BOOKMARK,
    payload: {
      bookmark: bookmark,
    },
  };
};
