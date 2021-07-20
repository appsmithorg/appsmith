import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { JSAction, JSSubAction } from "entities/JSAction";

export const createNewJSAction = (
  pageId: string,
): ReduxAction<{ pageId: string }> => ({
  type: ReduxActionTypes.CREATE_NEW_JS_ACTION,
  payload: { pageId },
});

export const updateJSAction = (
  body: string,
  id: string,
): ReduxAction<{ body: string; id: string }> => ({
  type: ReduxActionTypes.UPDATE_JS_ACTION_INIT,
  payload: { body, id },
});

export const updateJSActionSuccess = (payload: { data: JSAction }) => {
  return {
    type: ReduxActionTypes.UPDATE_JS_ACTION_SUCCESS,
    payload,
  };
};

export const addJSCollectionAction = (payload: {
  jsAction: JSAction;
  subActions: Array<Partial<JSSubAction>>;
}) => {
  return {
    type: ReduxActionTypes.ADD_JS_ACTION_TO_COLLECTION,
    payload,
  };
};

export const updateJSCollectionAction = (payload: {
  jsAction: JSAction;
  subActions: Array<JSSubAction>;
}) => {
  return {
    type: ReduxActionTypes.UPDATE_JS_ACTION_TO_COLLECTION,
    payload,
  };
};

export const deleteJSCollectionAction = (payload: {
  jsAction: JSAction;
  subActions: Array<JSSubAction>;
}) => {
  return {
    type: ReduxActionTypes.DELETE_JS_ACTION_FROM_COLLECTION,
    payload,
  };
};
