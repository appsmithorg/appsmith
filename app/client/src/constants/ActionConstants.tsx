// import ContainerWidget from "../widgets/ContainerWidget"
import { WidgetProps, WidgetCardProps } from "../widgets/BaseWidget";

export type ActionType =
  | "UPDATE_CANVAS"
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
  | "REMOVE_PAGE_WIDGET";

export const ActionTypes: { [id: string]: ActionType } = {
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
  PUBLISH: "PUBLISH",
  FETCH_WIDGET_CARDS: "FETCH_WIDGET_CARDS",
  SUCCESS_FETCHING_WIDGET_CARDS: "SUCCESS_FETCHING_WIDGET_CARDS",
  ERROR_FETCHING_WIDGET_CARDS: "ERROR_FETCHING_WIDGET_CARDS",
  ADD_PAGE_WIDGET: "ADD_PAGE_WIDGET",
  REMOVE_PAGE_WIDGET: "REMOVE_PAGE_WIDGET",
};

export interface ReduxAction<T> {
  type: ActionType;
  payload: T;
}

export interface LoadCanvasPayload {
  pageWidgetId: string;
  widgets: { [widgetId: string]: WidgetProps };
}

export interface LoadWidgetPanePayload {
  widgets: WidgetProps[];
}

export interface LoadWidgetCardsPanePayload {
  cards: { [id: string]: WidgetCardProps[] };
}
