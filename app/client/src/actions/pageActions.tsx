import { FetchPageRequest, SavePageResponse } from "api/PageApi";
import { WidgetOperation, WidgetProps } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import {
  ReduxActionTypes,
  ReduxAction,
  UpdateCanvasPayload,
  FetchPageListPayload,
} from "constants/ReduxActionConstants";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { APP_MODE, UrlDataState } from "reducers/entityReducers/appReducer";

export const fetchPageList = (
  applicationId: string,
): ReduxAction<FetchPageListPayload> => {
  return {
    type: ReduxActionTypes.FETCH_PAGE_LIST_INIT,
    payload: {
      applicationId,
    },
  };
};

export const fetchPage = (pageId: string): ReduxAction<FetchPageRequest> => {
  return {
    type: ReduxActionTypes.FETCH_PAGE_INIT,
    payload: {
      id: pageId,
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

export const fetchPageSuccess = () => {
  return {
    type: ReduxActionTypes.FETCH_PAGE_SUCCESS,
  };
};

export type FetchPublishedPageSuccessPayload = {
  pageId: string;
  dsl: ContainerWidgetProps<WidgetProps>;
  pageWidgetId: string;
};

export const fetchPublishedPageSuccess = (
  payload: FetchPublishedPageSuccessPayload,
) => ({
  type: ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS,
  payload,
});

export const updateCurrentPage = (id: string) => ({
  type: ReduxActionTypes.SWITCH_CURRENT_PAGE_ID,
  payload: { id },
});

export const updateCanvas = (
  payload: UpdateCanvasPayload,
): ReduxAction<UpdateCanvasPayload> => {
  return {
    type: ReduxActionTypes.UPDATE_CANVAS,
    payload,
  };
};

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

export const updateAndSaveLayout = (widgets: CanvasWidgetsReduxState) => {
  return {
    type: ReduxActionTypes.UPDATE_LAYOUT,
    payload: { widgets },
  };
};

export const createPage = (applicationId: string, pageName: string) => {
  AnalyticsUtil.logEvent("CREATE_PAGE", {
    pageName,
  });
  return {
    type: ReduxActionTypes.CREATE_PAGE_INIT,
    payload: {
      applicationId,
      name: pageName,
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

export const updatePage = (id: string, name: string) => {
  return {
    type: ReduxActionTypes.UPDATE_PAGE_INIT,
    payload: {
      id,
      name,
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

export const updateWidget = (
  operation: WidgetOperation,
  widgetId: string,
  payload: any,
): ReduxAction<
  WidgetAddChild | WidgetMove | WidgetResize | WidgetDelete | WidgetAddChildren
> => {
  return {
    type: ReduxActionTypes["WIDGET_" + operation],
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
): ReduxAction<Record<string, unknown>> => {
  return {
    type: ReduxActionTypes.UPDATE_APP_STORE,
    payload,
  };
};
