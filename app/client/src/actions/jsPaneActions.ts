import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { JSCollection, JSAction } from "entities/JSCollection";
import type {
  RefactorAction,
  SetFunctionPropertyPayload,
} from "@appsmith/api/JSActionAPI";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import type { JSEditorTab } from "reducers/uiReducers/jsPaneReducer";

export const createNewJSCollection = (
  pageId: string,
  from: EventLocation,
): ReduxAction<{ pageId: string; from: EventLocation }> => ({
  type: ReduxActionTypes.CREATE_NEW_JS_ACTION,
  payload: { pageId: pageId, from: from },
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

export const executeJSFunctionInit = (payload: {
  collection: JSCollection;
  action: JSAction;
}) => {
  return {
    type: ReduxActionTypes.EXECUTE_JS_FUNCTION_INIT,
    payload,
  };
};

export const startExecutingJSFunction = (payload: {
  action: JSAction;
  collection: JSCollection;
  from: EventLocation;
  openDebugger?: boolean;
}) => {
  return {
    type: ReduxActionTypes.START_EXECUTE_JS_FUNCTION,
    payload,
  };
};

export const updateFunctionProperty = (payload: SetFunctionPropertyPayload) => {
  return {
    type: ReduxActionTypes.SET_FUNCTION_PROPERTY,
    payload,
  };
};

export const updateJSFunction = (payload: SetFunctionPropertyPayload) => {
  return {
    type: ReduxActionTypes.UPDATE_JS_FUNCTION_PROPERTY_INIT,
    payload,
  };
};

export const setActiveJSAction = (payload: {
  jsCollectionId: string;
  jsActionId: string;
}) => {
  return {
    type: ReduxActionTypes.SET_ACTIVE_JS_ACTION,
    payload,
  };
};

export const setJsPaneConfigSelectedTab: (
  payload: JSEditorTab,
) => ReduxAction<{ selectedTab: JSEditorTab }> = (payload: JSEditorTab) => ({
  type: ReduxActionTypes.SET_JS_PANE_CONFIG_SELECTED_TAB,
  payload: { selectedTab: payload },
});
