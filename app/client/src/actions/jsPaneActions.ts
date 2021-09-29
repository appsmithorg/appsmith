import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { JSCollection, JSAction } from "entities/JSCollection";

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

export const updateJSCollectionSuccess = (payload: { data: JSCollection }) => {
  return {
    type: ReduxActionTypes.UPDATE_JS_ACTION_SUCCESS,
    payload,
  };
};

export const addJSObjectAction = (payload: {
  jsAction: JSCollection;
  subActions: Array<Partial<JSAction>>;
}) => {
  return {
    type: ReduxActionTypes.ADD_JS_ACTION_TO_COLLECTION,
    payload,
  };
};

export const updateJSObjectAction = (payload: {
  jsAction: JSCollection;
  subActions: Array<JSAction>;
}) => {
  return {
    type: ReduxActionTypes.UPDATE_JS_ACTION_TO_COLLECTION,
    payload,
  };
};

export const deleteJSObjectAction = (payload: {
  jsAction: JSCollection;
  subActions: Array<JSAction>;
}) => {
  return {
    type: ReduxActionTypes.DELETE_JS_ACTION_FROM_COLLECTION,
    payload,
  };
};

export const refactorJSCollectionAction = (payload: {
  actionId: string;
  collectionId: string;
  pageId: string;
  oldName: string;
  newName: string;
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
