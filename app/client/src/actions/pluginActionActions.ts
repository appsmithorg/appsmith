import type { ActionResponse, PaginationField } from "api/ActionAPI";
import {
  type AnyReduxAction,
  type EvaluationReduxAction,
  type ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type { JSUpdate } from "utils/JSPaneUtils";
import type {
  Action,
  ActionViewMode,
  SlashCommandPayload,
} from "entities/Action";
import { ActionExecutionContext } from "entities/Action";
import { batchAction } from "actions/batchActions";
import type { ExecuteErrorPayload } from "constants/AppsmithActionConstants/ActionConstants";
import type { ModalInfo } from "reducers/uiReducers/modalActionReducer";
import type { ApiResponse } from "api/ApiResponses";
import type { JSCollection } from "entities/JSCollection";
import type { ErrorActionPayload } from "sagas/ErrorSagas";
import type { EventLocation } from "ee/utils/analyticsUtilTypes";
import type { GenerateDestinationIdInfoReturnType } from "ee/sagas/helpers";
import type { Span } from "instrumentation/types";

export const createActionRequest = (payload: Partial<Action>) => {
  return {
    type: ReduxActionTypes.CREATE_ACTION_REQUEST,
    payload,
  };
};
export const createActionInit = (payload: Partial<Action>) => {
  return {
    type: ReduxActionTypes.CREATE_ACTION_INIT,
    payload,
  };
};

export const createActionSuccess = (payload: Action) => {
  return {
    type: ReduxActionTypes.CREATE_ACTION_SUCCESS,
    payload,
  };
};

export interface FetchActionsPayload {
  applicationId: string;
  publishedActions?: ApiResponse<ActionViewMode[]>;
  publishedActionCollections?: ApiResponse<JSCollection[]>;
  unpublishedActionCollections?: ApiResponse<JSCollection[]>;
  unpublishedActions?: ApiResponse<Action[]>;
}

export const fetchActions = (
  {
    applicationId,
    unpublishedActions,
  }: { applicationId: string; unpublishedActions?: ApiResponse<Action[]> },
  postEvalActions: Array<AnyReduxAction>,
): EvaluationReduxAction<unknown> => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_INIT,
    payload: { applicationId, unpublishedActions },
    postEvalActions,
  };
};

export const fetchActionsForView = ({
  applicationId,
  publishedActions,
}: {
  applicationId: string;
  publishedActions?: ApiResponse<ActionViewMode[]>;
}): ReduxAction<FetchActionsPayload> => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_INIT,
    payload: { applicationId, publishedActions },
  };
};

export const fetchActionsForPage = (
  pageId: string,
): EvaluationReduxAction<unknown> => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_INIT,
    payload: { pageId },
  };
};

export const fetchActionsForPageSuccess = (
  actions: Action[],
): EvaluationReduxAction<unknown> => {
  return {
    type: ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_SUCCESS,
    payload: actions,
  };
};

export const fetchActionsForPageError = () => {
  return {
    type: ReduxActionErrorTypes.FETCH_ACTIONS_FOR_PAGE_ERROR,
  };
};

export const runActionViaShortcut = () => {
  return {
    type: ReduxActionTypes.RUN_ACTION_SHORTCUT_REQUEST,
  };
};

export const runAction = (
  id: string,
  paginationField?: PaginationField,
  skipOpeningDebugger = false,
  action = undefined,
  actionExecutionContext = ActionExecutionContext.SELF,
) => {
  return {
    type: ReduxActionTypes.RUN_ACTION_REQUEST,
    payload: {
      id,
      paginationField,
      skipOpeningDebugger,
      action,
      actionExecutionContext,
    },
  };
};

export const softRefreshActions = () => {
  return {
    type: ReduxActionTypes.PLUGIN_SOFT_REFRESH,
  };
};

export const showActionConfirmationModal = (payload: ModalInfo) => {
  return {
    type: ReduxActionTypes.SHOW_ACTION_MODAL,
    payload,
  };
};

