import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

export const createNewJSAction = (
  pageId: string,
): ReduxAction<{ pageId: string }> => ({
  type: ReduxActionTypes.CREATE_NEW_JS_ACTION,
  payload: { pageId },
});

export const saveJSAction = (body: string): ReduxAction<{ body: string }> => ({
  type: ReduxActionTypes.SAVE_JS_ACTION,
  payload: { body },
});
