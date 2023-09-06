import type { WidgetOperationParams } from "utils/WidgetPropsUtils";

export type WidgetDraggingBlock = {
  left: number;
  top: number;
  width: number;
  height: number;
  columnWidth: number;
  rowHeight: number;
  widgetId: string;
  isNotColliding: boolean;
  detachFromLayout?: boolean;
  fixedHeight?: number;
  type: string;
};

export interface WidgetDraggingUpdateParams extends WidgetDraggingBlock {
  updateWidgetParams: WidgetOperationParams;
}

export interface SelectedArenaDimensions {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface XYCord {
  x: number;
  y: number;
}
