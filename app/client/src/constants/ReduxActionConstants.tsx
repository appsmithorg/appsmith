// import ContainerWidget from "../widgets/ContainerWidget"
import { WidgetProps, WidgetCardProps } from "../widgets/BaseWidget";
import { ExecuteActionResponse } from "../api/ActionAPI";

export type ReduxActionType =
  | "LOAD_CANVAS_WIDGETS"
  | "FETCH_CANVAS"
  | "CLEAR_CANVAS"
  | "DROP_WIDGET_CANVAS"
  | "REMOVE_WIDGET_CANVAS"
  | "LOAD_WIDGET_PANE"
  | "FETCH_PAGE"
  | "ZOOM_IN_CANVAS"
  | "ZOOM_OUT_CANVAS"
  | "PUBLISH"
  | "UNDO_CANVAS_ACTION"
  | "REDO_CANVAS_ACTION"
  | "FETCH_WIDGET_CARDS"
  | "SUCCESS_FETCHING_WIDGET_CARDS"
  | "ERROR_FETCHING_WIDGET_CARDS"
  | "ADD_PAGE_WIDGET"
  | "REMOVE_PAGE_WIDGET"
  | "LOAD_WIDGET_CONFIG"
  | "LOAD_API_RESPONSE"
  | "LOAD_QUERY_RESPONSE"
  | "EXECUTE_ACTION"
  | "LOAD_CANVAS_ACTIONS";

export const ReduxActionTypes: { [id: string]: ReduxActionType } = {
  LOAD_CANVAS_WIDGETS: "LOAD_CANVAS_WIDGETS",
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
};

export interface ReduxAction<T> {
  type: ReduxActionType;
  payload: T;
}

export interface LoadCanvasWidgetsPayload {
  pageWidgetId: string;
  widgets: { [widgetId: string]: WidgetProps };
}

export interface LoadWidgetConfigPayload {
  [widgetId: string]: WidgetProps;
}

// export interface LoadAPIResponsePayload extends ExecuteActionResponse {}

// export interface LoadQueryResponsePayload extends ExecuteActionResponse {}

export interface LoadWidgetPanePayload {
  widgets: WidgetProps[];
}

export interface LoadWidgetCardsPanePayload {
  cards: { [id: string]: WidgetCardProps[] };
}
