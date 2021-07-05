import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { JSAction } from "entities/JSAction";

export const createNewJSAction = (
  pageId: string,
): ReduxAction<{ pageId: string }> => ({
  type: ReduxActionTypes.CREATE_NEW_JS_ACTION,
  payload: { pageId },
});

export const updateJSAction = (
  body: string,
): ReduxAction<{ body: string }> => ({
  type: ReduxActionTypes.UPDATE_JS_ACTION_INIT,
  payload: { body },
});

export const updateJSActionSuccess = (payload: { data: JSAction }) => {
  return {
    type: ReduxActionTypes.UPDATE_JS_ACTION_SUCCESS,
    payload,
  };
};
