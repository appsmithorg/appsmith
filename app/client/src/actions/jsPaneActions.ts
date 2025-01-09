import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { type ReduxAction } from "./ReduxActionTypes";
import type { JSAction, JSCollection } from "entities/JSCollection";
import type {
  RefactorAction,
  SetFunctionPropertyPayload,
} from "ee/api/JSActionAPI";
import type { EventLocation } from "ee/utils/analyticsUtilTypes";
import type {
  JSEditorTab,
  JSPaneDebuggerState,
} from "reducers/uiReducers/jsPaneReducer";
import type { JSUpdate } from "../utils/JSPaneUtils";

export const createNewJSCollection = (
  pageId: string,
  from: EventLocation,
  functionName?: string,
): ReduxAction<{
  pageId: string;
  from: EventLocation;
  functionName?: string;
}> => ({
  type: ReduxActionTypes.CREATE_NEW_JS_ACTION,
  payload: { pageId, from, functionName },
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

export const jsSaveActionStart = (payload: { id: string }) => {
  return {
    type: ReduxActionTypes.JS_ACTION_SAVE_START,
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

export const jsSaveActionComplete = (payload: { id: string }) => {
  return {
    type: ReduxActionTypes.JS_ACTION_SAVE_COMPLETE,
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

export const setJsPaneDebuggerState = (
  payload: Partial<JSPaneDebuggerState>,
) => ({
  type: ReduxActionTypes.SET_JS_PANE_DEBUGGER_STATE,
  payload,
});

export const executeJSUpdates = (
  payload: Record<string, JSUpdate>,
): ReduxAction<unknown> => ({
  type: ReduxActionTypes.EXECUTE_JS_UPDATES,
  payload,
});
