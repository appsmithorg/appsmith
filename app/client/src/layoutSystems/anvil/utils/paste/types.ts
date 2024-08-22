import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

import type { LayoutProps } from "../anvilTypes";
import type { WidgetLayoutPositionInfo } from "../layouts/widgetPositionUtils";

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
