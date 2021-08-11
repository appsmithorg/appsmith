import { WidgetType } from "constants/WidgetConstants";
import {
  EvaluationReduxAction,
  ReduxAction,
  ReduxActionTypes,
  ReduxActionWithoutPayload,
  UpdateCanvasPayload,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { WidgetOperation } from "widgets/BaseWidget";
import { FetchPageRequest, PageLayout, SavePageResponse } from "api/PageApi";
import { UrlDataState } from "reducers/entityReducers/appReducer";
import { APP_MODE } from "entities/App";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { GenerateTemplatePageRequest } from "../api/PageApi";
import { WidgetReduxActionTypes } from "../constants/ReduxActionConstants";

export interface FetchPageListPayload {
  applicationId: string;
  mode: APP_MODE;
}

export const fetchPageList = (
  applicationId: string,
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
  postEvalActions: Array<ReduxAction<unknown> | ReduxActionWithoutPayload>,
): EvaluationReduxAction<undefined> => {
  return {
    type: ReduxActionTypes.FETCH_PAGE_SUCCESS,
    postEvalActions,
    payload: undefined,
  };
};

export const fetchPublishedPageSuccess = (
  postEvalActions: Array<ReduxAction<unknown> | ReduxActionWithoutPayload>,
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
) => {
  return {
    type: ReduxActionTypes.UPDATE_LAYOUT,
    payload: { widgets, isRetry },
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
    },
  };
};

export const clonePageInit = (pageId: string) => {
  return {
    type: ReduxActionTypes.CLONE_PAGE_INIT,
    payload: {
      id: pageId,
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

export type WidgetMove = {
  widgetId: string;
  leftColumn: number;
  topRow: number;
  parentId: string;
  /*
    If newParentId is different from what we have in redux store,
    then we have to delete this,
    as it has been dropped in another container somewhere.
  */
  newParentId: string;
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
  leftColumn: number;
  rightColumn: number;
  topRow: number;
  bottomRow: number;
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
  | WidgetMove
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
): ReduxAction<Record<string, unknown>> => ({
  type: ReduxActionTypes.UPDATE_APP_TRANSIENT_STORE,
  payload,
});

export const updateAppPersistentStore = (
  payload: Record<string, unknown>,
): ReduxAction<Record<string, unknown>> => {
  return {
    type: ReduxActionTypes.UPDATE_APP_PERSISTENT_STORE,
    payload,
  };
};

export interface ReduxActionWithExtraParams<T> extends ReduxAction<T> {
  extraParams: Record<any, any>;
}

export const generateTemplateSuccess = ({
  isNewPage,
  layoutId,
  pageId,
  pageName,
}: {
  layoutId: string;
  pageId: string;
  pageName: string;
  isNewPage: boolean;
}) => {
  return {
    type: ReduxActionTypes.GENERATE_TEMPLATE_PAGE_SUCCESS,
    payload: {
      layoutId,
      pageId,
      pageName,
      isNewPage,
    },
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
