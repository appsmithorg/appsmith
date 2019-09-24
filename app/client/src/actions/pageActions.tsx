import { FetchPageRequest } from "../api/PageApi";
import { ResponseMeta } from "../api/ApiResponses";
import { RenderMode } from "../constants/WidgetConstants";
import { WidgetProps, WidgetOperation } from "../widgets/BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import {
  ReduxActionTypes,
  ReduxAction,
  UpdateCanvasPayload,
  SavePagePayload,
  SavePageErrorPayload,
  SavePageSuccessPayload,
} from "../constants/ReduxActionConstants";
import { ContainerWidgetProps } from "../widgets/ContainerWidget";

export const fetchPage = (
  pageId: string,
  renderMode: RenderMode,
): ReduxAction<FetchPageRequest> => {
  return {
    type: ReduxActionTypes.FETCH_PAGE,
    payload: {
      pageId: pageId,
      renderMode: renderMode,
    },
  };
};

export const fetchPageError = (payload: ResponseMeta) => {
  return {
    type: ReduxActionTypes.FETCH_PAGE_ERROR,
    payload,
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

export const savePageError = (payload: SavePageErrorPayload) => {
  return {
    type: ReduxActionTypes.SAVE_PAGE_ERROR,
    payload,
  };
};

export type WidgetAddChild = {
  widgetId: string;
  type: WidgetType;
  left: number;
  top: number;
  width: number;
  height: number;
};

export type WidgetMove = {
  widgetId: string;
  left: number;
  top: number;
  /*
    If parentWidgetId is different from what we have in redux store, 
    then we have to delete this,
    as it has been dropped in another container somewhere.    
  */
  parentWidgetId?: string;
};

export type WidgetRemoveChild = {
  widgetId: string;
  childWidgetId: string;
};

export type WidgetDelete = {
  widgetId: string;
};

export type WidgetResize = {
  widgetId: string;
  width: number; // delta/diff
  height: number; // delta/diff
};

export const updateWidget = (
  operation: WidgetOperation,
  widgetId: string,
  payload: any,
): ReduxAction<
  WidgetAddChild | WidgetMove | WidgetRemoveChild | WidgetResize | WidgetDelete
> => {
  console.log(operation, widgetId, payload);
  return {
    type: ReduxActionTypes["WIDGET_" + operation],
    payload: { widgetId, ...payload },
  };
};