export const cancelActionConfirmationModal = (payload: string) => {
  return {
    type: ReduxActionTypes.CANCEL_ACTION_MODAL + `_FOR_${payload.trim()}`,
  };
};

export const acceptActionConfirmationModal = (payload: string) => {
  return {
    type: ReduxActionTypes.CONFIRM_ACTION_MODAL + `_FOR_${payload.trim()}`,
  };
};

export const updateAction = (payload: { id: string }) => {
  return batchAction({
    type: ReduxActionTypes.UPDATE_ACTION_INIT,
    payload,
  });
};

export const updateActionSuccess = (payload: { data: Action }) => {
  return {
    type: ReduxActionTypes.UPDATE_ACTION_SUCCESS,
    payload,
  };
};

export const clearActionResponse = (actionId: string) => {
  return {
    type: ReduxActionTypes.CLEAR_ACTION_RESPONSE,
    payload: {
      actionId,
    },
  };
};

export const deleteAction = (payload: {
  id: string;
  name: string;
  onSuccess?: () => void;
}) => {
  return {
    type: ReduxActionTypes.DELETE_ACTION_INIT,
    payload,
  };
};

export const deleteActionSuccess = (payload: { id: string }) => {
  return {
    type: ReduxActionTypes.DELETE_ACTION_SUCCESS,
    payload,
  };
};

export const moveActionRequest = (payload: {
  id: string;
  destinationPageId: string;
  originalPageId: string;
  name: string;
}) => {
  return {
    type: ReduxActionTypes.MOVE_ACTION_INIT,
    payload,
  };
};

export const moveActionSuccess = (payload: Action) => {
  return {
    type: ReduxActionTypes.MOVE_ACTION_SUCCESS,
    payload,
  };
};

export const moveActionError = (
  payload: {
    id: string;
    originalPageId: string;
  } & ErrorActionPayload,
) => {
  return {
    type: ReduxActionErrorTypes.MOVE_ACTION_ERROR,
    payload,
  };
};

export const copyActionRequest = (payload: {
  id: string;
  destinationEntityId: string;
  name: string;
}) => {
  return {
    type: ReduxActionTypes.COPY_ACTION_INIT,
    payload,
  };
};

export const copyActionSuccess = (payload: Action) => {
  return {
    type: ReduxActionTypes.COPY_ACTION_SUCCESS,
    payload,
  };
};

export const copyActionError = (
  payload: {
    id: string;
    destinationEntityIdInfo: GenerateDestinationIdInfoReturnType;
  } & ErrorActionPayload,
) => {
  return {
    type: ReduxActionErrorTypes.COPY_ACTION_ERROR,
    payload,
  };
};

export const executePluginActionRequest = (payload: { id: string }) => ({
  type: ReduxActionTypes.EXECUTE_PLUGIN_ACTION_REQUEST,
  payload: payload,
});

export interface ExecutePluginActionSuccessPayload {
  id: string;
  baseId: string;
  response: ActionResponse;
  isPageLoad?: boolean;
  isActionCreatedInApp: boolean;
}

export const executePluginActionSuccess = (
  payload: ExecutePluginActionSuccessPayload,
) => ({
  type: ReduxActionTypes.EXECUTE_PLUGIN_ACTION_SUCCESS,
  payload: payload,
});

export const setActionResponseDisplayFormat = (
  payload: UpdateActionPropertyActionPayload,
) => ({
  type: ReduxActionTypes.SET_ACTION_RESPONSE_DISPLAY_FORMAT,
  payload: payload,
});

export const executePluginActionError = (
  executeErrorPayload: ExecuteErrorPayload,
): ReduxAction<ExecuteErrorPayload> => {
  return {
    type: ReduxActionErrorTypes.EXECUTE_PLUGIN_ACTION_ERROR,
    payload: executeErrorPayload,
  };
};

export const saveActionName = (payload: { id: string; name: string }) => ({
  type: ReduxActionTypes.SAVE_ACTION_NAME_INIT,
  payload: payload,
});

export interface SetActionPropertyPayload {
  actionId: string;
  propertyName: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  skipSave?: boolean;
}

