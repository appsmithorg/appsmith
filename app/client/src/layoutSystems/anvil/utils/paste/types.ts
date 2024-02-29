import type { FlattenedWidgetProps } from "WidgetProvider/types";
import type { LayoutProps, WidgetLayoutProps } from "../anvilTypes";
import type { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

export interface WidgetLayoutPositionInfo {
  layoutOrder: string[];
  rowIndex: number;
  widgetLayoutProps: WidgetLayoutProps;
}

export interface CopiedWidgetData {
  hierarchy: number;
  list: FlattenedWidgetProps[];
  parentId: string;
  widgetId: string;
  widgetPositionInfo: WidgetLayoutPositionInfo | null;
}

export interface PasteDestinationInfo {
  alignment: FlexLayerAlignment;
  layoutOrder: LayoutProps[];
  parentOrder: string[];
  rowIndex: number[];
}

export interface PastePayload {
  widgets: CanvasWidgetsReduxState;
  widgetIdMap: Record<string, string>;
  reverseWidgetIdMap: Record<string, string>;
}
