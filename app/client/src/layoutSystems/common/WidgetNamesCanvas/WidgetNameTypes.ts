import type { WidgetPosition } from "reducers/entityReducers/widgetPositionsReducer";

//Indicates the state of widget name
export enum WidgetNameState {
  NORMAL = "NORMAL",
  ERROR = "ERROR",
  FOCUSED = "FOCUSED",
}

//Contains the data of widget which are required to draw widget names on canvas
export type WidgetNameData = {
  id: string;
  position: WidgetPosition;
  widgetName: string;
  parentId: string;
  nameState: WidgetNameState;
  dragDisabled: boolean;
};

//Position of the widget name on canvas, required to enable interaction on canvas
export type WidgetNamePositionData = {
  left: number;
  top: number;
  width: number;
  height: number;
  widgetNameData: WidgetNameData;
};

//Position of canvas with respect to client browser
export type CanvasPositions = {
  top: number;
  left: number;
  xDiff: number;
  width: number;
  yDiff: number;
  height: number;
};
