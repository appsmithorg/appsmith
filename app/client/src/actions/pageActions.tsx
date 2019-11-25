import { FetchPageRequest } from "api/PageApi";
import { WidgetProps, WidgetOperation } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import {
  ReduxActionTypes,
  ReduxAction,
  UpdateCanvasPayload,
  SavePagePayload,
  SavePageSuccessPayload,
  FetchPageListPayload,
} from "constants/ReduxActionConstants";
import { ContainerWidgetProps } from "widgets/ContainerWidget";

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
      pageId: pageId,
    },
  };
};
export const fetchPageSuccess = () => {
  return {
    type: ReduxActionTypes.FETCH_PAGE_SUCCESS,
  };
};

export const addWidget = (
  pageId: string,
  widget: WidgetProps,
): ReduxAction<{ pageId: string; widget: WidgetProps }> => {
  return {
    type: ReduxActionTypes.ADD_PAGE_WIDGET,
    payload: {
      pageId,
      widget,
    },
  };
};

export const removeWidget = (
  pageId: string,
  widgetId: string,
): ReduxAction<{ pageId: string; widgetId: string }> => {
  return {
    type: ReduxActionTypes.REMOVE_PAGE_WIDGET,
    payload: {
      pageId,
      widgetId,
    },
  };
};

export const updateCanvas = (
  payload: UpdateCanvasPayload,
): ReduxAction<UpdateCanvasPayload> => {
  return {
    type: ReduxActionTypes.UPDATE_CANVAS,
    payload,
  };
};

export const savePage = (
  pageId: string,
  layoutId: string,
  dsl: ContainerWidgetProps<WidgetProps>,
): ReduxAction<SavePagePayload> => {
  return {
    type: ReduxActionTypes.SAVE_PAGE_INIT,
    payload: { pageId, layoutId, dsl },
  };
};

export const savePageSuccess = (payload: SavePageSuccessPayload) => {
  return {
    type: ReduxActionTypes.SAVE_PAGE_SUCCESS,
    payload,
  };
};

export type WidgetAddChild = {
  widgetId: string;
  type: WidgetType;
  leftColumn: number;
  topRow: number;
  columns: number;
  rows: number;
  parentRowSpace: number;
  parentColumnSpace: number;
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
  widgetId: string;
  parentId: string;
};

export type WidgetResize = {
  widgetId: string;
  leftColumn: number;
  rightColumn: number;
  topRow: number;
  bottomRow: number;
};

export const updateWidget = (
  operation: WidgetOperation,
  widgetId: string,
  payload: any,
): ReduxAction<
  WidgetAddChild | WidgetMove | WidgetRemoveChild | WidgetResize | WidgetDelete
> => {
  return {
    type: ReduxActionTypes["WIDGET_" + operation],
    payload: { widgetId, ...payload },
  };
};
