import type { LayoutElementPosition } from "layoutSystems/common/types";
import type { WidgetNameState } from "./WidgetNameConstants";

export type WIDGET_NAME_TYPE = "selected" | "focused";

//Contains the data of widget which are required to draw widget names on canvas
export interface WidgetNameData {
  id: string;
  position: LayoutElementPosition;
  widgetName: string;
  parentId: string;
  nameState: WidgetNameState;
  dragDisabled: boolean;
}

//Position of the widget name on canvas, required to enable interaction on canvas
export interface WidgetNamePositionData {
  left: number;
  top: number;
  width: number;
  height: number;
  widgetNameData: WidgetNameData;
}

//Position of canvas with respect to client browser
export interface CanvasPositions {
  top: number;
  left: number;
  xDiff: number;
  width: number;
  yDiff: number;
  height: number;
}

export interface WidgetNamePositionType {
  selected: Record<string, WidgetNamePositionData | undefined>;
  focused: Record<string, WidgetNamePositionData | undefined>;
}
