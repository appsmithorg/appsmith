import ContainerWidget from "../widgets/ContainerWidget"
import { IWidgetProps } from "../widgets/BaseWidget";

export type ActionType = "LOAD_CANVAS" | "CLEAR_CANVAS" | "DROP_WIDGET_CANVAS" | "REMOVE_WIDGET_CANVAS" | "LOAD_WIDGET_PANE"
export const ActionTypes: { [id: string]: ActionType } = {
    LOAD_CANVAS: "LOAD_CANVAS",
    CLEAR_CANVAS: "CLEAR_CANVAS",
    DROP_WIDGET_CANVAS: "DROP_WIDGET_CANVAS",
    REMOVE_WIDGET_CANVAS: "REMOVE_WIDGET_CANVAS",
    LOAD_WIDGET_PANE: "LOAD_WIDGET_PANE",
}

export interface ReduxAction<T> {
    actionType: ActionType
    payload: T
}

export interface LoadCanvasPayload {
    containerWidget: ContainerWidget
}

export interface LoadWidgetPanePayload {
    widgets: IWidgetProps[]
}