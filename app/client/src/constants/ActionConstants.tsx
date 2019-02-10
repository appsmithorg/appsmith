import ContainerWidget from "../widgets/ContainerWidget"

export type ActionType = "LOAD_CANVAS" | "CLEAR_CANVAS" | "DROP_WIDGET_CANVAS" | "REMOVE_WIDGET_CANVAS"
export const ActionTypes = {
    LOAD_CANVAS: "LOAD_CANVAS",
    CLEAR_CANVAS: "CLEAR_CANVAS",
    DROP_WIDGET_CANVAS: "DROP_WIDGET_CANVAS",
    REMOVE_WIDGET_CANVAS: "REMOVE_WIDGET_CANVAS"
}

export interface ReduxAction<T> {
    actionType: ActionType
    payload: T
}

export interface LoadCanvasPayload {
    containerWidget: ContainerWidget
}