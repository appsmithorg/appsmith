import { WidgetType } from "constants/WidgetConstants";
import {
  EvaluationReduxAction,
  ReduxAction,
  ReduxActionTypes,
  UpdateCanvasPayload,
  ReduxActionErrorTypes,
  AnyReduxAction,
} from "constants/ReduxActionConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { WidgetOperation } from "widgets/BaseWidget";
import { FetchPageRequest, PageLayout, SavePageResponse } from "api/PageApi";
import { UrlDataState } from "reducers/entityReducers/appReducer";
import { APP_MODE } from "entities/App";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { GenerateTemplatePageRequest } from "../api/PageApi";
import {
  WidgetReduxActionTypes,
  ReplayReduxActionTypes,
} from "constants/ReduxActionConstants";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { Replayable } from "entities/Replay/ReplayEntity/ReplayEditor";

export interface FetchPageListPayload {
  applicationId: string;
  mode: APP_MODE;
}

export interface ClonePageActionPayload {
  id: string;
  blockNavigation?: boolean;
}

export interface CreatePageActionPayload {
  applicationId: string;
  name: string;
  layouts: Partial<PageLayout>[];
  blockNavigation?: boolean;
}

export const fetchPageList = (
  {
    applicationId,
  }: {
    applicationId: string;
  },
  mode: APP_MODE,
): ReduxAction<FetchPageListPayload> => {
  return {
    type: ReduxActionTypes.FETCH_PAGE_LIST_INIT,
    payload: {
      applicationId,
      mode,
    },
  };
};

export const fetchPage = (
  pageId: string,
  isFirstLoad = false,
): ReduxAction<FetchPageRequest> => {
  return {
    type: ReduxActionTypes.FETCH_PAGE_INIT,
    payload: {
      id: pageId,
      isFirstLoad,
    },
  };
};

export const fetchPublishedPage = (pageId: string, bustCache = false) => ({
  type: ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT,
  payload: {
    pageId,
    bustCache,
  },
});

export const fetchPageSuccess = (
  postEvalActions: Array<AnyReduxAction>,
): EvaluationReduxAction<undefined> => {
  return {
    type: ReduxActionTypes.FETCH_PAGE_SUCCESS,
    postEvalActions,
    payload: undefined,
  };
};

export const fetchPublishedPageSuccess = (
  postEvalActions: Array<AnyReduxAction>,
): EvaluationReduxAction<undefined> => ({
  type: ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS,
  postEvalActions,
  payload: undefined,
});

