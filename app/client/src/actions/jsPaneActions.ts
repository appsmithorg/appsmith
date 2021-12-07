import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { JSCollection, JSAction } from "entities/JSCollection";
import { RefactorAction } from "api/JSActionAPI";
export const createNewJSCollection = (
  pageId: string,
): ReduxAction<{ pageId: string }> => ({
  type: ReduxActionTypes.CREATE_NEW_JS_ACTION,
  payload: { pageId },
});

export const updateJSCollection = (
  body: string,
  id: string,
): ReduxAction<{ body: string; id: string }> => ({
  type: ReduxActionTypes.UPDATE_JS_ACTION_INIT,
  payload: { body, id },
});

export const updateJSCollectionBody = (
  body: string,
  id: string,
  isReplay = false,
): ReduxAction<{ body: string; id: string; isReplay?: boolean }> => ({
  type: ReduxActionTypes.UPDATE_JS_ACTION_BODY_INIT,
  payload: { body, id, isReplay },
});

export const updateJSCollectionSuccess = (payload: { data: JSCollection }) => {
  return {
    type: ReduxActionTypes.UPDATE_JS_ACTION_SUCCESS,
    payload,
  };
};

export const updateJSCollectionBodySuccess = (payload: {
  data: JSCollection;
}) => {
  return {
    type: ReduxActionTypes.UPDATE_JS_ACTION_BODY_SUCCESS,
    payload,
  };
};

export const refactorJSCollectionAction = (payload: {
  refactorAction: RefactorAction;
  actionCollection: JSCollection;
}) => {
  return {
    type: ReduxActionTypes.REFACTOR_JS_ACTION_NAME,
    payload,
  };
};

export const executeJSFunction = (payload: {
  collectionName: string;
  action: JSAction;
  collectionId: string;
}) => {
  return {
    type: ReduxActionTypes.EXECUTE_JS_FUNCTION_INIT,
    payload,
  };
};
