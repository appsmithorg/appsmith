import { WidgetProps, WidgetCardProps } from "../widgets/BaseWidget";

export const ReduxActionTypes: { [key: string]: string } = {
  UPDATE_CANVAS: "UPDATE_CANVAS",
  FETCH_CANVAS: "FETCH_CANVAS",
  CLEAR_CANVAS: "CLEAR_CANVAS",
  FETCH_PAGE: "FETCH_PAGE",
  DROP_WIDGET_CANVAS: "DROP_WIDGET_CANVAS",
  REMOVE_WIDGET_CANVAS: "REMOVE_WIDGET_CANVAS",
  LOAD_WIDGET_PANE: "LOAD_WIDGET_PANE",
  ZOOM_IN_CANVAS: "ZOOM_IN_CANVAS",
  ZOOM_OUT_CANVAS: "ZOOM_OUT_CANVAS",
  UNDO_CANVAS_ACTION: "UNDO_CANVAS_ACTION",
  REDO_CANVAS_ACTION: "REDO_CANVAS_ACTION",
  LOAD_WIDGET_CONFIG: "LOAD_WIDGET_CONFIG",
  LOAD_PROPERTY_CONFIG: "LOAD_PROPERTY_CONFIG",
  PUBLISH: "PUBLISH",
  FETCH_WIDGET_CARDS: "FETCH_WIDGET_CARDS",
  SUCCESS_FETCHING_WIDGET_CARDS: "SUCCESS_FETCHING_WIDGET_CARDS",
  ERROR_FETCHING_WIDGET_CARDS: "ERROR_FETCHING_WIDGET_CARDS",
  ADD_PAGE_WIDGET: "ADD_PAGE_WIDGET",
  REMOVE_PAGE_WIDGET: "REMOVE_PAGE_WIDGET",
  LOAD_API_RESPONSE: "LOAD_API_RESPONSE",
  LOAD_QUERY_RESPONSE: "LOAD_QUERY_RESPONSE",
  EXECUTE_ACTION: "EXECUTE_ACTION",
  LOAD_CANVAS_ACTIONS: "LOAD_CANVAS_ACTIONS",
  SAVE_PAGE_INIT: "SAVE_PAGE_INIT",
  SAVE_PAGE_SUCCESS: "SAVE_PAGE_SUCCESS",
  SAVE_PAGE_ERROR: "SAVE_PAGE_ERROR",
  FETCH_PAGE_ERROR: "FETCH_PAGE_ERROR",
  UPDATE_LAYOUT: "UPDATE_LAYOUT",
  WIDGET_ADD_CHILD: "WIDGET_ADD_CHILD",
  WIDGET_REMOVE_CHILD: "WIDGET_REMOVE_CHILD",
  WIDGET_MOVE: "WIDGET_MOVE",
  WIDGET_RESIZE: "WIDGET_RESIZE",
  WIDGET_DELETE: "WIDGET_DELETE",
  SHOW_PROPERTY_PANE: "SHOW_PROPERTY_PANE",
  UPDATE_WIDGET_PROPERTY: "UPDATE_WIDGET_PROPERTY",
};

export type ReduxActionType = (typeof ReduxActionTypes)[keyof typeof ReduxActionTypes];

export interface ReduxAction<T> {
  type: ReduxActionType;
  payload: T;
}

export interface UpdateCanvasPayload {
  pageWidgetId: string;
  widgets: { [widgetId: string]: WidgetProps };
  layoutId: string;
}

export interface ShowPropertyPanePayload {
  widgetId: string;
}

// export interface LoadAPIResponsePayload extends ExecuteActionResponse {}

// export interface LoadQueryResponsePayload extends ExecuteActionResponse {}

export interface LoadWidgetPanePayload {
  widgets: WidgetProps[];
}

export interface LoadWidgetCardsPanePayload {
  cards: { [id: string]: WidgetCardProps[] };
}

export type SavePagePayload = {};
export type SavePageErrorPayload = {};
export type SavePageSuccessPayload = {};
