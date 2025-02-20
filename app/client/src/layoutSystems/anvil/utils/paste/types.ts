import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { WidgetLayoutPositionInfo } from "../layouts/widgetPositionUtils";
import type { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type { LayoutProps } from "../anvilTypes";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";

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
