import type { WidgetType } from "constants/WidgetConstants";
import type {
  AnyReduxAction,
  EvaluationReduxAction,
  ReduxAction,
} from "ee/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { WidgetOperation, WidgetProps } from "widgets/BaseWidget";
import type {
  SavePageResponse,
  UpdatePageResponse,
  FetchPageResponse,
  PageLayout,
} from "api/PageApi";
import type { UrlDataState } from "reducers/entityReducers/appReducer";
import type { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import type { Replayable } from "entities/Replay/ReplayEntity/ReplayEditor";
import * as Sentry from "@sentry/react";
import type { DSLWidget } from "../WidgetProvider/constants";
import type {
  LayoutOnLoadActionErrors,
  PageAction,
} from "../constants/AppsmithActionConstants/ActionConstants";
import type { APP_MODE } from "entities/App";
import type { ApiResponse } from "api/ApiResponses";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import type { CanvasWidgetsReduxState } from "reducers/types/canvasWidgets.types";
import { ReplayOperation } from "entities/Replay/ReplayEntity/ReplayOperations";
import type {
  FetchPageListPayload,
  UpdateLayoutOptions,
  FetchPageActionPayload,
  UpdateCurrentPagePayload,
  UpdateCanvasPayload,
  CreatePageActionPayload,
  ClonePageActionPayload,
  SetupPageActionPayload,
  FetchPublishedPageActionPayload,
  FetchPublishedPageResourcesPayload,
  UpdatePageErrorPayload,
  WidgetAddChild,
  WidgetRemoveChild,
  WidgetDelete,
  MultipleWidgetDeletePayload,
  WidgetResize,
  ModalWidgetResize,
  WidgetAddChildren,
  WidgetUpdateProperty,
  ReduxActionWithExtraParams,
  GenerateCRUDSuccess,
  GenerateTemplatePageActionPayload,
  DeletePageActionPayload,
  SetDefaultPageActionPayload,
  SetPageOrderActionPayload,
  SetupPublishedPageActionPayload,
  ClonePageSuccessPayload,
} from "./types/pageActions.types";



export const fetchPageAction = (
  pageId: string,
  isFirstLoad = false,
  pageWithMigratedDsl?: FetchPageResponse,
): ReduxAction<FetchPageActionPayload> => {
  return {
    type: ReduxActionTypes.FETCH_PAGE_INIT,
    payload: {
      id: pageId,
      isFirstLoad,
      pageWithMigratedDsl,
    },
  };
};

// fetch a published page
export const fetchPublishedPageAction = (
  pageId: string,
  bustCache = false,
  pageWithMigratedDsl?: FetchPageResponse,
): ReduxAction<FetchPublishedPageActionPayload> => ({
  type: ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT,
  payload: {
    pageId,
    bustCache,
    pageWithMigratedDsl,
  },
});

export const fetchPageSuccess = (): EvaluationReduxAction<undefined> => {
  return {
    type: ReduxActionTypes.FETCH_PAGE_SUCCESS,
    payload: undefined,
  };
};

export const fetchPublishedPageSuccess =
  (): EvaluationReduxAction<undefined> => ({
    type: ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS,
    payload: undefined,
  });

/**
 * After all page entities are fetched like DSL, actions and JsObjects,
 * we trigger evaluation using this redux action, here we supply postEvalActions
 * to trigger action after evaluation has been completed like executeOnPageLoadAction
 *
 * @param {Array<AnyReduxAction>} postEvalActions
 */
export const fetchAllPageEntityCompletion = (
  postEvalActions: Array<AnyReduxAction>,
) => ({
  type: ReduxActionTypes.FETCH_ALL_PAGE_ENTITY_COMPLETION,
  postEvalActions,
  payload: undefined,
});

export const updateCurrentPage = (
  id: string,
  slug?: string,
  permissions?: string[],
): ReduxAction<UpdateCurrentPagePayload> => ({
  type: ReduxActionTypes.SWITCH_CURRENT_PAGE_ID,
  payload: { id, slug, permissions },
});

export const initCanvasLayout = (
  payload: UpdateCanvasPayload,
): ReduxAction<UpdateCanvasPayload> => {
  return {
    type: ReduxActionTypes.INIT_CANVAS_LAYOUT,
    payload,
  };
};

export const setLastUpdatedTime = (payload: number): ReduxAction<number> => ({
  type: ReduxActionTypes.SET_LAST_UPDATED_TIME,
  payload,
});

export const savePageSuccess = (payload: SavePageResponse) => {
  return {
    type: ReduxActionTypes.SAVE_PAGE_SUCCESS,
    payload,
  };
};

export const updateWidgetNameSuccess = () => {
  return {
    type: ReduxActionTypes.UPDATE_WIDGET_NAME_SUCCESS,
  };
};

export const deletePageSuccess = () => {
  return {
    type: ReduxActionTypes.DELETE_PAGE_SUCCESS,
  };
};

export const updateAndSaveLayout = (
  widgets: CanvasWidgetsReduxState,
  options: UpdateLayoutOptions = {},
) => {
  const { isRetry, shouldReplay, updatedWidgetIds } = options;

  return {
    type: ReduxActionTypes.UPDATE_LAYOUT,
    payload: { widgets, isRetry, shouldReplay, updatedWidgetIds },
  };
};

export const saveLayout = (isRetry?: boolean) => {
  return {
    type: ReduxActionTypes.SAVE_PAGE_INIT,
    payload: { isRetry },
  };
};

export const createPageAction = (
  applicationId: string,
  pageName: string,
  layouts: Partial<PageLayout>[],
  orgId: string,
  instanceId?: string,
) => {
  AnalyticsUtil.logEvent("CREATE_PAGE", {
    pageName,
    orgId,
    instanceId,
  });

  return {
    type: ReduxActionTypes.CREATE_PAGE_INIT,
    payload: {
      applicationId,
      name: pageName,
      layouts,
    },
  };
};

export const createNewPageFromEntities = (
  applicationId: string,
  pageName: string,
  orgId: string,
  instanceId?: string,
) => {
  AnalyticsUtil.logEvent("CREATE_PAGE", {
    pageName,
    orgId,
    instanceId,
  });

  return {
    type: ReduxActionTypes.CREATE_NEW_PAGE_FROM_ENTITIES,
    payload: {
      applicationId,
      name: pageName,
    },
  };
};

// cloning a page
export const clonePageInit = (
  pageId: string,
  blockNavigation?: boolean,
): ReduxAction<ClonePageActionPayload> => {
  return {
    type: ReduxActionTypes.CLONE_PAGE_INIT,
    payload: {
      id: pageId,
      blockNavigation,
    },
  };
};

export const clonePageSuccess = ({
  basePageId,
  layoutId,
  pageId,
  pageName,
  slug,
}: ClonePageSuccessPayload) => {
  return {
    type: ReduxActionTypes.CLONE_PAGE_SUCCESS,
    payload: {
      pageId,
      basePageId,
      pageName,
      layoutId,
      slug,
    },
  };
};

// Fetches resources required for published page, currently only used for fetching actions
// In future we can reuse this for fetching other page level resources in published mode
export const fetchPublishedPageResources = ({
  basePageId,
  pageId,
}: FetchPublishedPageResourcesPayload): ReduxAction<FetchPublishedPageResourcesPayload> => ({
  type: ReduxActionTypes.FETCH_PUBLISHED_PAGE_RESOURCES_INIT,
  payload: {
    pageId,
    basePageId,
  },
});

// update a page

export interface UpdatePageActionPayload {
  id: string;
  name?: string;
  isHidden?: boolean;
  customSlug?: string;
}

export const updatePageAction = (
  payload: UpdatePageActionPayload,
): ReduxAction<UpdatePageActionPayload> => {
  // Update page *needs* id to be there. We found certain scenarios
  // where this was not happening and capturing the error to know gather
  // more info: https://github.com/appsmithorg/appsmith/issues/16435
  if (!payload.id) {
    Sentry.captureException(
      new Error("Attempting to update page without page id"),
    );
  }

  return {
    type: ReduxActionTypes.UPDATE_PAGE_INIT,
    payload,
  };
};

export const updatePageSuccess = (payload: UpdatePageResponse) => {
  return {
    type: ReduxActionTypes.UPDATE_PAGE_SUCCESS,
    payload,
  };
};

export const updatePageError = (payload: UpdatePageErrorPayload) => {
  return {
    type: ReduxActionErrorTypes.UPDATE_PAGE_ERROR,
    payload,
  };
};



export const updateWidget = (
  operation: WidgetOperation,
  widgetId: string,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
): ReduxAction<
  | WidgetAddChild
  | WidgetResize
  | WidgetDelete
  | WidgetAddChildren
  | WidgetUpdateProperty
> => {
  return {
    type: WidgetReduxActionTypes["WIDGET_" + operation],
    payload: { widgetId, ...payload },
  };
};

export const setUrlData = (
  payload: UrlDataState,
): ReduxAction<UrlDataState> => {
  return {
    type: ReduxActionTypes.SET_URL_DATA,
    payload,
  };
};

export const setAppMode = (payload: APP_MODE): ReduxAction<APP_MODE> => {
  return {
    type: ReduxActionTypes.SET_APP_MODE,
    payload,
  };
};

export const updateAppStore = (
  payload: Record<string, unknown>,
): EvaluationReduxAction<Record<string, unknown>> => {
  return {
    type: ReduxActionTypes.UPDATE_APP_STORE,
    payload,
  };
};



export const generateTemplateSuccess = (payload: GenerateCRUDSuccess) => {
  return {
    type: ReduxActionTypes.GENERATE_TEMPLATE_PAGE_SUCCESS,
    payload,
  };
};

export const generateTemplateError = () => {
  return {
    type: ReduxActionErrorTypes.GENERATE_TEMPLATE_PAGE_ERROR,
  };
};



export const generateTemplateToUpdatePage = ({
  applicationId,
  columns,
  datasourceId,
  mode,
  pageId,
  pluginSpecificParams,
  searchColumn,
  tableName,
}: GenerateTemplatePageActionPayload): ReduxActionWithExtraParams<GenerateTemplatePageActionPayload> => {
  return {
    type: ReduxActionTypes.GENERATE_TEMPLATE_PAGE_INIT,
    payload: {
      pageId,
      tableName,
      datasourceId,
      applicationId,
      columns,
      searchColumn,
      pluginSpecificParams,
    },
    extraParams: {
      mode,
    },
  };
};

export function updateReplayEntity(
  entityId: string,
  entity: Replayable,
  entityType: ENTITY_TYPE,
) {
  return {
    type: ReduxActionTypes.UPDATE_REPLAY_ENTITY,
    payload: { entityId, entity, entityType },
  };
}

export function undoAction() {
  return {
    type: ReduxActionTypes.UNDO_REDO_OPERATION,
    payload: {
      operation: ReplayOperation.UNDO,
    },
  };
}

export function redoAction() {
  return {
    type: ReduxActionTypes.UNDO_REDO_OPERATION,
    payload: {
      operation: ReplayOperation.REDO,
    },
  };
}

// delete a page

export const deletePageAction = (
  pageId: string,
): ReduxAction<DeletePageActionPayload> => {
  return {
    type: ReduxActionTypes.DELETE_PAGE_INIT,
    payload: {
      id: pageId,
    },
  };
};

export const setPageAsDefault = (
  pageId: string,
  applicationId: string,
): ReduxAction<SetDefaultPageActionPayload> => {
  return {
    type: ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_INIT,
    payload: {
      id: pageId,
      applicationId,
    },
  };
};

export const setPageOrder = (
  applicationId: string,
  pageId: string,
  order: number,
): ReduxAction<SetPageOrderActionPayload> => {
  return {
    type: ReduxActionTypes.SET_PAGE_ORDER_INIT,
    payload: {
      pageId: pageId,
      order: order,
      applicationId,
    },
  };
};

export const resetPageList = () => ({
  type: ReduxActionTypes.RESET_PAGE_LIST,
});

export const resetApplicationWidgets = () => ({
  type: ReduxActionTypes.RESET_APPLICATION_WIDGET_STATE_REQUEST,
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchPageDSLs = (payload?: any) => ({
  type: ReduxActionTypes.POPULATE_PAGEDSLS_INIT,
  payload,
});
export const setupPageAction = ({
  id,
  isFirstLoad = false,
  packagePullStatus,
  pageWithMigratedDsl,
}: SetupPageActionPayload) => ({
  type: ReduxActionTypes.SETUP_PAGE_INIT,
  payload: {
    id,
    isFirstLoad,
    pageWithMigratedDsl,
    packagePullStatus,
  },
});

export const setupPublishedPage = (
  pageId: string,
  bustCache = false,
  pageWithMigratedDsl?: FetchPageResponse,
): ReduxAction<SetupPublishedPageActionPayload> => ({
  type: ReduxActionTypes.SETUP_PUBLISHED_PAGE_INIT,
  payload: {
    pageId,
    bustCache,
    pageWithMigratedDsl,
  },
});
