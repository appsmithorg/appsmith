import ContainerWidget from "../widgets/ContainerWidget"
import { IWidgetProps } from "../widgets/BaseWidget"

export type ActionType =
  | "UPDATE_CANVAS"
  | "FETCH_CANVAS"
  | "CLEAR_CANVAS"
  | "DROP_WIDGET_CANVAS"
  | "REMOVE_WIDGET_CANVAS"
  | "LOAD_WIDGET_PANE"
  | "FETCH_PAGE"

export const ActionTypes: { [id: string]: ActionType } = {
  UPDATE_CANVAS: "UPDATE_CANVAS",
  FETCH_CANVAS: "FETCH_CANVAS",
  CLEAR_CANVAS: "CLEAR_CANVAS",
  FETCH_PAGE: "FETCH_PAGE",
  DROP_WIDGET_CANVAS: "DROP_WIDGET_CANVAS",
  REMOVE_WIDGET_CANVAS: "REMOVE_WIDGET_CANVAS",
  LOAD_WIDGET_PANE: "LOAD_WIDGET_PANE"
}

export interface ReduxAction<T> {
  type: ActionType
  payload: T
}

export interface LoadCanvasPayload {
  pageWidgetId: string
  widgets: { [widgetId: string]: IWidgetProps }
}

export interface LoadWidgetPanePayload {
  widgets: IWidgetProps[]
}
