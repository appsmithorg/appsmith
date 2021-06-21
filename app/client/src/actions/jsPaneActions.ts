import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

export const createNewJSAction = (
  pageId: string,
): ReduxAction<{ pageId: string }> => ({
  type: ReduxActionTypes.CREATE_NEW_JS_ACTION,
  payload: { pageId },
});