export const updateCurrentPage = (id: string) => ({
  type: ReduxActionTypes.SWITCH_CURRENT_PAGE_ID,
  payload: { id },
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
  isRetry?: boolean,
  shouldReplay?: boolean,
) => {
  return {
    type: ReduxActionTypes.UPDATE_LAYOUT,
    payload: { widgets, isRetry, shouldReplay },
  };
};

export const saveLayout = (isRetry?: boolean) => {
  return {
    type: ReduxActionTypes.SAVE_PAGE_INIT,
    payload: { isRetry },
  };
};

export const createPage = (
  applicationId: string,
  pageName: string,
  layouts: Partial<PageLayout>[],
  blockNavigation?: boolean,
) => {
  AnalyticsUtil.logEvent("CREATE_PAGE", {
    pageName,
  });
  return {
    type: ReduxActionTypes.CREATE_PAGE_INIT,
    payload: {
      applicationId,
      name: pageName,
      layouts,
      blockNavigation,
    },
  };
};

/**
 * action to clone page
 *
 * @param pageId
 * @param blockNavigation
 * @returns
 */
export const clonePageInit = (pageId: string, blockNavigation?: boolean) => {
  return {
    type: ReduxActionTypes.CLONE_PAGE_INIT,
    payload: {
      id: pageId,
      blockNavigation,
    },
  };
};

export const clonePageSuccess = (
  pageId: string,
  pageName: string,
  layoutId: string,
) => {
  return {
    type: ReduxActionTypes.CLONE_PAGE_SUCCESS,
    payload: {
      pageId,
      pageName,
      layoutId,
    },
  };
};

export const updatePage = (id: string, name: string, isHidden: boolean) => {
  return {
    type: ReduxActionTypes.UPDATE_PAGE_INIT,
    payload: {
      id,
      name,
      isHidden,
    },
  };
};

export type WidgetAddChild = {
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
  props?: Record<string, any>;
};

export type WidgetRemoveChild = {
  widgetId: string;
  childWidgetId: string;
};

export type WidgetDelete = {
  widgetId?: string;
  parentId?: string;
  disallowUndo?: boolean;
  isShortcut?: boolean;
};

export type MultipleWidgetDeletePayload = {
  widgetIds: string[];
  disallowUndo?: boolean;
  isShortcut?: boolean;
};

export type WidgetResize = {
  widgetId: string;
  parentId: string;
  leftColumn: number;
  rightColumn: number;
  topRow: number;
  bottomRow: number;
  snapColumnSpace: number;
  snapRowSpace: number;
};

export type ModalWidgetResize = {
  height: number;
  width: number;
  widgetId: string;
  canvasWidgetId: string;
};

export type WidgetAddChildren = {
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
};

export type WidgetUpdateProperty = {
  widgetId: string;
  propertyPath: string;
  propertyValue: any;
};

export const updateWidget = (
  operation: WidgetOperation,
  widgetId: string,
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

export const updateAppTransientStore = (
  payload: Record<string, unknown>,
): EvaluationReduxAction<Record<string, unknown>> => ({
  type: ReduxActionTypes.UPDATE_APP_TRANSIENT_STORE,
  payload,
  postEvalActions: [
    {
      type: ReduxActionTypes.UPDATE_APP_STORE_EVALUATED,
    },
  ],
});

export const updateAppPersistentStore = (
  payload: Record<string, unknown>,
): EvaluationReduxAction<Record<string, unknown>> => {
  return {
    type: ReduxActionTypes.UPDATE_APP_PERSISTENT_STORE,
    payload,
    postEvalActions: [
      {
        type: ReduxActionTypes.UPDATE_APP_STORE_EVALUATED,
      },
    ],
  };
};

export interface ReduxActionWithExtraParams<T> extends ReduxAction<T> {
  extraParams: Record<any, any>;
}

export type GenerateCRUDSuccess = {
  page: {
    layouts: Array<any>;
    id: string;
    name: string;
    isDefault?: boolean;
  };
  isNewPage: boolean;
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
}: GenerateTemplatePageRequest): ReduxActionWithExtraParams<GenerateTemplatePageRequest> => {
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
      operation: ReplayReduxActionTypes.UNDO,
    },
  };
}

export function redoAction() {
  return {
    type: ReduxActionTypes.UNDO_REDO_OPERATION,
    payload: {
      operation: ReplayReduxActionTypes.REDO,
    },
  };
}
/**
 * action for delete page
 *
 * @param pageId
 * @param pageName
 * @returns
 */
export const deletePage = (pageId: string) => {
  return {
    type: ReduxActionTypes.DELETE_PAGE_INIT,
    payload: {
      id: pageId,
    },
  };
};

/**
 * action for set page as default
 *
 * @param pageId
 * @param applicationId
 * @returns
 */
export const setPageAsDefault = (pageId: string, applicationId?: string) => {
  return {
    type: ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_INIT,
    payload: {
      id: pageId,
      applicationId,
    },
  };
};

/**
 * action for updating order of a page
 *
 * @param pageId
 * @param applicationId
 * @returns
 */
export const setPageOrder = (
  applicationId: string,
  pageId: string,
  order: number,
) => {
  return {
    type: ReduxActionTypes.SET_PAGE_ORDER_INIT,
    payload: {
      pageId: pageId,
      order: order,
      applicationId,
    },
  };
};
