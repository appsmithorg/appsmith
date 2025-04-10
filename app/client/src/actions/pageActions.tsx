import type { WidgetType } from "constants/WidgetConstants";
import type { AnyReduxAction, ReduxAction } from "./ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { WidgetOperation, WidgetProps } from "widgets/BaseWidget";
import type {
  FetchPageResponse,
  PageLayout,
  SavePageResponse,
  UpdatePageRequest,
  UpdatePageResponse,
} from "api/PageApi";
import type { UrlDataState } from "reducers/entityReducers/appReducer";
import type { APP_MODE } from "entities/App";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import type { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import type { Replayable } from "entities/Replay/ReplayEntity/ReplayEditor";
import type { DSLWidget } from "../WidgetProvider/constants";
import type {
  LayoutOnLoadActionErrors,
  PageAction,
} from "../constants/AppsmithActionConstants/ActionConstants";
import { ReplayOperation } from "entities/Replay/ReplayEntity/ReplayOperations";
import type { PACKAGE_PULL_STATUS } from "ee/constants/ModuleConstants";
import type { ApiResponse } from "api/ApiResponses";
import type { EvaluationReduxAction } from "./EvaluationReduxActionTypes";
import captureException from "instrumentation/sendFaroErrors";

export interface FetchPageListPayload {
  applicationId: string;
  mode: APP_MODE;
}

export interface updateLayoutOptions {
  isRetry?: boolean;
  shouldReplay?: boolean;
  updatedWidgetIds?: string[];
}

export interface FetchPageActionPayload {
  id: string;
  isFirstLoad?: boolean;
  pageWithMigratedDsl?: FetchPageResponse;
}

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
export interface FetchPublishedPageActionPayload {
  pageId: string;
  bustCache?: boolean;
  pageWithMigratedDsl?: FetchPageResponse;
}

export interface FetchPublishedPageResourcesPayload {
  pageId: string;
  basePageId: string;
  branch: string;
}

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

export interface UpdateCurrentPagePayload {
  id: string;
  slug?: string;
  permissions?: string[];
}

export const updateCurrentPage = (
  id: string,
  slug?: string,
  permissions?: string[],
): ReduxAction<UpdateCurrentPagePayload> => ({
  type: ReduxActionTypes.SWITCH_CURRENT_PAGE_ID,
  payload: { id, slug, permissions },
});

export interface UpdateCanvasPayload {
  pageWidgetId: string;
  widgets: { [widgetId: string]: WidgetProps };
  currentLayoutId: string;
  currentPageId: string;
  currentPageName: string;
  currentApplicationId: string;
  dsl: Partial<DSLWidget>;
  pageActions: PageAction[][];
  updatedWidgetIds?: string[];
  layoutOnLoadActionErrors?: LayoutOnLoadActionErrors[];
}

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
  options: updateLayoutOptions = {},
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

export interface CreatePageActionPayload {
  applicationId: string;
  name: string;
  layouts: Partial<PageLayout>[];
}

export const createPageAction = (
  applicationId: string,
  pageName: string,
  layouts: Partial<PageLayout>[],
  workspaceId: string,
  instanceId?: string,
) => {
  AnalyticsUtil.logEvent("CREATE_PAGE", {
    pageName,
    workspaceId,
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
  workspaceId: string,
  instanceId?: string,
) => {
  AnalyticsUtil.logEvent("CREATE_PAGE", {
    pageName,
    workspaceId,
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
export interface ClonePageActionPayload {
  id: string;
  blockNavigation?: boolean;
}

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

export interface ClonePageSuccessPayload {
  pageName: string;
  description?: string;
  pageId: string;
  basePageId: string;
  layoutId: string;
  isDefault: boolean;
  slug: string;
}

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
  branch,
  pageId,
}: FetchPublishedPageResourcesPayload): ReduxAction<FetchPublishedPageResourcesPayload> => ({
  type: ReduxActionTypes.FETCH_PUBLISHED_PAGE_RESOURCES_INIT,
  payload: {
    pageId,
    basePageId,
    branch,
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
  if (!payload.id) {
    captureException(new Error("Attempting to update page without page id"), {
      errorName: "PageActions_UpdatePage",
    });
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

export interface UpdatePageErrorPayload {
  request: UpdatePageRequest;
  error: unknown;
}

export interface WidgetAddChild {
  widgetId: string;
  widgetName?: string;
  type: WidgetType;
  leftColumn: number;
  topRow: number;
  columns: number;
  rows: number;
  parentRowSpace: number;
  parentColumnSpace: number;
  newWidgetId: string;
  tabId: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props?: Record<string, any>;
  dynamicBindingPathList?: DynamicPath[];
}

export interface WidgetRemoveChild {
  widgetId: string;
  childWidgetId: string;
}

export interface WidgetDelete {
  widgetId?: string;
  parentId?: string;
  disallowUndo?: boolean;
  isShortcut?: boolean;
}

export interface MultipleWidgetDeletePayload {
  widgetIds: string[];
  disallowUndo?: boolean;
  isShortcut?: boolean;
}

export interface WidgetResize {
  widgetId: string;
  parentId: string;
  leftColumn?: number;
  rightColumn?: number;
  topRow?: number;
  bottomRow?: number;
  mobileLeftColumn?: number;
  mobileRightColumn?: number;
  mobileTopRow?: number;
  mobileBottomRow?: number;
  snapColumnSpace: number;
  snapRowSpace: number;
}

export interface ModalWidgetResize {
  height: number;
  width: number;
  widgetId: string;
  canvasWidgetId: string;
}

export interface WidgetAddChildren {
  widgetId: string;
  children: Array<{
    type: WidgetType;
    widgetId: string;
    parentId: string;
    parentRowSpace: number;
    parentColumnSpace: number;
    leftColumn: number;
    rightColumn: number;
    topRow: number;
    bottomRow: number;
    isLoading: boolean;
  }>;
}

export interface WidgetUpdateProperty {
  widgetId: string;
  propertyPath: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propertyValue: any;
}

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

export interface ReduxActionWithExtraParams<T> extends ReduxAction<T> {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraParams: Record<any, any>;
}

export interface GenerateCRUDSuccess {
  page: {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layouts: Array<any>;
    id: string;
    baseId: string;
    name: string;
    isDefault?: boolean;
    slug: string;
    description?: string;
  };
  isNewPage: boolean;
}

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

export interface GenerateTemplatePageActionPayload {
  pageId: string;
  tableName: string;
  datasourceId: string;
  applicationId: string;
  columns?: string[];
  searchColumn?: string;
  mode?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pluginSpecificParams?: Record<any, any>;
}

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

export interface DeletePageActionPayload {
  id: string;
}

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

export interface SetDefaultPageActionPayload {
  id: string;
  applicationId: string;
}

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

export interface SetPageOrderActionPayload {
  pageId: string;
  order: number;
  applicationId: string;
}

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

export interface SetupPageActionPayload {
  id: string;
  isFirstLoad?: boolean;
  pageWithMigratedDsl?: FetchPageResponse;
  packagePullStatus?: ApiResponse<PACKAGE_PULL_STATUS>;
}

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

export interface SetupPublishedPageActionPayload {
  pageId: string;
  bustCache: boolean;
  pageWithMigratedDsl?: FetchPageResponse;
}

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