export const setActionProperty = (
  payload: SetActionPropertyPayload,
  postEvalActions?: Array<AnyReduxAction>,
) => ({
  type: ReduxActionTypes.SET_ACTION_PROPERTY,
  payload,
  postEvalActions,
});

export interface UpdateActionPropertyActionPayload {
  id: string;
  field: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

export const updateActionProperty = (
  payload: UpdateActionPropertyActionPayload,
  postEvalActions?: Array<AnyReduxAction>,
) => {
  return batchAction({
    type: ReduxActionTypes.UPDATE_ACTION_PROPERTY,
    payload,
    postEvalActions,
  });
};

export const executePageLoadActions = (
  actionExecutionContext?: ActionExecutionContext,
) => {
  return {
    type: ReduxActionTypes.EXECUTE_PAGE_LOAD_ACTIONS,
    payload: {
      actionExecutionContext,
    },
  };
};

export const executeJSUpdates = (
  payload: Record<string, JSUpdate>,
): ReduxAction<unknown> => ({
  type: ReduxActionTypes.EXECUTE_JS_UPDATES,
  payload,
});

export const setActionsToExecuteOnPageLoad = (
  actions: Array<{
    executeOnLoad: boolean;
    id: string;
    name: string;
  }>,
) => {
  return {
    type: ReduxActionTypes.SET_ACTION_TO_EXECUTE_ON_PAGELOAD,
    payload: actions,
  };
};

export const setJSActionsToExecuteOnPageLoad = (
  actions: Array<{
    executeOnLoad: boolean;
    id: string;
    name: string;
    collectionId?: string;
  }>,
) => {
  return {
    type: ReduxActionTypes.SET_JS_ACTION_TO_EXECUTE_ON_PAGELOAD,
    payload: actions,
  };
};

export const bindDataOnCanvas = (payload: {
  queryId: string;
  applicationId: string;
  basePageId: string;
}) => {
  return {
    type: ReduxActionTypes.BIND_DATA_ON_CANVAS,
    payload,
  };
};

export type actionDataPayload = {
  entityName: string;
  dataPath: string;
  data: unknown;
  dataPathRef?: string;
}[];

export interface updateActionDataPayloadType {
  actionDataPayload: actionDataPayload;
  parentSpan?: Span;
}
export const updateActionData = (
  payload: actionDataPayload,
  parentSpan?: Span,
): {
  type: string;
  payload: updateActionDataPayloadType;
} => {
  return {
    type: ReduxActionTypes.UPDATE_ACTION_DATA,
    payload: {
      actionDataPayload: payload,
      parentSpan,
    },
  };
};

export const closeQueryActionTab = (payload: {
  id: string;
  parentId: string;
}) => {
  return {
    type: ReduxActionTypes.CLOSE_QUERY_ACTION_TAB,
    payload,
  };
};
export const closeQueryActionTabSuccess = (payload: {
  id: string;
  parentId: string;
}) => {
  return {
    type: ReduxActionTypes.CLOSE_QUERY_ACTION_TAB_SUCCESS,
    payload,
  };
};

export const createNewApiAction = (
  pageId: string,
  from: EventLocation,
  apiType?: string,
): ReduxAction<{ pageId: string; from: EventLocation; apiType?: string }> => ({
  type: ReduxActionTypes.CREATE_NEW_API_ACTION,
  payload: { pageId, from, apiType },
});

export const createNewQueryAction = (
  pageId: string,
  from: EventLocation,
  datasourceId: string,
  queryDefaultTableName?: string,
): ReduxAction<{
  pageId: string;
  from: EventLocation;
  datasourceId: string;
  queryDefaultTableName?: string;
}> => ({
  type: ReduxActionTypes.CREATE_NEW_QUERY_ACTION,
  payload: { pageId, from, datasourceId, queryDefaultTableName },
});

export const executeCommandAction = (payload: SlashCommandPayload) => ({
  type: ReduxActionTypes.EXECUTE_COMMAND,
  payload: payload,
});
