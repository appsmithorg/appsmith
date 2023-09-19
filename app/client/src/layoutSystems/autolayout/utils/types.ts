import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { WidgetType } from "WidgetProvider/factory";
import type { RenderMode } from "constants/WidgetConstants";
import type {
  FlexLayerAlignment,
  FlexVerticalAlignment,
  ResponsiveBehavior,
} from "layoutSystems/anvil/utils/constants";
import type { ReactNode } from "react";

export interface LayerChild {
  id: string;
  align: FlexLayerAlignment;
}

export interface FlexLayer {
  children: LayerChild[];
}

export type FlexComponentProps = {
  alignment: FlexVerticalAlignment;
  children: ReactNode;
  componentHeight: number;
  componentWidth: number;
  focused?: boolean;
  parentId?: string;
  responsiveBehavior?: ResponsiveBehavior;
  selected?: boolean;
  isResizeDisabled?: boolean;
  widgetId: string;
  widgetName: string;
  widgetType: WidgetType;
  parentColumnSpace: number;
  flexVerticalAlignment: FlexVerticalAlignment;
  isMobile: boolean;
  renderMode: RenderMode;
};

export type AlignmentColumnInfo = {
  [key in FlexLayerAlignment]: number;
};

export type FlexBoxAlignmentColumnInfo = {
  [key: number]: AlignmentColumnInfo;
};

export type AlignmentColumnData = {
  alignment: FlexLayerAlignment;
  columns: number;
};

/**
 * Start: Position utils types
 */

export interface AlignmentChildren {
  widget: FlattenedWidgetProps;
  columns: number;
  rows: number;
}

export interface AlignmentInfo {
  alignment: FlexLayerAlignment;
  columns: number;
  children: AlignmentChildren[];
}

export interface Row extends AlignmentInfo {
  height: number;
}

/**
 * End: Position utils types
 */
